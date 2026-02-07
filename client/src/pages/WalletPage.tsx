import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Wallet, History, ArrowDownLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { listTransactions } from "@/lib/api";
import type { Transaction } from "@shared/schema";

export default function WalletPage() {
  const { profile } = useStore();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!profile?.id) return;
    try {
      setIsLoading(true);
      const txList = await listTransactions(profile.id);
      setTransactions(txList);
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
    toast({ title: "Demande envoyée", description: "Votre retrait sera traité dans les prochaines minutes.", className: "bg-green-600 text-white border-none" });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Portefeuille</h2>
      <Card className="bg-secondary text-white border-none shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        {isLoading ? (
          <CardContent className="relative z-10 p-8"><p className="text-white/80">Chargement...</p></CardContent>
        ) : (
          <>
            <CardHeader className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-5 w-5 text-white/80" />
                <CardTitle className="text-sm font-black uppercase tracking-widest text-white/80">Solde disponible</CardTitle>
              </div>
              <p className="text-5xl font-black tracking-tighter" data-testid="text-balance">
                {totalBalance.toLocaleString()} <span className="text-3xl">FC</span>
              </p>
            </CardHeader>
            <CardContent className="relative z-10 flex gap-3 pt-0">
              <Button variant="ghost" className="flex-1 bg-white/20 hover:bg-white/30 text-white font-black uppercase h-12 rounded-xl"
                onClick={handleWithdraw} disabled={totalBalance <= 0} data-testid="button-withdraw">
                <ArrowUpRight className="mr-2 h-5 w-5" /> Retirer
              </Button>
            </CardContent>
          </>
        )}
      </Card>
      <div className="space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2"><History className="h-5 w-5 text-muted-foreground" /> Historique</h3>
        <Card className="border-none shadow-sm">
          <ScrollArea className="h-[300px] w-full rounded-md p-4">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune transaction récente.</p>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0" data-testid={`tx-${tx.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full"><ArrowDownLeft className="h-4 w-4 text-green-700" /></div>
                      <div>
                        <p className="font-medium text-sm">{tx.description || 'Transaction'}</p>
                        <p className="text-xs text-muted-foreground">{tx.createdAt ? format(new Date(tx.createdAt), "dd MMM, HH:mm", { locale: fr }) : ""}</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600 font-mono">+{parseFloat(tx.amount).toLocaleString()} FC</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
