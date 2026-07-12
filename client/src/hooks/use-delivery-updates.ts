import { useEffect, useRef, useCallback } from 'react';

export interface DeliveryUpdate {
  type: 'delivery_update' | 'status_change' | 'location_update' | 'connected';
  deliveryId?: string;
  driverId?: string;
  status?: string;
  data?: any;
  field?: string;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
}

type UpdateCallback = (update: DeliveryUpdate) => void;

export function useDeliveryUpdates(
  deliveryId?: string,
  driverId?: string,
  onUpdate?: UpdateCallback
) {
  const wsRef = useRef<WebSocket | null>(null);
  const shouldReconnectRef = useRef(false);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;

    const params = new URLSearchParams();
    if (deliveryId) params.append('deliveryId', deliveryId);
    if (driverId) params.append('driverId', driverId);

    const url = `${protocol}//${host}/ws?${params.toString()}`;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        shouldReconnectRef.current = false;
      };

      ws.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data) as DeliveryUpdate;
          if (onUpdate) {
            onUpdate(update);
          }
        } catch (error) {
          console.error('[WebSocket] Parse error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        wsRef.current = null;

        if (!shouldReconnectRef.current) {
          shouldReconnectRef.current = true;
          setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      setTimeout(() => {
        connect();
      }, 3000);
    }
  }, [deliveryId, driverId, onUpdate]);

  useEffect(() => {
    if (deliveryId || driverId) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [deliveryId, driverId, connect]);

  return {
    connected: wsRef.current?.readyState === WebSocket.OPEN,
    disconnect: () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }
  };
}
