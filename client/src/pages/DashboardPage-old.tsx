import { useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Truck, Clock, Phone, KeyRound, Camera, Wallet, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import courierHero from "@/assets/courier-hero.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function DashboardPage() {
  const { orders, markAsDelivering, markAsDelivered } = useStore();
  const { toast } = useToast();
  const [pin, setPin] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [cashCollected, setCashCollected] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAccept = (id: string) => {
    markAsDelivering(id);
    toast({ title: "Mission acceptée", description: "En route pour le ramassage" });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // In a real app, upload to Supabase Storage here
      setPhotoTaken(true);
      toast({ title: "Photo enregistrée", description: "Preuve de livraison ajoutée" });
    }
  };

  const handleDeliver = (order: any) => {
    if (order.paymentMethod === 'cod' && !cashCollected) {
      toast({ title: "Encaissement requis", description: "Veuillez confirmer l'encaissement de l'argent.", variant: "destructive" });
      return;
    }
    
    if (!photoTaken) {
      toast({ title: "Photo requise", description: "Veuillez prendre une photo du colis livré.", variant: "destructive" });
      return;
    }

    if (pin === "1234") {
      markAsDelivered(order.id);
      setPin("");
      setCashCollected(false);
      setPhotoTaken(false);
      setSelectedOrder(null);
      toast({ title: "Livraison validée", description: "Paiement crédité au vendeur" });
    } else {
      toast({ title: "Code PIN invalide", variant: "destructive" });
    }
  };

  const availableOrders = orders.filter(o => o.status === 'pending');
  const myMissions = orders.filter(o => o.status === 'delivering');

  return (
    <div className="space-y-6 pb-20">
      {/* ... Hero Section remains same ... */}
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
                
                {order.paymentMethod === 'cod' && (
                  <div className="bg-green-50 p-3 rounded-xl flex items-center gap-3 border border-green-100">
                    <Banknote className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-green-800">À Encaisser</p>
                      <p className="font-black text-lg text-green-600">{(order.articlePrice + order.price).toLocaleString()} FC</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl border-slate-100 h-12" onClick={() => window.open(`tel:${order.recipientPhone}`)}>
                    <Phone className="mr-2 h-4 w-4" /> Appeler
                  </Button>
                  <Dialog onOpenChange={(open) => !open && setSelectedOrder(null)}>
                    <DialogTrigger asChild>
                      <Button 
                        className="flex-1 rounded-xl bg-primary text-primary-foreground h-12 shadow-lg shadow-primary/20"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Valider
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2rem] p-8 max-w-[90%] w-full overflow-y-auto max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle className="text-center font-black uppercase italic tracking-tighter text-2xl">Validation Sécurisée</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 pt-4 text-center">
                        
                        {/* Step 1: Photo Proof */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-secondary text-left">1. Preuve de livraison</p>
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${photoTaken ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                          >
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                             {photoTaken ? (
                               <>
                                 <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                                 <p className="text-xs font-bold text-green-700">Photo enregistrée</p>
                               </>
                             ) : (
                               <>
                                 <Camera className="h-8 w-8 text-slate-400 mb-2" />
                                 <p className="text-xs font-bold text-slate-400">Prendre une photo du colis</p>
                               </>
                             )}
                          </div>
                        </div>

                        {/* Step 2: Cash Collection (if COD) */}
                        {order.paymentMethod === 'cod' && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary text-left">2. Encaissement</p>
                            <div className="flex items-center space-x-2 bg-green-50 p-4 rounded-2xl border border-green-100">
                              <Checkbox 
                                id="cash-collected" 
                                checked={cashCollected}
                                onCheckedChange={(checked) => setCashCollected(checked as boolean)}
                                className="h-6 w-6 border-green-600 data-[state=checked]:bg-green-600 data-[state=checked]:text-white"
                              />
                              <Label htmlFor="cash-collected" className="text-sm font-bold text-green-900 cursor-pointer flex-1 text-left">
                                J'ai reçu {(order.articlePrice + order.price).toLocaleString()} FC en espèces
                              </Label>
                            </div>
                          </div>
                        )}

                        {/* Step 3: PIN Code */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-secondary text-left">{order.paymentMethod === 'cod' ? '3.' : '2.'} Code PIN Client</p>
                          <div className="bg-primary/10 p-4 rounded-2xl border-2 border-primary/20 border-dashed">
                            <KeyRound className="h-8 w-8 text-primary mx-auto mb-2" />
                            <p className="text-[9px] font-bold text-muted-foreground">Entrez le code reçu par SMS</p>
                          </div>
                          <Input 
                            type="password" 
                            maxLength={4} 
                            placeholder="••••" 
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="text-center text-4xl h-20 font-black tracking-[0.5em] border-none bg-slate-100 rounded-2xl"
                          />
                        </div>

                        <Button className="w-full h-14 rounded-2xl bg-secondary text-white font-black uppercase tracking-widest" onClick={() => handleDeliver(order)}>
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
