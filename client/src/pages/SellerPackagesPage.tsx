import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle2, Clock, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { listDeliveries } from "@/lib/api";
import type { Delivery } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

export default function SellerPackagesPage() {
  const { profile } = useStore();
  const [, setLocation] = useLocation();
  const [deliveriesList, setDeliveriesList] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const loadDeliveries = async () => {
    if (!profile?.id) return;
    try {
      setIsLoading(true);
      const list = await listDeliveries({ sellerId: profile.id });
      setDeliveriesList(list.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
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
    switch (status) { case 'delivered': return 'bg-green-500'; case 'in_transit': return 'bg-blue-500'; default: return 'bg-amber-500'; }
  };
  const getStatusLabel = (status: string | null) => {
    switch (status) { case 'delivered': return 'Livré'; case 'in_transit': return 'En cours'; default: return 'En attente'; }
  };
  const getStatusIcon = (status: string | null) => {
    switch (status) { case 'delivered': return <CheckCircle2 className="h-5 w-5" />; case 'in_transit': return <Truck className="h-5 w-5" />; default: return <Clock className="h-5 w-5" />; }
  };

  const filteredDeliveries = filter === 'all' ? deliveriesList : deliveriesList.filter(d => d.status === filter);
  const counts = {
    all: deliveriesList.length,
    pending: deliveriesList.filter(d => d.status === 'pending').length,
    in_transit: deliveriesList.filter(d => d.status === 'in_transit').length,
    delivered: deliveriesList.filter(d => d.status === 'delivered').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-secondary" data-testid="text-packages-title">Mes Colis</h1>
          <p className="text-xs text-gray-500 font-medium">{deliveriesList.length} livraison{deliveriesList.length !== 1 ? 's' : ''}</p>
        </div>
        <Button
          onClick={() => setLocation("/")}
          className="bg-primary text-secondary hover:bg-primary/90 font-black uppercase tracking-wider text-xs rounded-xl h-10 px-5"
          data-testid="button-new-order"
        >
          + Nouveau
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'Tous', count: counts.all },
          { key: 'pending', label: 'En attente', count: counts.pending },
          { key: 'in_transit', label: 'En cours', count: counts.in_transit },
          { key: 'delivered', label: 'Livré', count: counts.delivered },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
              filter === f.key
                ? 'bg-secondary text-white shadow-lg'
                : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
            }`}
            data-testid={`filter-${f.key}`}
          >
            {f.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-white/20' : 'bg-gray-100'}`}>{f.count}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-gray-400 mt-4 uppercase tracking-widest">Chargement...</p>
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 space-y-4 bg-white rounded-3xl border border-gray-100"
        >
          <Package className="h-14 w-14 text-gray-200 mx-auto" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Aucun colis</p>
          <Button onClick={() => setLocation("/")} variant="outline" className="rounded-xl font-bold" data-testid="button-create-first">
            Envoyer un colis
          </Button>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filteredDeliveries.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 space-y-3"
                data-testid={`card-delivery-${d.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${getStatusColor(d.status)} text-white p-2 rounded-xl`}>
                      {getStatusIcon(d.status)}
                    </div>
                    <div>
                      <h3 className="font-black text-secondary text-base" data-testid={`text-name-${d.id}`}>{d.customerName}</h3>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Phone className="h-3 w-3" />
                        <span className="text-[11px] font-medium">{d.customerPhone}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(d.status)} text-white text-[9px] font-black uppercase`}>
                    {getStatusLabel(d.status)}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <p className="text-xs font-medium truncate">{d.deliveryAddress}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">#{d.id.substring(0, 8)}</span>
                  <div className="flex items-center gap-3">
                    {parseFloat(d.articlePrice || "0") > 0 && (
                      <span className="text-xs text-gray-500 font-bold">{parseFloat(d.articlePrice || "0").toLocaleString()} FC</span>
                    )}
                    <span className="text-sm font-black text-secondary" data-testid={`text-fee-${d.id}`}>
                      {parseFloat(d.deliveryFee || "0").toLocaleString()} FC
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
