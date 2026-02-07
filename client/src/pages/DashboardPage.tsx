import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Phone, KeyRound, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import courierHero from "@/assets/courier-illustration.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { listDeliveries, acceptDelivery, updateDeliveryPhoto, validateDelivery, uploadFile } from "@/lib/api";
import type { Delivery } from "@shared/schema";

export default function DashboardPage() {
  const { profile } = useStore();
  const { toast } = useToast();
  const [otpCode, setOtpCode] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([]);
  const [myMissions, setMyMissions] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDeliveries = async () => {
    try {
      setIsLoading(true);
      const [pending, inTransit] = await Promise.all([
        listDeliveries({ status: "pending" }),
        listDeliveries({ driverId: profile?.id, status: "in_transit" }),
      ]);
      setAvailableDeliveries(pending);
      setMyMissions(inTransit);
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

  const handleAccept = async (id: string) => {
    if (!profile?.id) { toast({ title: "Erreur", description: "Profil non trouvé", variant: "destructive" }); return; }
    try {
      await acceptDelivery(id, profile.id);
      toast({ title: "Mission acceptée", description: "En route pour le ramassage" });
      await loadDeliveries();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedDelivery) {
      setIsUploading(true);
      try {
        const file = e.target.files[0];
        const { objectPath } = await uploadFile(file);
        await updateDeliveryPhoto(selectedDelivery.id, objectPath);
        setPhotoUrl(objectPath);
        toast({ title: "Photo enregistrée", description: "Preuve de livraison ajoutée" });
      } catch (error: any) {
        toast({ title: "Erreur photo", description: error.message, variant: "destructive" });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDeliver = async () => {
    if (!selectedDelivery) return;
    if (!photoUrl) { toast({ title: "Photo requise", description: "Prenez une photo du colis", variant: "destructive" }); return; }
    if (otpCode.length !== 6) { toast({ title: "Code OTP invalide", description: "Le code doit contenir 6 chiffres", variant: "destructive" }); return; }
    setIsValidating(true);
    try {
      await validateDelivery(selectedDelivery.id, otpCode, profile?.id);
      setOtpCode(""); setPhotoUrl(""); setSelectedDelivery(null);
      toast({ title: "Livraison validée", description: "Paiement crédité au vendeur" });
      await loadDeliveries();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsValidating(false);
    }
  };

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
        {isLoading ? (
          <p className="text-center py-8 text-xs font-bold text-muted-foreground uppercase">Chargement...</p>
        ) : myMissions.length === 0 ? (
          <p className="text-center py-8 text-xs font-bold text-muted-foreground uppercase border-2 border-dashed border-slate-100 rounded-3xl">Aucune course active</p>
        ) : (
          myMissions.map(d => (
            <Card key={d.id} className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-black italic uppercase tracking-tight text-secondary" data-testid={`text-recipient-${d.id}`}>{d.customerName}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{d.deliveryAddress}</p>
                  </div>
                  <Badge className="bg-blue-500 text-white text-[9px] font-black uppercase">En route</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl border-slate-100 h-12" onClick={() => window.open(`tel:${d.customerPhone}`)}>
                    <Phone className="mr-2 h-4 w-4" /> Appeler
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="flex-1 rounded-xl bg-primary text-primary-foreground h-12 shadow-lg shadow-primary/20"
                        onClick={() => { setSelectedDelivery(d); setPhotoUrl(d.proofImageUrl || ""); }}
                        data-testid={`button-validate-${d.id}`}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Valider
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2rem] p-8 max-w-[90%]">
                      <DialogHeader>
                        <DialogTitle className="text-center font-black uppercase italic tracking-tighter text-2xl">Validation Sécurisée</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 pt-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Camera className="h-5 w-5 text-secondary" />
                              <span className="text-sm font-black uppercase text-secondary">Preuve Photo</span>
                            </div>
                            {photoUrl && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                          </div>
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full" disabled={isUploading} data-testid="button-upload-photo">
                            {isUploading ? "Upload..." : photoUrl ? "Photo ajoutée ✓" : "Prendre une photo"}
                          </Button>
                        </div>
                        <div className="bg-primary/10 p-4 rounded-2xl border-2 border-primary/20 border-dashed">
                          <KeyRound className="h-8 w-8 text-primary mx-auto mb-2" />
                          <p className="text-[10px] font-black uppercase text-secondary text-center">Code OTP Client</p>
                          <p className="text-[9px] font-bold text-muted-foreground text-center mb-3">Entrez le code de 6 chiffres reçu par le client</p>
                          <Input type="password" maxLength={6} placeholder="••••••" value={otpCode} onChange={(e) => setOtpCode(e.target.value)}
                            className="text-center text-4xl h-20 font-black tracking-[0.5em] border-none bg-slate-100 rounded-2xl" data-testid="input-otp-code" />
                        </div>
                        <Button className="w-full h-14 rounded-2xl bg-secondary text-white font-black uppercase tracking-widest"
                          onClick={handleDeliver} disabled={isValidating} data-testid="button-confirm-delivery">
                          {isValidating ? "Validation..." : "Confirmer Livraison"}
                        </Button>
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
          {availableDeliveries.map(d => (
            <Card key={d.id} className="border-none shadow-lg bg-white rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-transform">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><Clock className="h-4 w-4 text-primary" /></div>
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Nouvelle course</span>
                  </div>
                  <span className="text-lg font-black text-secondary" data-testid={`text-fee-${d.id}`}>{parseFloat(d.deliveryFee || "0").toLocaleString()} FC</span>
                </div>
                <div>
                  <h4 className="font-black italic text-secondary uppercase tracking-tighter text-xl leading-none mb-1">{d.deliveryAddress.split(',')[0] || "Kinshasa"}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{d.deliveryAddress}</p>
                </div>
                <Button className="w-full h-12 bg-secondary text-white font-black uppercase tracking-widest rounded-xl shadow-xl shadow-secondary/10"
                  onClick={() => handleAccept(d.id)} data-testid={`button-accept-${d.id}`}>
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
