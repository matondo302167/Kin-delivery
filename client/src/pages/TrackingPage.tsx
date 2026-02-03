import { useState } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Truck, CheckCircle2, Clock, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import customerHero from "@/assets/customer-hero.png";

export default function TrackingPage() {
  const [token, setToken] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const { orders } = useStore();

  const handleSearch = () => {
    const order = orders.find(o => o.trackingToken === token || o.id === token);
    setSearchResult(order || "not_found");
  };

  return (
    <div className="space-y-6">
      <div className="relative h-48 rounded-[2rem] overflow-hidden shadow-2xl mb-8">
        <img src={customerHero} alt="Tracking" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/40 to-transparent flex flex-col justify-end p-8 text-white">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">SUIVRE MON COLIS</h2>
          <p className="text-xs font-bold opacity-80 uppercase tracking-widest mt-1">Où est votre bonheur ?</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-secondary/40" />
          <Input 
            placeholder="Code de suivi..." 
            className="pl-12 h-14 bg-white shadow-xl border-none rounded-2xl focus-visible:ring-secondary" 
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
        <Button onClick={handleSearch} className="h-14 px-8 bg-secondary hover:bg-secondary/90 text-white rounded-2xl shadow-xl shadow-secondary/20">
          GO
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {searchResult && searchResult !== "not_found" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[2rem]">
               <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-8">
                     <Badge className="bg-primary/10 text-primary border-none font-mono text-lg py-1 px-4 rounded-xl">#{searchResult.id}</Badge>
                     <p className="text-xs font-black uppercase text-muted-foreground">{searchResult.status}</p>
                  </div>
                  <div className="space-y-8">
                     <div className="flex gap-4">
                        <div className="bg-secondary p-3 rounded-2xl text-white"><MapPin className="h-6 w-6" /></div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Destination</p>
                           <p className="font-bold text-secondary leading-tight">{searchResult.address}</p>
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
