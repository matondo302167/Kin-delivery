import { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Phone, KeyRound, Camera, Navigation, MapPin, Wallet, Truck, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { listDeliveries, acceptDelivery, updateDeliveryPhoto, validateDelivery, uploadFile, getDriverDetails, updateDriverAvailability, updateDriverLocation, getDriverStats } from "@/lib/api";
import type { Delivery } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isActive, setIsActive] = useState(false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [stats, setStats] = useState({ totalMissions: 0, deliveredCount: 0, inTransitCount: 0, earnings: 0, cashToReturn: 0 });
  const [tab, setTab] = useState<'missions' | 'wallet'>('missions');

  const loadAll = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setIsLoading(true);
      const [pending, inTransit, driverDet, driverStats] = await Promise.all([
        listDeliveries({ status: "pending" }),
        listDeliveries({ driverId: profile.id, status: "in_transit" }),
        getDriverDetails(profile.id),
        getDriverStats(profile.id),
      ]);
      setAvailableDeliveries(pending);
      setMyMissions(inTransit);
      setIsActive(driverDet?.isActive ?? false);
      setStats(driverStats);
    } catch (error) {
      console.error("Failed to load:", error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 10000);
    return () => clearInterval(interval);
  }, [loadAll]);

  useEffect(() => {
    if (!profile?.id || !isActive) return;
    const sendLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              await updateDriverLocation(profile.id!, pos.coords.latitude, pos.coords.longitude);
            } catch (e) { /* silent */ }
          },
          () => {}
        );
      }
    };
    sendLocation();
    const interval = setInterval(sendLocation, 30000);
    return () => clearInterval(interval);
  }, [profile?.id, isActive]);

  const handleToggleAvailability = async () => {
    if (!profile?.id) return;
    setIsTogglingAvailability(true);
    try {
      const result = await updateDriverAvailability(profile.id, !isActive);
      setIsActive(result.isActive);
      toast({
        title: result.isActive ? "Vous êtes en service" : "Vous êtes hors service",
        description: result.isActive ? "Vous recevez les courses" : "Pause activée",
      });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const handleAccept = async (id: string) => {
    if (!profile?.id) return;
    try {
      await acceptDelivery(id, profile.id);
      toast({ title: "Mission acceptée", description: "En route pour le ramassage" });
      await loadAll();
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
        toast({ title: "Photo enregistrée" });
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
      toast({ title: "Livraison validée !" });
      await loadAll();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsValidating(false);
    }
  };

  const openGPS = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-secondary" data-testid="text-driver-title">
            {isActive ? "En service" : "Hors service"}
          </h1>
          <p className="text-xs text-gray-500 font-medium">{profile?.name || "Livreur"}</p>
        </div>
        <button
          onClick={handleToggleAvailability}
          disabled={isTogglingAvailability}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg ${
            isActive
              ? 'bg-green-500 text-white shadow-green-500/30'
              : 'bg-gray-200 text-gray-600'
          }`}
          data-testid="button-availability-toggle"
        >
          {isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
          {isActive ? "Disponible" : "Indisponible"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 text-center border border-gray-50 shadow-sm">
          <p className="text-2xl font-black text-secondary" data-testid="text-delivered-count">{stats.deliveredCount}</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Livrées</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center border border-gray-50 shadow-sm">
          <p className="text-2xl font-black text-green-600" data-testid="text-earnings">{stats.earnings.toLocaleString()}</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Gains FC</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center border border-gray-50 shadow-sm">
          <p className="text-2xl font-black text-amber-600" data-testid="text-cash-return">{stats.cashToReturn.toLocaleString()}</p>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Cash à rendre</p>
        </div>
      </div>

      {myMissions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 px-1">Courses en cours ({myMissions.length})</h3>
          {myMissions.map(d => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-md border border-blue-50 space-y-4"
              data-testid={`card-mission-${d.id}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-black text-secondary" data-testid={`text-recipient-${d.id}`}>{d.customerName}</h4>
                  <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                    <MapPin className="h-3 w-3" />
                    <p className="text-xs font-medium truncate max-w-[200px]">{d.deliveryAddress}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-blue-500 text-white text-[9px] font-black uppercase">En route</Badge>
                  <p className="text-sm font-black text-secondary mt-1">{parseFloat(d.deliveryFee || "0").toLocaleString()} FC</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl h-12 border-gray-100 font-bold text-xs"
                  onClick={() => openGPS(d.deliveryAddress)}
                  data-testid={`button-gps-${d.id}`}
                >
                  <Navigation className="mr-1.5 h-4 w-4 text-blue-500" /> GPS
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl h-12 border-gray-100 font-bold text-xs"
                  onClick={() => window.open(`tel:${d.customerPhone}`)}
                  data-testid={`button-call-${d.id}`}
                >
                  <Phone className="mr-1.5 h-4 w-4 text-green-500" /> Appeler
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="rounded-xl bg-primary text-secondary h-12 shadow-lg shadow-primary/20 font-bold text-xs"
                      onClick={() => { setSelectedDelivery(d); setPhotoUrl(d.proofImageUrl || ""); }}
                      data-testid={`button-validate-${d.id}`}
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" /> Valider
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-[2rem] p-6 max-w-[90%]">
                    <DialogHeader>
                      <DialogTitle className="text-center font-black text-xl tracking-tight">Validation Livraison</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5 pt-2">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Camera className="h-4 w-4 text-secondary" />
                            <span className="text-xs font-black uppercase text-secondary">Photo preuve</span>
                          </div>
                          {photoUrl && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
                        <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full rounded-xl" disabled={isUploading} data-testid="button-upload-photo">
                          {isUploading ? "Upload..." : photoUrl ? "Photo ajoutée ✓" : "Prendre une photo"}
                        </Button>
                      </div>

                      <div className="bg-primary/5 p-4 rounded-2xl border border-dashed border-primary/20">
                        <KeyRound className="h-6 w-6 text-primary mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase text-secondary text-center mb-1">Code OTP Client</p>
                        <p className="text-[9px] font-bold text-gray-400 text-center mb-3">Code 6 chiffres reçu par le client</p>
                        <Input type="text" inputMode="numeric" maxLength={6} placeholder="••••••" value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          className="text-center text-3xl h-16 font-black tracking-[0.5em] border-0 bg-white rounded-xl" data-testid="input-otp-code" />
                      </div>

                      <Button
                        className="w-full h-14 rounded-2xl bg-secondary text-white font-black uppercase tracking-widest"
                        onClick={handleDeliver} disabled={isValidating}
                        data-testid="button-confirm-delivery"
                      >
                        {isValidating ? "Validation..." : "Confirmer Livraison"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 px-1">
          Courses disponibles ({availableDeliveries.length})
        </h3>
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        ) : availableDeliveries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-50">
            <Truck className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aucune course disponible</p>
            <p className="text-[10px] text-gray-400 mt-1">Les nouvelles courses apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableDeliveries.map(d => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 space-y-3"
                data-testid={`card-available-${d.id}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Nouvelle course</span>
                    </div>
                    <p className="font-bold text-secondary text-sm truncate max-w-[220px]">{d.deliveryAddress.split(',')[0] || "Kinshasa"}</p>
                    <div className="flex items-center gap-1 text-gray-400 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      <p className="text-[10px] font-medium truncate max-w-[200px]">{d.pickupAddress.split(',')[0]}</p>
                      <span className="text-[10px]">→</span>
                      <p className="text-[10px] font-medium truncate max-w-[200px]">{d.deliveryAddress.split(',')[0]}</p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-secondary whitespace-nowrap" data-testid={`text-fee-${d.id}`}>
                    {parseFloat(d.deliveryFee || "0").toLocaleString()} FC
                  </p>
                </div>
                <Button
                  className="w-full h-11 bg-secondary text-white font-black uppercase tracking-widest text-xs rounded-xl"
                  onClick={() => handleAccept(d.id)}
                  data-testid={`button-accept-${d.id}`}
                >
                  Accepter la mission
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
