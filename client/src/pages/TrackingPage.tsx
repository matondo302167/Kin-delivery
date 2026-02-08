import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { getDeliveryTracking } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Search, Truck, CheckCircle2, Clock, Package, ShieldAlert, ArrowLeft, MapPin, Phone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import type { Delivery } from "@shared/schema";
import kolisaLogo from "@/assets/kolisa-logo.png";

type TrackingData = Delivery & {
  driverName?: string;
  driverPhone?: string;
  vehicleType?: string;
  vehicleColor?: string;
  driverAvatarUrl?: string;
  driverLat?: number;
  driverLng?: number;
};

export default function TrackingPage() {
  const [, setLocation] = useLocation();
  const [searchId, setSearchId] = useState("");
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || params.get("token");
    if (id) { setSearchId(id); handleSearch(id); }
  }, []);

  useEffect(() => {
    if (!trackingData || trackingData.status === 'delivered') return;
    const interval = setInterval(() => {
      handleSearch(trackingData.id);
    }, 15000);
    return () => clearInterval(interval);
  }, [trackingData?.id, trackingData?.status]);

  const handleSearch = async (id?: string) => {
    const idToSearch = id || searchId;
    if (!idToSearch) return;
    setIsSearching(true);
    setNotFound(false);
    try {
      const data = await getDeliveryTracking(idToSearch);
      setTrackingData(data);
    } catch (err) {
      setTrackingData(null);
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

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
          <img src={kolisaLogo} alt="KOLISA" className="h-8 w-8 object-contain" />
          <h1 className="text-xl font-black tracking-tighter text-secondary">KOLISA</h1>
          <span className="text-xs font-bold text-primary ml-1">Tracking</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setLocation('/welcome')} className="text-gray-500 font-bold text-xs" data-testid="button-back">
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
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Livraison #{trackingData.id.substring(0, 8)}</p>
                    <h3 className="text-xl font-black text-secondary mt-1" data-testid="text-status-title">
                      {trackingData.status === 'delivered' ? 'Livré avec succès' : trackingData.status === 'in_transit' ? "En cours d'acheminement" : 'En préparation'}
                    </h3>
                  </div>
                  <Badge className={cn("px-4 py-1.5 rounded-full text-xs font-black uppercase",
                    trackingData.status === 'delivered' ? "bg-green-500 text-white" :
                    trackingData.status === 'in_transit' ? "bg-blue-500 text-white" : "bg-amber-500 text-white"
                  )} data-testid="badge-status">
                    {trackingData.status === 'delivered' ? 'Livré' : trackingData.status === 'in_transit' ? 'En route' : 'En attente'}
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
                            <p className="text-[10px] text-blue-500 font-bold mt-1 animate-pulse">En direct</p>
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
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center overflow-hidden">
                      {trackingData.driverAvatarUrl ? (
                        <img src={trackingData.driverAvatarUrl} alt="Driver" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-7 w-7 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-secondary text-base" data-testid="text-driver-name">
                        {trackingData.driverName || "Livreur Kolisa"}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium" data-testid="text-vehicle-info">
                        {vehicleLabel(trackingData.vehicleType, trackingData.vehicleColor)}
                      </p>
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
    </div>
  );
}
