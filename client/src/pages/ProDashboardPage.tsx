import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Wallet, ArrowUpRight, Package, TrendingUp, MapPin, Clock, CheckCircle2, 
  ShieldCheck, QrCode, Filter, Truck, Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getSellerDetails, getSellerStats, listDeliveries, listTransactions } from "@/lib/api";
import type { Delivery, Transaction } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function ProDashboardPage() {
  const { profile } = useStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [shopDetails, setShopDetails] = useState<{ shopName: string; businessAddress?: string; category?: string } | null>(null);
  const [stats, setStats] = useState<{ totalOrders: number; deliveredCount: number; pendingCount: number; inTransitCount: number; totalArticleRevenue: number; totalDeliveryFees: number; pendingCOD: number } | null>(null);
  const [topCommunes, setTopCommunes] = useState<{ name: string; count: number }[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [qrDeliveryId, setQrDeliveryId] = useState<string | null>(null);

  const loadData = async () => {
    if (!profile?.id) return;
    try {
      const [details, statsData, delivList, txList, communesRes] = await Promise.all([
        getSellerDetails(profile.id).catch(() => null),
        getSellerStats(profile.id),
        listDeliveries({ sellerId: profile.id }),
        listTransactions(profile.id),
        fetch(`/api/seller/${profile.id}/top-communes`).then(r => r.json()).catch(() => []),
      ]);
      setShopDetails(details);
      setStats(statsData);
      setDeliveries(delivList);
      setTransactions(txList);
      setTopCommunes(communesRes);
    } catch (error) {
      console.error("Failed to load pro dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  const totalBalance = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const filteredDeliveries = deliveries.filter(d => {
    if (filter === 'all') return true;
    if (filter === 'unpaid') return d.status === 'delivered' && parseFloat(d.articlePrice || "0") > 0;
    return d.status === filter;
  });

  const handleCashOut = () => {
    if (totalBalance <= 0) {
      toast({ title: "Solde insuffisant", description: "Aucun fonds à retirer.", variant: "destructive" });
      return;
    }
    toast({ title: "Demande envoyée", description: "Votre retrait sera traité sous 24h." });
  };

  const statusLabel = (status: string | null) => {
    switch (status) {
      case 'delivered': return 'Livré';
      case 'in_transit': return 'En route';
      case 'pending': return 'En attente';
      default: return status || 'Inconnu';
    }
  };

  const statusColor = (status: string | null) => {
    switch (status) {
      case 'delivered': return 'bg-green-500 text-white';
      case 'in_transit': return 'bg-blue-500 text-white';
      case 'pending': return 'bg-amber-500 text-white';
      default: return 'bg-gray-200 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tighter text-secondary" data-testid="text-shop-name">
              {shopDetails?.shopName || profile?.name || 'Ma Boutique'}
            </h2>
            <Badge className="bg-green-100 text-green-700 border-green-200 font-black text-[10px] uppercase tracking-widest gap-1" data-testid="badge-verified">
              <ShieldCheck className="h-3 w-3" /> Vérifié
            </Badge>
          </div>
          {shopDetails?.category && (
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1" data-testid="text-category">{shopDetails.category}</p>
          )}
          {shopDetails?.businessAddress && (
            <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" /> {shopDetails.businessAddress}
            </p>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="bg-secondary text-white border-none shadow-xl relative overflow-hidden rounded-2xl">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <CardContent className="relative z-10 p-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-white/60" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Solde disponible</p>
              </div>
              <p className="text-3xl font-black tracking-tighter" data-testid="text-balance">
                {totalBalance.toLocaleString()} <span className="text-xl">FC</span>
              </p>
            </div>
            <Button onClick={handleCashOut} disabled={totalBalance <= 0}
              className="bg-primary text-secondary font-black uppercase text-xs tracking-widest h-12 px-6 rounded-xl shadow-lg" data-testid="button-cashout">
              <ArrowUpRight className="mr-2 h-4 w-4" /> Cash Out
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {stats && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-50 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <Package className="h-3.5 w-3.5 text-blue-500" />
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Total colis</p>
            </div>
            <p className="text-2xl font-black text-secondary" data-testid="text-total-orders">{stats.totalOrders}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-50 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Livrés</p>
            </div>
            <p className="text-2xl font-black text-green-600" data-testid="text-delivered">{stats.deliveredCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-50 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Revenus</p>
            </div>
            <p className="text-xl font-black text-secondary" data-testid="text-revenue">{stats.totalArticleRevenue.toLocaleString()} <span className="text-xs">FC</span></p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-50 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">En attente COD</p>
            </div>
            <p className="text-xl font-black text-amber-600" data-testid="text-pending-cod">{stats.pendingCOD.toLocaleString()} <span className="text-xs">FC</span></p>
          </div>
        </motion.div>
      )}

      {topCommunes.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-5 border border-gray-50 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3 flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" /> Top Communes
          </p>
          <div className="space-y-2">
            {topCommunes.map((commune, i) => (
              <div key={commune.name} className="flex items-center justify-between" data-testid={`commune-${i}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-primary w-5">{i + 1}.</span>
                  <span className="text-sm font-bold text-secondary">{commune.name}</span>
                </div>
                <Badge variant="secondary" className="font-black text-xs">{commune.count} colis</Badge>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-2">
            <Package className="h-3.5 w-3.5" /> Mes Colis
          </p>
          <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold h-8"
            onClick={() => setLocation('/seller-packages')} data-testid="button-view-all">
            Voir tout
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'pending', label: 'En attente' },
            { key: 'in_transit', label: 'En cours' },
            { key: 'delivered', label: 'Livrés' },
            { key: 'unpaid', label: 'Non payés' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all",
                filter === f.key ? "bg-secondary text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )} data-testid={`filter-${f.key}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-50 shadow-sm">
          <ScrollArea className="max-h-[400px] w-full">
            {filteredDeliveries.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-xs font-bold uppercase tracking-widest">Aucun colis</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredDeliveries.slice(0, 20).map((d) => (
                  <div key={d.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors" data-testid={`delivery-${d.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-secondary truncate">{d.customerName}</p>
                        <Badge className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full", statusColor(d.status))}>
                          {statusLabel(d.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{d.deliveryAddress}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {parseFloat(d.articlePrice || "0") > 0 && (
                          <span className="text-xs font-bold text-secondary">{parseFloat(d.articlePrice || "0").toLocaleString()} FC</span>
                        )}
                        <span className="text-[10px] text-gray-400">{d.createdAt ? format(new Date(d.createdAt), "dd MMM", { locale: fr }) : ""}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-blue-50"
                        onClick={() => setQrDeliveryId(qrDeliveryId === d.id ? null : d.id)} data-testid={`qr-${d.id}`}>
                        <QrCode className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-100"
                        onClick={() => setLocation(`/tracking?id=${d.id}`)} data-testid={`track-${d.id}`}>
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {qrDeliveryId && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 border-2 border-dashed border-primary/30 text-center" data-testid="qr-display">
            <QrCode className="h-16 w-16 mx-auto text-secondary mb-3" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Code QR Colis</p>
            <p className="text-lg font-black text-secondary font-mono tracking-wider" data-testid="qr-code-text">{qrDeliveryId.substring(0, 8).toUpperCase()}</p>
            <p className="text-[10px] text-gray-400 mt-2">Scannez ou dictez ce code au livreur</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold"
                onClick={() => {
                  navigator.clipboard.writeText(qrDeliveryId);
                  toast({ title: "Copié", description: "ID du colis copié dans le presse-papiers" });
                }}>
                Copier l'ID
              </Button>
              <Button variant="ghost" size="sm" className="rounded-xl text-xs font-bold text-gray-400"
                onClick={() => setQrDeliveryId(null)}>
                Fermer
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
