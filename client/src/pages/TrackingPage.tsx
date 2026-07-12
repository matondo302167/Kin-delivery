import { useState, useEffect, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { getDeliveryTracking, rateDelivery } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Search, Truck, CheckCircle2, Clock, Package, ShieldAlert, ArrowLeft, MapPin, Phone, User, Star, PartyPopper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import type { Delivery } from "@shared/schema";
import KolisaLogo from "@/components/KolisaLogo";
import confetti from "canvas-confetti";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useDeliveryUpdates, type DeliveryUpdate } from "@/hooks/use-delivery-updates";

type TrackingData = Delivery & {
  driverName?: string;
  driverPhone?: string;
  vehicleType?: string;
  vehicleColor?: string;
  driverAvatarUrl?: string;
  driverLat?: number;
  driverLng?: number;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  driverRating?: number | null;
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function estimateMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / 400));
}

export default function TrackingPage() {
  const [, setLocation] = useLocation();
  const BASE = import.meta.env.BASE_URL || "/";
  const [searchId, setSearchId] = useState("");
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isRating, setIsRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [prevDriverPos, setPrevDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const deliveryMarkerRef = useRef<any>(null);
  const confettiFired = useRef(false);

   useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     const id = params.get("id") || params.get("token");
     if (id) { setSearchId(id); handleSearch(id); }
   }, []);

  useEffect(() => {
    if (trackingData?.status === 'delivered' && !confettiFired.current) {
      confettiFired.current = true;
      setShowDeliveredModal(true);
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FFD600', '#1B5E20', '#4CAF50', '#FFC107'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD600', '#1B5E20'],
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#4CAF50', '#FFC107'],
        });
      }, 500);
    }
  }, [trackingData?.status]);

  useEffect(() => {
    if (!trackingData?.driverLat || !trackingData?.driverLng) return;
    if (trackingData.status === 'delivered') return;

    const driverPos: [number, number] = [trackingData.driverLat, trackingData.driverLng];
    const deliveryPos: [number, number] | null =
      trackingData.deliveryLat && trackingData.deliveryLng
        ? [trackingData.deliveryLat, trackingData.deliveryLng]
        : null;

    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(driverPos, 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    const motoIcon = L.divIcon({
      html: `<div style="background:#1B5E20;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:3px solid #FFD600;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>
      </div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker(driverPos, { icon: motoIcon }).addTo(map);
    } else {
      driverMarkerRef.current.setLatLng(driverPos);
    }

    if (deliveryPos) {
      const destIcon = L.divIcon({
        html: `<div style="background:#EF4444;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="#EF4444"/></svg>
        </div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      if (!deliveryMarkerRef.current) {
        deliveryMarkerRef.current = L.marker(deliveryPos, { icon: destIcon }).addTo(map);
      } else {
        deliveryMarkerRef.current.setLatLng(deliveryPos);
      }

      const bounds = L.latLngBounds([driverPos, deliveryPos]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } else {
      map.setView(driverPos, 15);
    }

    setPrevDriverPos({ lat: trackingData.driverLat, lng: trackingData.driverLng });
  }, [trackingData?.driverLat, trackingData?.driverLng, trackingData?.status]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        driverMarkerRef.current = null;
        deliveryMarkerRef.current = null;
      }
    };
  }, []);

   const handleSearch = async (id?: string) => {
     const idToSearch = id || searchId;
     if (!idToSearch) return;
     setIsSearching(true);
     setNotFound(false);
     try {
       const data = await getDeliveryTracking(idToSearch);
       setTrackingData(data);
       if (data.driverRating && data.driverRating > 0) {
         setRatingSubmitted(true);
         setSelectedRating(data.driverRating);
       }
     } catch (err) {
       setTrackingData(null);
       setNotFound(true);
     } finally {
       setIsSearching(false);
     }
   };

   // Handle WebSocket updates for real-time delivery tracking
   const handleDeliveryUpdate = async (update: DeliveryUpdate) => {
     if (update.type === 'status_change' || update.type === 'delivery_update') {
       // Fetch the latest data to ensure consistency
       if (trackingData?.id) {
         try {
           const updatedData = await getDeliveryTracking(trackingData.id);
           setTrackingData(updatedData);
         } catch (err) {
           console.error('Failed to fetch updated delivery:', err);
         }
       }
     } else if (update.type === 'location_update') {
       // Update driver location in real-time without full fetch
       if (trackingData && update.driverId === trackingData.driverId) {
         setTrackingData(prev => prev ? {
           ...prev,
           driverLat: update.latitude,
           driverLng: update.longitude
         } : null);
       }
     }
   };

   // Connect to WebSocket for real-time updates when we have a tracking ID
   useDeliveryUpdates(trackingData?.id, undefined, handleDeliveryUpdate);

  const handleRate = async () => {
    if (!trackingData || selectedRating === 0) return;
    setIsRating(true);
    try {
      await rateDelivery(trackingData.id, selectedRating);
      setRatingSubmitted(true);
    } catch (err) {
      console.error("Rating failed:", err);
    } finally {
      setIsRating(false);
    }
  };

  const distance = useMemo(() => {
    if (!trackingData?.driverLat || !trackingData?.driverLng || !trackingData?.deliveryLat || !trackingData?.deliveryLng) return null;
    return haversineDistance(trackingData.driverLat, trackingData.driverLng, trackingData.deliveryLat, trackingData.deliveryLng);
  }, [trackingData?.driverLat, trackingData?.driverLng, trackingData?.deliveryLat, trackingData?.deliveryLng]);

  const isNearby = distance !== null && distance < 100;

  const steps = [
    { status: "pending", label: "Colis reçu par Kolisa", description: "Votre commande est en cours de préparation", icon: Package },
    { status: "in_transit", label: "Livreur en route", description: "Votre colis est en chemin vers vous", icon: Truck },
    { status: "delivered", label: "Livré avec succès", description: "Votre colis a été livré", icon: CheckCircle2 },
  ];
  const statusOrder = ['pending', 'in_transit', 'delivered'];

  const vehicleLabel = (type?: string, color?: string) => {
    const t = type === 'moto' ? 'Moto' : type === 'car' ? 'Voiture' : type === 'bicycle' ? 'Vélo' : 'Moto';
    return color ? `${t} ${color}` : t;
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans">
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 md:px-16 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <KolisaLogo size="sm" />
          <span className="text-xs font-bold text-primary ml-1">Tracking</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setLocation(`${BASE}welcome`)} className="text-gray-500 font-bold text-xs" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-1" /> Retour
        </Button>
      </header>

      <main className="container mx-auto px-6 md:px-16 py-8 max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-black tracking-tighter text-secondary">Suivre votre colis</h2>
          <p className="text-sm text-gray-500">Entrez l'identifiant reçu par SMS</p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-300" />
            <Input placeholder="ID de livraison" value={searchId} onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-12 h-12 bg-white border border-gray-100 rounded-xl font-bold shadow-sm" data-testid="input-tracking" />
          </div>
          <Button onClick={() => handleSearch()} disabled={isSearching}
            className="h-12 px-6 bg-primary text-secondary rounded-xl font-black uppercase tracking-widest text-xs" data-testid="button-search">
            {isSearching ? "..." : "Chercher"}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {trackingData ? (
            <motion.div key={trackingData.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

              {trackingData.status === 'in_transit' && trackingData.driverLat && trackingData.driverLng && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                  <div ref={mapRef} className="w-full h-56 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/20" data-testid="map-tracking" />

                  {distance !== null && (
                    <div className={cn(
                      "absolute top-3 left-3 rounded-xl px-4 py-2.5 shadow-lg backdrop-blur-md z-[1000]",
                      isNearby ? "bg-green-500/90 text-white" : "bg-white/90 text-secondary"
                    )}>
                      {isNearby ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                          <span className="text-sm font-black">Votre livreur est devant votre porte !</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-primary" />
                          <span className="text-sm font-black">{formatDistance(distance)} · ~{estimateMinutes(distance)} min</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3 bg-green-500/90 text-white rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 z-[1000] shadow-md">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    En direct
                  </div>
                </motion.div>
              )}

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Livraison #{trackingData.id.substring(0, 8)}</p>
                    <h3 className="text-xl font-black text-secondary mt-1" data-testid="text-status-title">
                      {trackingData.status === 'delivered' ? 'Livré avec succès' : trackingData.status === 'in_transit' ? (isNearby ? "Le livreur est arrivé !" : "En cours d'acheminement") : 'En préparation'}
                    </h3>
                  </div>
                  <Badge className={cn("px-4 py-1.5 rounded-full text-xs font-black uppercase",
                    trackingData.status === 'delivered' ? "bg-green-500 text-white" :
                    trackingData.status === 'in_transit' ? (isNearby ? "bg-orange-500 text-white animate-pulse" : "bg-blue-500 text-white") : "bg-amber-500 text-white"
                  )} data-testid="badge-status">
                    {trackingData.status === 'delivered' ? 'Livré' : trackingData.status === 'in_transit' ? (isNearby ? 'Arrivé' : 'En route') : 'En attente'}
                  </Badge>
                </div>

                <div className="relative pl-8 space-y-6">
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-100" />
                  {steps.map((step) => {
                    const Icon = step.icon;
                    const currentIdx = statusOrder.indexOf(trackingData.status || 'pending');
                    const stepIdx = statusOrder.indexOf(step.status);
                    const isCompleted = currentIdx >= stepIdx;
                    const isCurrent = currentIdx === stepIdx;
                    return (
                      <div key={step.status} className="relative flex items-start gap-4">
                        <div className={cn(
                          "absolute -left-5 w-7 h-7 rounded-lg flex items-center justify-center z-10 transition-all",
                          isCompleted ? "bg-primary text-secondary shadow-md" : "bg-gray-100 text-gray-300"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className={cn("ml-4", !isCompleted && "opacity-40")}>
                          <p className={cn("text-sm font-black", isCompleted ? "text-secondary" : "text-gray-400")}>{step.label}</p>
                          <p className="text-[11px] text-gray-500 font-medium">{step.description}</p>
                          {isCurrent && trackingData.status === 'in_transit' && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                              <p className="text-[10px] text-blue-500 font-bold">
                                {isNearby ? "Le livreur est proche de vous !" : distance ? `À ${formatDistance(distance)}` : "En direct"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {trackingData.driverId && trackingData.status === 'in_transit' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 shadow-sm border border-blue-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Votre livreur</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center" data-testid="driver-silhouette">
                      <User className="h-7 w-7 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-secondary text-base" data-testid="text-driver-name">
                        {trackingData.driverName || "Livreur Kolisa"}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium" data-testid="text-vehicle-info">
                        {vehicleLabel(trackingData.vehicleType, trackingData.vehicleColor)}
                      </p>
                      {isNearby && (
                        <p className="text-[10px] text-orange-500 font-black mt-1 animate-pulse">
                          Devant votre porte !
                        </p>
                      )}
                    </div>
                    {trackingData.driverPhone && (
                      <Button variant="outline" size="sm" className="rounded-xl border-blue-100"
                        onClick={() => window.open(`tel:${trackingData.driverPhone}`)} data-testid="button-call-driver">
                        <Phone className="h-4 w-4 text-blue-500" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 space-y-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Destinataire</p>
                  <p className="font-bold text-secondary" data-testid="text-recipient">{trackingData.customerName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Adresse</p>
                  <p className="text-sm text-gray-700 font-medium">{trackingData.deliveryAddress}</p>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-50">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Frais livraison</p>
                    <p className="text-base font-black text-secondary">{parseFloat(trackingData.deliveryFee || "0").toLocaleString()} FC</p>
                  </div>
                  {parseFloat(trackingData.articlePrice || "0") > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400">Prix article</p>
                      <p className="text-base font-black text-secondary">{parseFloat(trackingData.articlePrice || "0").toLocaleString()} FC</p>
                    </div>
                  )}
                </div>
              </div>

              {trackingData.status !== 'delivered' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-amber-50 border-2 border-dashed border-amber-200 rounded-2xl p-5 flex items-start gap-4"
                >
                  <ShieldAlert className="h-8 w-8 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-amber-800">Rappel de sécurité</p>
                    <p className="text-xs text-amber-700 font-medium mt-1">
                      Ne donnez le code secret au livreur <strong>qu'après avoir reçu votre colis</strong> et vérifié son contenu.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : notFound && !isSearching ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-white rounded-2xl border border-gray-50 space-y-4">
              <Package className="h-16 w-16 text-gray-200 mx-auto" />
              <div>
                <p className="text-lg font-black text-secondary">Livraison introuvable</p>
                <p className="text-xs text-gray-400 font-medium mt-1">Vérifiez l'identifiant reçu par SMS</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showDeliveredModal && trackingData?.status === 'delivered' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-6"
            onClick={(e) => e.target === e.currentTarget && ratingSubmitted && setShowDeliveredModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-5"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <PartyPopper className="h-10 w-10 text-green-600" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-secondary">Colis livré avec succès !</h3>
                <p className="text-sm text-gray-500 mt-2">Merci d'avoir utilisé Kolisa</p>
              </div>

              {trackingData.driverName && (
                <p className="text-sm text-gray-600">
                  Livré par <strong className="text-secondary">{trackingData.driverName}</strong>
                </p>
              )}

              {!ratingSubmitted ? (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-gray-600">Comment était la livraison ?</p>
                  <div className="flex justify-center gap-2" data-testid="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setSelectedRating(star)}
                        className="transition-all hover:scale-125 active:scale-95"
                        data-testid={`star-${star}`}
                      >
                        <Star
                          className={cn(
                            "h-9 w-9 transition-colors",
                            star <= selectedRating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={handleRate}
                    disabled={selectedRating === 0 || isRating}
                    className="w-full h-12 bg-primary text-secondary rounded-xl font-black text-sm"
                    data-testid="button-submit-rating"
                  >
                    {isRating ? "..." : "Envoyer ma note"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-7 w-7",
                          star <= selectedRating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-green-600 font-bold">Merci pour votre note !</p>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeliveredModal(false)}
                    className="w-full h-12 rounded-xl font-black text-sm"
                    data-testid="button-close-modal"
                  >
                    Fermer
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
