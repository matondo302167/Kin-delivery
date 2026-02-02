import { useStore } from "@/lib/store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Wallet, History, ArrowDownLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function WalletPage() {
  const { balance, orders, withdrawFunds } = useStore();
  const { toast } = useToast();

  const handleWithdraw = () => {
    if (balance <= 0) {
      toast({
        title: "Solde insuffisant",
        description: "Vous n'avez pas de fonds à retirer.",
        variant: "destructive",
      });
      return;
    }

    withdrawFunds();
    toast({
      title: "Retrait effectué !",
      description: "L'argent a été envoyé sur votre compte Mobile Money.",
      className: "bg-green-600 text-white border-none",
    });
  };

  const transactions = orders
    .filter((o) => o.status === "delivered")
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Portefeuille</h2>

      <Card className="bg-secondary text-white border-none shadow-xl relative overflow-hidden">
        {/* Abstract pattern overlay */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

        <CardHeader>
          <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Solde Disponible
          </CardTitle>
          <div className="mt-2">
            <span className="text-4xl font-bold font-mono tracking-tight">
              {balance.toLocaleString()}
            </span>
            <span className="text-lg ml-2 opacity-80">FC</span>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleWithdraw}
            variant="secondary"
            className="w-full bg-white text-secondary hover:bg-white/90 font-bold border-none shadow-sm"
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Retirer (Mobile Money)
          </Button>
          <p className="text-xs text-center text-white/60 mt-3">
            Compatible: M-Pesa, Orange Money, Airtel
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          Historique
        </h3>

        <Card className="border-none shadow-sm">
          <ScrollArea className="h-[300px] w-full rounded-md p-4">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune transaction récente.
              </p>
            ) : (
              <div className="space-y-4">
                {transactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <ArrowDownLeft className="h-4 w-4 text-green-700" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Livraison {t.id}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {format(t.timestamp, "dd MMM, HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600 font-mono">
                      +{t.price.toLocaleString()} FC
                    </span>
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
