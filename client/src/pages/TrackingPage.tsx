import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { getDelivery } from "@/lib/api";
import type { Delivery } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Truck, CheckCircle2, Clock, Package, Banknote, Wallet, Phone, ShieldCheck, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import customerHero from "@/assets/african-delivery-illustration.png";
import { cn } from "@/lib/utils";

export default function TrackingPage() {
  const [, setLocation] = useLocation();
  const [searchId, setSearchId] = useState("");
  const [foundDelivery, setFoundDelivery] = useState<Delivery | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setSearchId(id);
      handleSearch(id);
    }
  }, []);

  const handleSearch = async (id?: string) => {
    const idToSearch = id || searchId;
    if (!idToSearch) return;
    
    setIsSearching(true);
    setError("");
    try {
      const delivery = await getDelivery(idToSearch);
      setFoundDelivery(delivery);
    } catch (err) {
      setError("Livraison introuvable. Vérifiez l'identifiant.");
      setFoundDelivery(null);
    } finally {
      setIsSearching(false);
    }
  };

  const steps = [
    { status: "pending" as const, label: "Préparation", icon: Clock },
    { status: "in_transit" as const, label: "En route", icon: Truck },
    { status: "delivered" as const, label: "Livré", icon: CheckCircle2 },
  ];

  const statusOrder = ['pending', 'picked_up', 'in_transit', 'delivered'];

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
              placeholder="ID de livraison" 
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="pl-12 h-13 bg-white border-2 border-gray-100 rounded-2xl shadow-sm font-bold focus-visible:ring-primary"
            />
          </div>
          <Button onClick={() => handleSearch()} className="h-13 px-8 bg-primary text-secondary rounded-2xl shadow-lg font-black uppercase tracking-widest">
            Rechercher
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {foundDelivery ? (
            <motion.div
              key={foundDelivery.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                 <div>
                    <p className="text-sm text-gray-500 font-medium">Livraison #{foundDelivery.id.substring(0, 8)}</p>
                    <h2 className="text-3xl font-black text-secondary">
                      {foundDelivery.status === 'delivered' ? 'Livré avec succès' : 
                       foundDelivery.status === 'in_transit' ? "En cours d'acheminement" : 
                       foundDelivery.status === 'picked_up' ? 'Colis ramassé' : 'En préparation'}
                    </h2>
                 </div>
                 <Badge className={cn(
                    "px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest shadow-lg",
                    foundDelivery.status === 'delivered' ? "bg-green-500 text-white" : 
                    foundDelivery.status === 'in_transit' ? "bg-blue-500 text-white" : "bg-amber-500 text-white"
                  )}>
                    {foundDelivery.status === 'delivered' ? 'Livré' : foundDelivery.status === 'in_transit' ? 'En route' : 'En attente'}
                  </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
                   <CardContent className="p-8">
                      <div className="relative">
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-100" />
                        <div className="space-y-8">
                          {steps.map((step, idx) => {
                            const Icon = step.icon;
                            const currentIdx = statusOrder.indexOf(foundDelivery.status || 'pending');
                            const stepIdx = statusOrder.indexOf(step.status);
                            const isCompleted = currentIdx >= stepIdx;
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
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                   </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Destinataire</p>
                        <h3 className="text-lg font-black text-secondary">{foundDelivery.customerName}</h3>
                        <p className="text-sm text-gray-500">{foundDelivery.customerPhone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Adresse de livraison</p>
                        <p className="text-sm font-medium text-gray-700">{foundDelivery.deliveryAddress}</p>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-gray-100">
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground">Frais livraison</p>
                          <p className="text-lg font-black text-secondary">{parseFloat(foundDelivery.deliveryFee || "0").toLocaleString()} FC</p>
                        </div>
                        {parseFloat(foundDelivery.articlePrice || "0") > 0 && (
                          <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground">Prix article</p>
                            <p className="text-lg font-black text-secondary">{parseFloat(foundDelivery.articlePrice || "0").toLocaleString()} FC</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {foundDelivery.status === 'in_transit' && (
                    <div className="p-6 bg-white border-2 border-primary/20 rounded-3xl flex items-center gap-4 border-dashed shadow-sm">
                      <ShieldCheck className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Code de Validation</p>
                        <p className="text-xs font-bold text-gray-500">Préparez le code OTP reçu par SMS.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : searchId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 space-y-6 bg-gray-50 rounded-[3rem]"
            >
              <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto shadow-sm border border-gray-100">
                <Package className="h-12 w-12 text-gray-300" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black text-secondary uppercase italic">Livraison introuvable</p>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Vérifiez l'identifiant de livraison</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
