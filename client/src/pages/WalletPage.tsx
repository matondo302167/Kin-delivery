import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Wallet, History, ArrowDownLeft, AlertTriangle, Package, TrendingUp, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { listTransactions, getDriverStats, getSellerStats } from "@/lib/api";
import type { Transaction } from "@shared/schema";
import { motion } from "framer-motion";

export default function WalletPage() {
  const { profile } = useStore();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [driverStats, setDriverStats] = useState<{ earnings: number; cashToReturn: number; deliveredCount: number } | null>(null);
  const [sellerStats, setSellerStats] = useState<{ totalOrders: number; deliveredCount: number; pendingCount: number; inTransitCount: number; totalArticleRevenue: number; totalDeliveryFees: number; pendingCOD: number } | null>(null);

  const isCourier = profile?.role === 'courier';
  const isSeller = profile?.role === 'seller';

  const loadData = async () => {
    if (!profile?.id) return;
    try {
      setIsLoading(true);
      const txList = await listTransactions(profile.id);
      setTransactions(txList);
      if (isCourier) {
        const stats = await getDriverStats(profile.id);
        setDriverStats({ earnings: stats.earnings, cashToReturn: stats.cashToReturn, deliveredCount: stats.deliveredCount });
      }
      if (isSeller) {
        const stats = await getSellerStats(profile.id);
        setSellerStats(stats);
      }
    } catch (error) {
      console.error("Failed to load wallet data:", error);
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

  const handleWithdraw = () => {
    if (totalBalance <= 0) {
      toast({ title: "Solde insuffisant", description: "Vous n'avez pas de fonds à retirer.", variant: "destructive" });
      return;
    }
    toast({ title: "Demande envoyée", description: "Votre retrait sera traité prochainement." });
  };

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-black tracking-tighter text-secondary" data-testid="text-wallet-title">
        {isCourier ? "Mes Gains" : isSeller ? "Mon Cash" : "Portefeuille"}
      </h2>

      {isSeller && sellerStats && (
        <div className="grid grid-cols-3 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 rounded-2xl p-4 border border-green-100">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              <p className="text-[9px] font-black uppercase tracking-widest text-green-600">Revenus</p>
            </div>
            <p className="text-xl font-black text-green-700" data-testid="text-seller-revenue">
              {sellerStats.totalArticleRevenue.toLocaleString()} <span className="text-[10px]">FC</span>
            </p>
            <p className="text-[9px] text-green-600 font-medium mt-1">{sellerStats.deliveredCount} livré{sellerStats.deliveredCount !== 1 ? 's' : ''}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-600">En cours</p>
            </div>
            <p className="text-xl font-black text-amber-700" data-testid="text-seller-pending-cod">
              {sellerStats.pendingCOD.toLocaleString()} <span className="text-[10px]">FC</span>
            </p>
            <p className="text-[9px] text-amber-600 font-medium mt-1">{sellerStats.inTransitCount} en route</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Package className="h-3.5 w-3.5 text-blue-600" />
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-600">Colis</p>
            </div>
            <p className="text-xl font-black text-blue-700" data-testid="text-seller-total-orders">
              {sellerStats.totalOrders}
            </p>
            <p className="text-[9px] text-blue-600 font-medium mt-1">{sellerStats.totalDeliveryFees.toLocaleString()} FC frais</p>
          </motion.div>
        </div>
      )}

      {isCourier && driverStats && (
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 rounded-2xl p-5 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-green-600" />
              <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Commissions</p>
            </div>
            <p className="text-2xl font-black text-green-700" data-testid="text-driver-earnings">
              {driverStats.earnings.toLocaleString()} <span className="text-sm">FC</span>
            </p>
            <p className="text-[10px] text-green-600 font-medium mt-1">{driverStats.deliveredCount} livraison{driverStats.deliveredCount !== 1 ? 's' : ''}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Cash à rendre</p>
            </div>
            <p className="text-2xl font-black text-amber-700" data-testid="text-driver-cash-return">
              {driverStats.cashToReturn.toLocaleString()} <span className="text-sm">FC</span>
            </p>
            <p className="text-[10px] text-amber-600 font-medium mt-1">Articles encaissés</p>
          </motion.div>
        </div>
      )}

      <Card className="bg-secondary text-white border-none shadow-xl relative overflow-hidden rounded-2xl">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        {isLoading ? (
          <CardContent className="relative z-10 p-8"><p className="text-white/80">Chargement...</p></CardContent>
        ) : (
          <>
            <CardHeader className="relative z-10 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-white/60" />
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-white/60">Solde disponible</CardTitle>
              </div>
              <p className="text-4xl font-black tracking-tighter" data-testid="text-balance">
                {totalBalance.toLocaleString()} <span className="text-2xl">FC</span>
              </p>
            </CardHeader>
            <CardContent className="relative z-10 pt-0">
              <Button variant="ghost" className="bg-white/20 hover:bg-white/30 text-white font-black uppercase h-11 rounded-xl text-xs tracking-widest"
                onClick={handleWithdraw} disabled={totalBalance <= 0} data-testid="button-withdraw">
                <ArrowUpRight className="mr-2 h-4 w-4" /> Retirer
              </Button>
            </CardContent>
          </>
        )}
      </Card>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-2 px-1">
          <History className="h-3.5 w-3.5" /> Historique
        </h3>
        <div className="bg-white rounded-2xl border border-gray-50 shadow-sm">
          <ScrollArea className="h-[300px] w-full p-4">
            {transactions.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-xs font-bold uppercase tracking-widest">Aucune transaction</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0" data-testid={`tx-${tx.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="bg-green-50 p-2 rounded-xl"><ArrowDownLeft className="h-4 w-4 text-green-600" /></div>
                      <div>
                        <p className="font-bold text-sm text-secondary">{tx.description || 'Transaction'}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{tx.createdAt ? format(new Date(tx.createdAt), "dd MMM, HH:mm", { locale: fr }) : ""}</p>
                      </div>
                    </div>
                    <span className="font-black text-green-600 text-sm">+{parseFloat(tx.amount).toLocaleString()} FC</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
