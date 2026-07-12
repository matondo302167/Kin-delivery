import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';

export interface DeliveryUpdateMessage {
  type: 'delivery_update' | 'status_change' | 'location_update';
  deliveryId: string;
  data: any;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<WebSocket>> = new Map(); // deliveryId -> Set of WebSockets
  private driverClients: Map<string, Set<WebSocket>> = new Map(); // driverId -> Set of WebSockets

  init(httpServer: HttpServer) {
    this.wss = new WebSocketServer({ noServer: true });

    httpServer.on('upgrade', (request, socket, head) => {
      const url = request.url || '';

      if (url.startsWith('/ws')) {
        this.wss!.handleUpgrade(request, socket, head, (ws) => {
          this.handleConnection(ws, url);
        });
      } else {
        socket.destroy();
      }
    });
  }

  private handleConnection(ws: WebSocket, url: string) {
    const params = new URL(`http://localhost${url}`).searchParams;
    const deliveryId = params.get('deliveryId');
    const driverId = params.get('driverId');

    // Subscribe to delivery updates
    if (deliveryId) {
      if (!this.clients.has(deliveryId)) {
        this.clients.set(deliveryId, new Set());
      }
      this.clients.get(deliveryId)!.add(ws);
      console.log(`[WebSocket] Client subscribed to delivery: ${deliveryId}`);
    }

    // Subscribe to driver updates
    if (driverId) {
      if (!this.driverClients.has(driverId)) {
        this.driverClients.set(driverId, new Set());
      }
      this.driverClients.get(driverId)!.add(ws);
      console.log(`[WebSocket] Client subscribed to driver: ${driverId}`);
    }

    ws.on('close', () => {
      if (deliveryId) {
        this.clients.get(deliveryId)?.delete(ws);
      }
      if (driverId) {
        this.driverClients.get(driverId)?.delete(ws);
      }
      console.log(`[WebSocket] Client disconnected`);
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'connected' }));
  }

  notifyDeliveryUpdate(deliveryId: string, message: DeliveryUpdateMessage) {
    const clients = this.clients.get(deliveryId);
    if (clients) {
      const data = JSON.stringify(message);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }
  }

  notifyDriverUpdate(driverId: string, message: any) {
    const clients = this.driverClients.get(driverId);
    if (clients) {
      const data = JSON.stringify(message);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }
  }

  broadcastToDelivery(deliveryId: string, message: any) {
    const clients = this.clients.get(deliveryId);
    if (clients) {
      const data = JSON.stringify(message);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }
  }
}

export const wsManager = new WebSocketManager();

