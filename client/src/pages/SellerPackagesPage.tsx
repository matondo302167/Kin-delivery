import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle2, Clock, ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { listDeliveries } from "@/lib/api";
import type { Delivery } from "@shared/schema";

export default function SellerPackagesPage() {
  const { profile } = useStore();
  const [, setLocation] = useLocation();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDeliveries = async () => {
    if (!profile?.id) return;
    
    try {
      setIsLoading(true);
      const sellerDeliveries = await listDeliveries({ sellerId: profile.id });
      setDeliveries(sellerDeliveries.sort((a, b) => 
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
      ));
    } catch (error) {
      console.error("Failed to load deliveries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(loadDeliveries, 10000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'in_transit': return 'bg-blue-500';
      case 'picked_up': return 'bg-indigo-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'delivered': return 'Livré';
      case 'in_transit': return 'En cours';
      case 'picked_up': return 'Ramassé';
      default: return 'En attente';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="h-4 w-4" />;
      case 'in_transit': return <Truck className="h-4 w-4" />;
      case 'picked_up': return <Truck className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
         <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="-ml-2">
             <ArrowLeft className="h-6 w-6 text-gray-800" />
           </Button>
           <div>
             <h1 className="text-xl font-black text-secondary tracking-tight">Mes Colis</h1>
             <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Historique des livraisons</p>
           </div>
         </div>
         <Button 
           variant="default" 
           className="bg-secondary text-white font-black uppercase tracking-widest text-xs rounded-xl"
           onClick={() => setLocation("/order")}
         >
           Nouvelle course
         </Button>
      </div>

      <div className="p-6 space-y-4">
        {isLoading ? (
          <p className="text-center py-12 text-sm font-bold text-muted-foreground">Chargement...</p>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Package className="h-16 w-16 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-muted-foreground uppercase">Aucun colis pour le moment</p>
            <Button onClick={() => setLocation("/order")} className="bg-secondary text-white">
              Créer une course
            </Button>
          </div>
        ) : (
          deliveries.map(delivery => (
            <Card 
              key={delivery.id} 
              className="border-none shadow-md bg-white rounded-3xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl ${getStatusColor(delivery.status)} bg-opacity-10 flex items-center justify-center`}>
                      <div className={`${getStatusColor(delivery.status)} text-white p-2 rounded-xl`}>
                        {getStatusIcon(delivery.status)}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black text-secondary text-lg uppercase tracking-tight">{delivery.customerName}</h3>
                      <p className="text-[10px] text-gray-500 uppercase font-bold">{delivery.createdAt ? format(new Date(delivery.createdAt), "d MMM yyyy 'à' HH:mm", { locale: fr }) : ""}</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(delivery.status)} text-white text-[9px] font-black uppercase`}>
                    {getStatusLabel(delivery.status)}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 font-medium">{delivery.deliveryAddress}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                      #{delivery.id.substring(0, 8)}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-secondary">{parseFloat(delivery.deliveryFee || "0").toLocaleString()} FC</p>
                      {parseFloat(delivery.articlePrice || "0") > 0 && (
                        <p className="text-[10px] text-gray-500 font-bold">+ {parseFloat(delivery.articlePrice || "0").toLocaleString()} FC article</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
