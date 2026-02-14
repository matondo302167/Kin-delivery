import { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Phone, KeyRound, Camera, Navigation, MapPin, Truck, ToggleLeft, ToggleRight, Info, MessageCircle, PhoneCall, DollarSign, User, ChevronUp, Package, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { listDeliveries, acceptDelivery, updateDeliveryPhoto, validateDelivery, uploadFile, getDriverDetails, updateDriverAvailability, getDriverStats, createCashoutRequest } from "@/lib/api";
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
  const [deliveredMissions, setDeliveredMissions] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [stats, setStats] = useState({ totalMissions: 0, deliveredCount: 0, inTransitCount: 0, earnings: 0, cashToReturn: 0 });
  const [vehicleType, setVehicleType] = useState<string>("moto");
  const [detailsDelivery, setDetailsDelivery] = useState<Delivery | null>(null);
  const [callDelivery, setCallDelivery] = useState<Delivery | null>(null);
  const [validateDialogOpen, setValidateDialogOpen] = useState(false);
  const [showDeliverySuccess, setShowDeliverySuccess] = useState(false);
  const [showDeliveredList, setShowDeliveredList] = useState(false);
  const [showEarningsDetail, setShowEarningsDetail] = useState(false);
  const [showCashoutDialog, setShowCashoutDialog] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState("");
  const [isSubmittingCashout, setIsSubmittingCashout] = useState(false);

  const loadAll = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setIsLoading(true);
      const [pending, inTransit, delivered, driverDet, driverStats] = await Promise.all([
        listDeliveries({ status: "pending" }),
        listDeliveries({ driverId: profile.id, status: "in_transit" }),
        listDeliveries({ driverId: profile.id, status: "delivered" }),
        getDriverDetails(profile.id),
        getDriverStats(profile.id),
      ]);
      setAvailableDeliveries(pending);
      setMyMissions(inTransit);
      setDeliveredMissions(delivered);
      setIsActive(driverDet?.isActive ?? false);
      setVehicleType(driverDet?.vehicleType ?? "moto");
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
      const validatedId = selectedDelivery.id;
      const validatedDelivery = { ...selectedDelivery, status: 'delivered' as const };
      await validateDelivery(validatedId, otpCode, profile?.id);
      setMyMissions(prev => prev.filter(m => m.id !== validatedId));
      setDeliveredMissions(prev => [validatedDelivery, ...prev]);
      const fee = parseFloat(selectedDelivery.deliveryFee || "0");
      setStats(prev => ({
        ...prev,
        deliveredCount: prev.deliveredCount + 1,
        inTransitCount: Math.max(0, prev.inTransitCount - 1),
        earnings: prev.earnings + fee,
      }));
      setOtpCode("");
      setPhotoUrl("");
      setSelectedDelivery(null);
      setValidateDialogOpen(false);
      setShowDeliverySuccess(true);
      setTimeout(() => {
        setShowDeliverySuccess(false);
      }, 3000);
      loadAll();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsValidating(false);
    }
  };

  const getGoogleMapsDirectionsUrl = (address: string) => {
    let travelMode = "driving";
    if (vehicleType === "velo" || vehicleType === "bicycle" || vehicleType === "bike") {
      travelMode = "bicycling";
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=${travelMode}`;
  };

  const openGPS = (address: string) => {
    window.open(getGoogleMapsDirectionsUrl(address), '_blank');
  };

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/[^0-9+]/g, '');
    window.open(`https://wa.me/${cleaned.startsWith('+') ? cleaned.slice(1) : cleaned}`, '_blank');
    setCallDelivery(null);
  };

  const openNormalCall = (phone: string) => {
    window.open(`tel:${phone}`);
    setCallDelivery(null);
  };

  const handleCashout = async () => {
    if (!profile?.id) return;
    const amount = parseFloat(cashoutAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Montant invalide", description: "Veuillez entrer un montant supérieur à 0", variant: "destructive" });
      return;
    }
    if (amount > stats.cashToReturn) {
      toast({ title: "Montant trop élevé", description: `Le montant maximum est de ${stats.cashToReturn.toLocaleString()} FC`, variant: "destructive" });
      return;
    }
    setIsSubmittingCashout(true);
    try {
      await createCashoutRequest(profile.id, amount);
      toast({ title: "Demande envoyée", description: `Votre demande de retrait de ${amount.toLocaleString()} FC est en attente de validation` });
      setCashoutAmount("");
      setShowCashoutDialog(false);
      await loadAll();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmittingCashout(false);
    }
  };

  return (
    <div className="space-y-5 pb-20">
      <AnimatePresence>
        {showDeliverySuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
            onClick={() => setShowDeliverySuccess(false)}
            data-testid="overlay-delivery-success"
          >
            <motion.div
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              className="bg-white rounded-3xl p-8 mx-6 text-center shadow-2xl max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-black text-secondary mb-2" data-testid="text-success-title">Livraison validée !</h2>
              <p className="text-sm text-gray-500 mb-5">Le colis a été livré avec succès. Vous revenez à la liste de vos courses.</p>
              <Button
                className="w-full h-12 rounded-2xl bg-green-500 text-white font-black uppercase tracking-widest"
                onClick={() => setShowDeliverySuccess(false)}
                data-testid="button-success-dismiss"
              >
                Retour aux courses
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={!!detailsDelivery} onOpenChange={(open) => { if (!open) setDetailsDelivery(null); }}>
        <DialogContent className="rounded-[2rem] p-6 max-w-[90%]" data-testid="dialog-order-details">
          <DialogHeader>
            <DialogTitle className="text-center font-black text-xl tracking-tight">Détails de la commande</DialogTitle>
          </DialogHeader>
          {detailsDelivery && (
            <div className="space-y-4 pt-2">
              <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-secondary" />
                  <span className="text-xs font-black uppercase text-secondary">Client</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Nom</span>
                    <span className="text-xs font-bold text-secondary" data-testid="detail-customer-name">{detailsDelivery.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Téléphone</span>
                    <span className="text-xs font-bold text-secondary" data-testid="detail-customer-phone">{detailsDelivery.customerPhone}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-secondary" />
                  <span className="text-xs font-black uppercase text-secondary">Adresses</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Ramassage</span>
                    <p className="text-xs font-medium text-secondary" data-testid="detail-pickup-address">{detailsDelivery.pickupAddress}</p>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Livraison</span>
                    <p className="text-xs font-medium text-secondary" data-testid="detail-delivery-address">{detailsDelivery.deliveryAddress}</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-secondary" />
                  <span className="text-xs font-black uppercase text-secondary">Finances</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Prix de l'article</span>
                    <span className="text-sm font-black text-secondary" data-testid="detail-article-price">{parseFloat(detailsDelivery.articlePrice || "0").toLocaleString()} FC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Frais de livraison</span>
                    <span className="text-sm font-black text-green-600" data-testid="detail-delivery-fee">{parseFloat(detailsDelivery.deliveryFee || "0").toLocaleString()} FC</span>
                  </div>
                  <div className="border-t border-primary/20 pt-2 flex justify-between">
                    <span className="text-xs font-bold text-secondary">Total à collecter</span>
                    <span className="text-sm font-black text-secondary" data-testid="detail-total">
                      {(parseFloat(detailsDelivery.articlePrice || "0") + parseFloat(detailsDelivery.deliveryFee || "0")).toLocaleString()} FC
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Statut</span>
                  <Badge className={`text-[9px] font-black uppercase ${
                    detailsDelivery.status === 'delivered' ? 'bg-green-500 text-white' :
                    detailsDelivery.status === 'in_transit' ? 'bg-blue-500 text-white' :
                    'bg-amber-500 text-white'
                  }`} data-testid="detail-status">
                    {detailsDelivery.status === 'delivered' ? 'Livré' : detailsDelivery.status === 'in_transit' ? 'En cours' : 'En attente'}
                  </Badge>
                </div>
                {detailsDelivery.createdAt && (
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-500">Date de création</span>
                    <span className="text-xs font-medium text-secondary" data-testid="detail-created-at">
                      {new Date(detailsDelivery.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!callDelivery} onOpenChange={(open) => { if (!open) setCallDelivery(null); }}>
        <DialogContent className="rounded-[2rem] p-6 max-w-[85%]" data-testid="dialog-call-options">
          <DialogHeader>
            <DialogTitle className="text-center font-black text-lg tracking-tight">Contacter le client</DialogTitle>
          </DialogHeader>
          {callDelivery && (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-gray-500 text-center">{callDelivery.customerName} - {callDelivery.customerPhone}</p>
              <Button
                className="w-full h-14 rounded-2xl bg-green-500 text-white font-bold text-sm flex items-center justify-center gap-3"
                onClick={() => openWhatsApp(callDelivery.customerPhone)}
                data-testid="button-whatsapp-call"
              >
                <MessageCircle className="h-5 w-5" />
                Appeler sur WhatsApp
              </Button>
              <Button
                variant="outline"
                className="w-full h-14 rounded-2xl border-gray-200 font-bold text-sm flex items-center justify-center gap-3"
                onClick={() => openNormalCall(callDelivery.customerPhone)}
                data-testid="button-normal-call"
              >
                <PhoneCall className="h-5 w-5 text-blue-500" />
                Appel téléphonique
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEarningsDetail} onOpenChange={setShowEarningsDetail}>
        <DialogContent className="rounded-[2rem] p-6 max-w-[90%] max-h-[80vh] overflow-y-auto" data-testid="dialog-earnings-detail">
          <DialogHeader>
            <DialogTitle className="text-center font-black text-xl tracking-tight">Détail des gains</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="bg-green-50 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-black uppercase text-green-600 tracking-widest mb-1">Total des gains</p>
              <p className="text-3xl font-black text-green-600" data-testid="earnings-total">{stats.earnings.toLocaleString()} FC</p>
              <p className="text-xs text-gray-500 mt-1">{deliveredMissions.length} livraison{deliveredMissions.length !== 1 ? 's' : ''} effectuée{deliveredMissions.length !== 1 ? 's' : ''}</p>
            </div>
            {deliveredMissions.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-bold">Aucune livraison pour le moment</p>
              </div>
            ) : (
              deliveredMissions.map(d => (
                <div
                  key={d.id}
                  className="bg-white rounded-2xl p-4 border border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => { setShowEarningsDetail(false); setDetailsDelivery(d); }}
                  data-testid={`earnings-item-${d.id}`}
                >
                  <div>
                    <p className="text-sm font-bold text-secondary">{d.customerName}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{d.deliveryAddress.split(',')[0]}</p>
                    {d.createdAt && (
                      <p className="text-[10px] text-gray-400">{new Date(d.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                    )}
                  </div>
                  <p className="text-sm font-black text-green-600">+{parseFloat(d.deliveryFee || "0").toLocaleString()} FC</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

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
        <div
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center border border-blue-100 shadow-sm cursor-pointer hover:shadow-md transition-all"
          onClick={() => setShowDeliveredList(!showDeliveredList)}
          data-testid="card-delivered"
        >
          <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-1">
            <Package className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600" data-testid="text-delivered-count">{stats.deliveredCount}</p>
          <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Livrées</p>
        </div>
        <div
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center border border-green-100 shadow-sm cursor-pointer hover:shadow-md transition-all"
          onClick={() => setShowEarningsDetail(true)}
          data-testid="card-earnings"
        >
          <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-1">
            <DollarSign className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-black text-green-600" data-testid="text-earnings">{stats.earnings.toLocaleString()}</p>
          <p className="text-[9px] font-bold text-green-400 uppercase tracking-widest">Gains FC</p>
        </div>
        <div
          className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 text-center border border-amber-100 shadow-sm cursor-pointer hover:shadow-md transition-all"
          onClick={() => setShowCashoutDialog(true)}
          data-testid="card-cash-return"
        >
          <div className="w-8 h-8 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-1">
            <Banknote className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600" data-testid="text-cash-return">{stats.cashToReturn.toLocaleString()}</p>
          <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Cash à rendre</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            <Banknote className="h-3 w-3 text-amber-500" />
            <span className="text-[9px] font-black text-amber-500 uppercase">Retirer</span>
          </div>
        </div>
      </div>

      <Dialog open={showCashoutDialog} onOpenChange={setShowCashoutDialog}>
        <DialogContent className="rounded-[2rem] p-6 max-w-[90%]" data-testid="dialog-cashout">
          <DialogHeader>
            <DialogTitle className="text-center font-black text-xl tracking-tight">Demande de retrait</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-amber-50 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-1">Disponible</p>
              <p className="text-3xl font-black text-amber-600" data-testid="cashout-available">{stats.cashToReturn.toLocaleString()} FC</p>
            </div>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Montant en FC"
                value={cashoutAmount}
                onChange={(e) => setCashoutAmount(e.target.value)}
                max={stats.cashToReturn}
                min={1}
                className="h-14 rounded-2xl text-center text-lg font-black border-gray-200"
                data-testid="input-cashout-amount"
              />
              <p className="text-[10px] text-gray-400 text-center">Maximum: {stats.cashToReturn.toLocaleString()} FC</p>
            </div>
            <Button
              className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest"
              onClick={handleCashout}
              disabled={isSubmittingCashout}
              data-testid="button-submit-cashout"
            >
              {isSubmittingCashout ? "Envoi en cours..." : "Envoyer la demande"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {myMissions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 px-1">Courses en cours ({myMissions.length})</h3>
          {myMissions.map(d => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-5 shadow-md border border-blue-100 space-y-4"
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

              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl h-12 border-gray-100 font-bold text-xs flex flex-col items-center justify-center gap-0.5 p-1"
                  onClick={() => setDetailsDelivery(d)}
                  data-testid={`button-details-${d.id}`}
                >
                  <Info className="h-4 w-4 text-purple-500" />
                  <span className="text-[9px]">Détails</span>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl h-12 border-gray-100 font-bold text-xs flex flex-col items-center justify-center gap-0.5 p-1"
                  onClick={() => openGPS(d.deliveryAddress)}
                  data-testid={`button-gps-${d.id}`}
                >
                  <Navigation className="h-4 w-4 text-blue-500" />
                  <span className="text-[9px]">GPS</span>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl h-12 border-gray-100 font-bold text-xs flex flex-col items-center justify-center gap-0.5 p-1"
                  onClick={() => setCallDelivery(d)}
                  data-testid={`button-call-${d.id}`}
                >
                  <Phone className="h-4 w-4 text-green-500" />
                  <span className="text-[9px]">Appeler</span>
                </Button>
                <Dialog open={validateDialogOpen && selectedDelivery?.id === d.id} onOpenChange={(open) => { setValidateDialogOpen(open); if (!open) { setSelectedDelivery(null); } }}>
                  <DialogTrigger asChild>
                    <Button
                      className="rounded-xl bg-primary text-secondary h-12 shadow-lg shadow-primary/20 font-bold text-xs flex flex-col items-center justify-center gap-0.5 p-1"
                      onClick={() => { setSelectedDelivery(d); setPhotoUrl(d.proofImageUrl || ""); setValidateDialogOpen(true); }}
                      data-testid={`button-validate-${d.id}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-[9px]">Valider</span>
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
                          {isUploading ? "Upload..." : photoUrl ? "Photo ajoutée \u2713" : "Prendre une photo"}
                        </Button>
                      </div>

                      <div className="bg-primary/5 p-4 rounded-2xl border border-dashed border-primary/20">
                        <KeyRound className="h-6 w-6 text-primary mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase text-secondary text-center mb-1">Code OTP Client</p>
                        <p className="text-[9px] font-bold text-gray-400 text-center mb-3">Code 6 chiffres reçu par le client</p>
                        <Input type="text" inputMode="numeric" maxLength={6} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022" value={otpCode}
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

      <AnimatePresence>
        {showDeliveredList && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                Colis livrés ({deliveredMissions.length})
              </h3>
              <button onClick={() => setShowDeliveredList(false)} className="text-gray-400">
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>
            {deliveredMissions.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-2xl border border-gray-50">
                <Package className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aucun colis livré</p>
              </div>
            ) : (
              deliveredMissions.map(d => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-green-50 flex justify-between items-center cursor-pointer hover:bg-green-50/50 transition-colors"
                  onClick={() => setDetailsDelivery(d)}
                  data-testid={`card-delivered-${d.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-secondary">{d.customerName}</p>
                      <p className="text-[10px] text-gray-400">{d.deliveryAddress.split(',')[0]}</p>
                      {d.createdAt && (
                        <p className="text-[10px] text-gray-400">{new Date(d.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-500 text-white text-[9px] font-black uppercase mb-1">Livré</Badge>
                    <p className="text-sm font-black text-green-600">{parseFloat(d.deliveryFee || "0").toLocaleString()} FC</p>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
                className="bg-gradient-to-br from-white to-primary/5 rounded-2xl p-5 shadow-sm border border-primary/10 space-y-3 hover:shadow-md transition-all"
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
                      <span className="text-[10px]">\u2192</span>
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
