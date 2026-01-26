import { useState } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, Truck, CheckCircle2, Clock, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export default function TrackingPage() {
  const [token, setToken] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const { orders } = useStore();

  const handleSearch = () => {
    const order = orders.find(o => o.trackingToken === token || o.id === token);
    setSearchResult(order || "not_found");
  };

  const getStatusStep = (status: string) => {
    switch(status) {
      case 'pending': return 1;
      case 'delivering': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display font-bold text-secondary">Suivre mon colis</h2>
        <p className="text-muted-foreground">Entrez votre code de suivi pour localiser votre livraison.</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Ex: TRK-XXXXXX" 
            className="pl-9 h-12 bg-white shadow-sm border-secondary/20 focus-visible:ring-secondary" 
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
        <Button onClick={handleSearch} className="h-12 px-6 bg-secondary hover:bg-secondary/90 text-white">
          Suivre
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {searchResult === "not_found" && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 text-center bg-white rounded-2xl border-2 border-dashed border-muted"
          >
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground font-medium">Code introuvable. Vérifiez votre saisie.</p>
          </motion.div>
        )}

        {searchResult && searchResult !== "not_found" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="border-none shadow-xl overflow-hidden bg-white">
              <div className="bg-secondary/5 p-4 border-b border-secondary/10 flex justify-between items-center">
                <span className="text-xs font-bold text-secondary tracking-widest uppercase">ID: {searchResult.id}</span>
                <Badge className={searchResult.status === 'delivered' ? 'bg-green-500' : 'bg-primary text-primary-foreground'}>
                  {searchResult.status === 'pending' ? 'Préparation' : searchResult.status === 'delivering' ? 'En route' : 'Livré'}
                </Badge>
              </div>
              <CardContent className="p-6">
                <div className="relative pb-10">
                  {/* Progress Line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
                  
                  <div className="space-y-10">
                    <StatusStep 
                      icon={Clock} 
                      title="Commande Validée" 
                      active={getStatusStep(searchResult.status) >= 1} 
                      description="Votre commande est prête à être récupérée."
                    />
                    <StatusStep 
                      icon={Truck} 
                      title="En Cours de Livraison" 
                      active={getStatusStep(searchResult.status) >= 2} 
                      description="Le motard est en route vers vous."
                    />
                    <StatusStep 
                      icon={CheckCircle2} 
                      title="Colis Livré" 
                      active={getStatusStep(searchResult.status) >= 3} 
                      description="Livraison terminée avec succès."
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted/30 rounded-xl space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-secondary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Destination</p>
                      <p className="text-sm font-medium">{searchResult.address}</p>
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

function StatusStep({ icon: Icon, title, description, active }: any) {
  return (
    <div className="flex gap-4 relative z-10">
      <div className={`p-2 rounded-full h-9 w-9 flex items-center justify-center transition-colors duration-500 ${active ? 'bg-secondary text-white ring-4 ring-secondary/20' : 'bg-white text-muted-foreground border-2 border-muted'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h4 className={`text-sm font-bold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}
