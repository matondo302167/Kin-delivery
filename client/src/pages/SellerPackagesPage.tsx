import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle2, Clock, MapPin, Phone, ChevronRight, Search, Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { listDeliveries } from "@/lib/api";
import type { Delivery } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function SellerPackagesPage() {
  const { profile, userRole } = useStore();
  const [, setLocation] = useLocation();
  const [deliveriesList, setDeliveriesList] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isPro = userRole === 'pro_seller';

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
  const getStatusBadgeColor = (status: string | null) => {
    switch (status) { case 'delivered': return 'bg-green-100 text-green-700'; case 'in_transit': return 'bg-blue-100 text-blue-700'; default: return 'bg-amber-100 text-amber-700'; }
  };
  const getStatusLabel = (status: string | null) => {
    switch (status) { case 'delivered': return 'Livré'; case 'in_transit': return 'En route'; default: return 'En attente'; }
  };
  const getStatusIcon = (status: string | null) => {
    switch (status) { case 'delivered': return <CheckCircle2 className="h-5 w-5" />; case 'in_transit': return <Truck className="h-5 w-5" />; default: return <Clock className="h-5 w-5" />; }
  };

  const counts = {
    all: deliveriesList.length,
    pending: deliveriesList.filter(d => d.status === 'pending').length,
    in_transit: deliveriesList.filter(d => d.status === 'in_transit').length,
    delivered: deliveriesList.filter(d => d.status === 'delivered').length,
  };

  let filteredDeliveries = filter === 'all' ? deliveriesList : deliveriesList.filter(d => d.status === filter);

  if (searchQuery) {
    filteredDeliveries = filteredDeliveries.filter(d =>
      d.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.customerPhone?.includes(searchQuery) ||
      d.deliveryAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const newOrderPath = isPro ? '/pro-order' : '/';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-secondary" data-testid="text-packages-title">
            {isPro ? 'Suivi des Colis' : 'Mes Colis'}
          </h1>
          <p className="text-xs text-gray-500 font-medium">{deliveriesList.length} livraison{deliveriesList.length !== 1 ? 's' : ''} au total</p>
        </div>
        <Button
          onClick={() => setLocation(newOrderPath)}
          className="bg-primary text-secondary hover:bg-primary/90 font-black uppercase tracking-wider text-xs rounded-xl h-10 px-5"
          data-testid="button-new-order"
        >
          + Nouveau
        </Button>
      </div>

      {isPro && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-center">
            <p className="text-xl font-black text-amber-700">{counts.pending}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">En attente</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 text-center">
            <p className="text-xl font-black text-blue-700">{counts.in_transit}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-blue-500">En route</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 border border-green-100 text-center">
            <p className="text-xl font-black text-green-700">{counts.delivered}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-green-500">Livrés</p>
          </div>
        </div>
      )}

      {isPro && (
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, téléphone, adresse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 pl-10 bg-white border border-gray-100 rounded-xl text-sm font-medium"
            data-testid="input-search-packages"
          />
        </div>
      )}

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
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            {searchQuery ? 'Aucun résultat' : 'Aucun colis'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setLocation(newOrderPath)} variant="outline" className="rounded-xl font-bold" data-testid="button-create-first">
              Envoyer un colis
            </Button>
          )}
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filteredDeliveries.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setLocation(`/tracking?id=${d.id}`)}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 space-y-3 cursor-pointer hover:shadow-md hover:border-primary/20 active:scale-[0.99] transition-all"
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
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[9px] font-black uppercase rounded-full", isPro ? getStatusBadgeColor(d.status) : `${getStatusColor(d.status)} text-white`)}>
                      {getStatusLabel(d.status)}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <p className="text-xs font-medium truncate">{d.deliveryAddress}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">#{d.id.substring(0, 8)}</span>
                    {d.createdAt && (
                      <span className="text-[10px] text-gray-400">
                        {format(new Date(d.createdAt), "dd MMM HH:mm", { locale: fr })}
                      </span>
                    )}
                  </div>
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
