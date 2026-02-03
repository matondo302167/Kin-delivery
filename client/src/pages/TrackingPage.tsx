import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Truck, CheckCircle2, Clock, Package, Banknote, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import customerHero from "@/assets/customer-hero.png";
import { cn } from "@/lib/utils";

export default function TrackingPage() {
  const [location] = useLocation();
  const [token, setToken] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const { orders } = useStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
      const order = orders.find(o => o.trackingToken === urlToken || o.id === urlToken);
      if (order) setSearchResult(order);
    }
  }, [orders]);

  const handleSearch = () => {
    const order = orders.find(o => o.trackingToken === token || o.id === token);
    setSearchResult(order || "not_found");
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="relative h-56 rounded-[3rem] overflow-hidden shadow-2xl mb-8 group">
        <img src={customerHero} alt="Tracking" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/40 to-transparent flex flex-col justify-end p-10 text-white">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">SUIVI COLIS</h2>
            <p className="text-[10px] font-black opacity-80 uppercase tracking-[0.3em] mt-2">Logistique Kinshasa</p>
          </motion.div>
        </div>
      </div>

      <div className="flex gap-3 px-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-4.5 h-5 w-5 text-secondary/30 group-focus-within:text-secondary transition-colors" />
          <Input 
            placeholder="N° de suivi (TRK...)" 
            className="pl-14 h-15 bg-white shadow-2xl border-none rounded-2xl focus-visible:ring-secondary text-lg font-bold" 
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
        <Button onClick={handleSearch} className="h-15 px-10 bg-secondary hover:bg-secondary/90 text-white rounded-2xl shadow-xl shadow-secondary/30 font-black">
          GO
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {searchResult && searchResult !== "not_found" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-6"
          >
            <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[2.5rem]">
               <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-10">
                     <div className="space-y-1">
                       <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Code Commande</p>
                       <Badge className="bg-primary/10 text-primary border-none font-mono text-xl py-1 px-5 rounded-xl">#{searchResult.id}</Badge>
                     </div>
                     <div className="text-right space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Statut</p>
                        <Badge className="bg-secondary text-white uppercase text-[10px] py-1 px-3 rounded-full">{searchResult.status}</Badge>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                     <div className="p-4 bg-muted/20 rounded-2xl border border-border/50">
                        <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Paiement</p>
                        <div className="flex items-center gap-2">
                           {searchResult.paymentMethod === 'cod' ? <Banknote className="h-4 w-4 text-green-600" /> : <Wallet className="h-4 w-4 text-blue-600" />}
                           <span className="text-xs font-black uppercase">{searchResult.paymentMethod === 'cod' ? 'Cash Delivery' : 'Mobile Money'}</span>
                        </div>
                     </div>
                     <div className="p-4 bg-muted/20 rounded-2xl border border-border/50">
                        <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">À Encaisser</p>
                        <p className="text-sm font-black text-secondary">{searchResult.articlePrice.toLocaleString()} FC</p>
                     </div>
                  </div>

                  <div className="space-y-10 relative">
                     <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-muted/50" />
                     
                     <TrackingStep 
                        icon={Clock} 
                        title="Commande reçue" 
                        desc="Le vendeur a validé la course" 
                        active={true}
                     />
                     <TrackingStep 
                        icon={Truck} 
                        title="Motard en route" 
                        desc="Le colis est transporté" 
                        active={searchResult.status !== 'pending'}
                     />
                     <TrackingStep 
                        icon={CheckCircle2} 
                        title="Livré" 
                        desc="Course terminée" 
                        active={searchResult.status === 'delivered'}
                     />
                  </div>

                  <div className="mt-10 pt-6 border-t border-dashed border-border flex items-center gap-4">
                     <div className="bg-secondary/10 p-4 rounded-2xl text-secondary">
                        <MapPin className="h-6 w-6" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Destination</p>
                        <p className="font-bold text-secondary text-sm">{searchResult.address}</p>
                     </div>
                  </div>
               </CardContent>
            </Card>
          </motion.div>
        )}

        {searchResult === "not_found" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-muted">
            <Package className="h-20 w-20 mx-auto mb-4 text-muted-foreground opacity-10" />
            <p className="font-black text-secondary uppercase tracking-widest">Colis introuvable</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TrackingStep({ icon: Icon, title, desc, active }: any) {
  return (
    <div className="flex gap-6 items-start relative z-10">
       <div className={cn(
         "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-700",
         active ? "bg-secondary text-white shadow-lg shadow-secondary/30 scale-110" : "bg-white text-muted-foreground border-2 border-muted"
       )}>
          <Icon className="h-5 w-5" />
       </div>
       <div>
          <h4 className={cn("text-sm font-black uppercase tracking-tight", active ? "text-secondary" : "text-muted-foreground")}>{title}</h4>
          <p className="text-xs text-muted-foreground/60 font-bold">{desc}</p>
       </div>
    </div>
  );
}
