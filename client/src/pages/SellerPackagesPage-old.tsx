import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle2, Clock, ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function SellerPackagesPage() {
  const { orders } = useStore();
  const [, setLocation] = useLocation();

  // Filter orders (assuming all orders in store are the seller's for this prototype)
  // Sort by newest first
  const myOrders = [...orders].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'delivering': return 'bg-blue-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered': return 'Livré';
      case 'delivering': return 'En cours';
      default: return 'En attente';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="h-4 w-4" />;
      case 'delivering': return <Truck className="h-4 w-4" />;
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
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Historique des envois</p>
           </div>
         </div>
         <Button onClick={() => setLocation("/")} size="sm" className="bg-black text-white rounded-xl font-bold text-xs">
           Nouvelle Course
         </Button>
      </div>

      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        {myOrders.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="font-bold text-gray-500">Aucun colis envoyé pour le moment.</p>
          </div>
        ) : (
          myOrders.map((order) => (
            <Card 
              key={order.id} 
              className="border-none shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl overflow-hidden group cursor-pointer"
              onClick={() => setLocation(`/tracking?token=${order.trackingToken}`)}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 leading-none">{order.recipientName}</h3>
                      <p className="text-xs text-gray-500 mt-1">{format(new Date(order.timestamp), "d MMM, HH:mm", { locale: fr })}</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} border-none text-white font-bold px-3 py-1`}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>

                <div className="pl-[3.25rem] space-y-3">
                   <div className="relative pl-4 border-l-2 border-gray-100 space-y-4 py-1">
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-gray-300 ring-4 ring-white"></div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Destination</p>
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{order.address}</p>
                      </div>
                   </div>

                   <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                     <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Prix</span>
                       <span className="font-black text-lg text-secondary">{(order.price).toLocaleString()} FC</span>
                     </div>
                     <div className="flex flex-col items-end">
                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tracking</span>
                       <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 select-all">{order.trackingToken}</span>
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