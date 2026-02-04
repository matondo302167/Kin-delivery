import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Truck, CheckCircle2, Clock, Package, Banknote, Wallet, Phone, ShieldCheck, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import customerHero from "@/assets/customer-hero.png";
import { cn } from "@/lib/utils";
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix icons for tracking map
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const courierIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export default function TrackingPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const { orders } = useStore();
  const [foundOrder, setFoundOrder] = useState<any>(null);
  const [courierPos, setCourierPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    // Get token from URL search params
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
      // Immediate search if token exists
      const order = orders.find((o) => o.trackingToken === t || o.id === t);
      setFoundOrder(order || null);
    }
  }, [orders]); // Re-run if orders change (unlikely but safe) or on mount

  // Simulate courier movement if delivering
  useEffect(() => {
    if (foundOrder?.status === 'delivering' && foundOrder.lat && foundOrder.lng) {
      const startPos: [number, number] = [foundOrder.lat + 0.01, foundOrder.lng + 0.01];
      setCourierPos(startPos);
      
      const interval = setInterval(() => {
        setCourierPos(prev => {
          if (!prev) return startPos;
          const targetLat = foundOrder.lat!;
          const targetLng = foundOrder.lng!;
          return [
            prev[0] + (targetLat - prev[0]) * 0.1,
            prev[1] + (targetLng - prev[1]) * 0.1
          ];
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [foundOrder]);

  const handleSearch = (searchToken?: string) => {
    const t = searchToken || token;
    const order = orders.find((o) => o.trackingToken === t || o.id === t);
    setFoundOrder(order || null);
    // Update URL without reloading to reflect the search
    if (t && t !== new URLSearchParams(window.location.search).get("token")) {
       window.history.pushState({}, '', `/tracking?token=${t}`);
    }
  };

  const steps = [
    { status: "pending" as const, label: "Préparation", icon: Clock },
    { status: "delivering" as const, label: "En route", icon: Truck },
    { status: "delivered" as const, label: "Livré", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      <header className="bg-white border-b border-gray-100 px-6 md:px-20 py-4 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-black tracking-tighter text-secondary">KOLISA <span className="text-primary font-normal">Tracking</span></h1>
        <Button variant="ghost" onClick={() => setLocation('/welcome')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
      </header>

      <main className="container mx-auto px-6 md:px-20 py-12 max-w-4xl space-y-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-secondary/30" />
            <Input 
              placeholder="Code de suivi (ex: TRK-...)" 
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase())}
              className="pl-12 h-13 bg-white border-2 border-gray-100 rounded-2xl shadow-sm font-bold focus-visible:ring-primary"
            />
          </div>
          <Button onClick={() => handleSearch()} className="h-13 px-8 bg-primary text-secondary rounded-2xl shadow-lg font-black uppercase tracking-widest">
            Rechercher
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {foundOrder ? (
            <motion.div
              key={foundOrder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              {/* Status Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                 <div>
                    <p className="text-sm text-gray-500 font-medium">Colis #{foundOrder.trackingToken}</p>
                    <h2 className="text-3xl font-black text-secondary">
                      {foundOrder.status === 'delivered' ? 'Livré avec succès' : 
                       foundOrder.status === 'delivering' ? 'En cours d\'acheminement' : 'En préparation'}
                    </h2>
                 </div>
                 <Badge className={cn(
                    "px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest shadow-lg",
                    foundOrder.status === 'delivered' ? "bg-green-500 text-white" : 
                    foundOrder.status === 'delivering' ? "bg-blue-500 text-white" : "bg-amber-500 text-white"
                  )}>
                    {foundOrder.status === 'delivered' ? 'Livré' : foundOrder.status === 'delivering' ? 'En route' : 'En attente'}
                  </Badge>
              </div>

              {/* Live Map Tracking */}
              {foundOrder.lat && foundOrder.lng && (
                <Card className="rounded-[2.5rem] overflow-hidden h-96 shadow-2xl border-4 border-white relative z-0">
                  <MapContainer 
                    center={[foundOrder.lat, foundOrder.lng]} 
                    zoom={14} 
                    className="h-full w-full"
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[foundOrder.lat, foundOrder.lng]} />
                    {courierPos && (
                      <>
                        <Marker position={courierPos} icon={courierIcon} />
                        <Polyline positions={[courierPos, [foundOrder.lat, foundOrder.lng]]} color="#facc15" dashArray="10, 10" />
                      </>
                    )}
                  </MapContainer>
                  {foundOrder.status === 'delivering' && (
                    <div className="absolute top-4 left-4 z-[400] bg-primary text-secondary px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-secondary animate-ping" />
                      Livreur en mouvement
                    </div>
                  )}
                </Card>
              )}

              <div className="grid md:grid-cols-2 gap-8">
                {/* Steps */}
                <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
                   <CardContent className="p-8">
                      <div className="relative">
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-100" />
                        <div className="space-y-8">
                          {steps.map((step, idx) => {
                            const Icon = step.icon;
                            const isCompleted = steps.findIndex(s => s.status === foundOrder.status) >= idx;
                            return (
                              <div key={step.status} className="relative flex items-center gap-6">
                                <div className={cn(
                                  "z-10 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
                                  isCompleted ? "bg-primary text-primary-foreground scale-110" : "bg-white text-slate-300 border-2 border-slate-100"
                                )}>
                                  <Icon className="h-6 w-6" />
                                </div>
                                <div>
                                  <p className={cn(
                                    "text-sm font-black uppercase tracking-tight",
                                    isCompleted ? "text-secondary" : "text-slate-300"
                                  )}>{step.label}</p>
                                  {isCompleted && step.status === foundOrder.status && (
                                    <p className="text-[10px] font-bold text-muted-foreground italic">Mise à jour: Il y a 5 min</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                   </CardContent>
                </Card>

                {/* Details */}
                <div className="space-y-6">
                  {foundOrder.status !== 'pending' && (
                    <Card className="border-none shadow-xl bg-secondary text-white rounded-[2rem] overflow-hidden">
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Courier1" alt="Livreur" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Votre Livreur</p>
                          <h3 className="text-lg font-black italic tracking-tight uppercase">Jean-Claude L.</h3>
                          <p className="text-[10px] font-bold text-primary italic">Plaque: KIN 4482 AB</p>
                        </div>
                        <Button size="icon" className="rounded-xl bg-white text-secondary hover:bg-white/90">
                          <Phone className="h-5 w-5" />
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {foundOrder.status === 'delivering' && (
                    <div className="p-6 bg-white border-2 border-primary/20 rounded-3xl flex items-center gap-4 border-dashed shadow-sm">
                      <ShieldCheck className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Code de Validation</p>
                        <p className="text-xs font-bold text-gray-500">Préparez le code PIN reçu par SMS.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : token && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 space-y-6 bg-gray-50 rounded-[3rem]"
            >
              <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto shadow-sm border border-gray-100">
                <Package className="h-12 w-12 text-gray-300" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black text-secondary uppercase italic">Colis introuvable</p>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Vérifiez votre code de suivi (ex: TRK-...)</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
