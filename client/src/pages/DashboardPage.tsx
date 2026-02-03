import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Truck, Clock, Phone, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import courierHero from "@/assets/courier-hero.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  const { orders, markAsDelivering, markAsDelivered } = useStore();
  const { toast } = useToast();
  const [pin, setPin] = useState("");

  const handleAccept = (id: string) => {
    markAsDelivering(id);
    toast({ title: "Mission acceptée", description: "En route pour le ramassage" });
  };

  const handleDeliver = (id: string) => {
    if (pin === "1234") {
      markAsDelivered(id);
      setPin("");
      toast({ title: "Livraison validée", description: "Paiement crédité au vendeur" });
    } else {
      toast({ title: "Code PIN invalide", variant: "destructive" });
    }
  };

  const availableOrders = orders.filter(o => o.status === 'pending');
  const myMissions = orders.filter(o => o.status === 'delivering');

  return (
    <div className="space-y-6 pb-20">
      <div className="relative h-44 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <img src={courierHero} alt="Courier" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 via-secondary/40 to-transparent flex items-center p-8">
          <div className="space-y-2">
            <h2 className="text-white text-4xl font-black italic tracking-tighter uppercase leading-none">MISSIONS</h2>
            <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Mur des courses live</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground px-2">Mes Courses en cours</h3>
        {myMissions.length === 0 ? (
          <p className="text-center py-8 text-xs font-bold text-muted-foreground uppercase border-2 border-dashed border-slate-100 rounded-3xl">Aucune course active</p>
        ) : (
          myMissions.map(order => (
            <Card key={order.id} className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-black italic uppercase tracking-tight text-secondary">{order.recipientName}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{order.address}</p>
                  </div>
                  <Badge className="bg-blue-500 text-white text-[9px] font-black uppercase">En route</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl border-slate-100 h-12" onClick={() => window.open(`tel:${order.recipientPhone}`)}>
                    <Phone className="mr-2 h-4 w-4" /> Appeler
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex-1 rounded-xl bg-primary text-primary-foreground h-12 shadow-lg shadow-primary/20">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Valider
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2rem] p-8 max-w-[90%]">
                      <DialogHeader>
                        <DialogTitle className="text-center font-black uppercase italic tracking-tighter text-2xl">Validation Sécurisée</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 pt-4 text-center">
                        <div className="bg-primary/10 p-4 rounded-2xl border-2 border-primary/20 border-dashed">
                          <KeyRound className="h-8 w-8 text-primary mx-auto mb-2" />
                          <p className="text-[10px] font-black uppercase text-secondary">Code PIN Client</p>
                          <p className="text-[9px] font-bold text-muted-foreground">Entrez le code de 4 chiffres reçu par le client</p>
                        </div>
                        <Input 
                          type="password" 
                          maxLength={4} 
                          placeholder="••••" 
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          className="text-center text-4xl h-20 font-black tracking-[0.5em] border-none bg-slate-100 rounded-2xl"
                        />
                        <Button className="w-full h-14 rounded-2xl bg-secondary text-white font-black uppercase tracking-widest" onClick={() => handleDeliver(order.id)}>
                          Confirmer Livraison
                        </Button>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">Indice pour démo: 1234</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground px-2">Courses Disponibles</h3>
        <div className="grid gap-4">
          {availableOrders.map(order => (
            <Card key={order.id} className="border-none shadow-lg bg-white rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-transform">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Il y a 2 min</span>
                  </div>
                  <span className="text-lg font-black text-secondary">{(order.price).toLocaleString()} FC</span>
                </div>
                <div>
                  <h4 className="font-black italic text-secondary uppercase tracking-tighter text-xl leading-none mb-1">{order.address.split(',')[1] || "Gombe"}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{order.address}</p>
                </div>
                <Button className="w-full h-12 bg-secondary text-white font-black uppercase tracking-widest rounded-xl shadow-xl shadow-secondary/10" onClick={() => handleAccept(order.id)}>
                  Accepter la mission
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
