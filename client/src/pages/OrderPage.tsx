import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { createDelivery, registerSeller, getProfileByPhone, listDeliveries } from "@/lib/api";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, ArrowRight, Package, Loader2, Send, User, Phone, DollarSign, Clock, Truck, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Delivery } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const formSchema = z.object({
  customerName: z.string().min(2, "Nom requis"),
  customerPhone: z.string().min(9, "Numéro invalide"),
  deliveryAddress: z.string().min(5, "Adresse d'arrivée requise"),
  pickupAddress: z.string().min(5, "Adresse de départ requise"),
  deliveryFee: z.coerce.number().min(500, "Livraison min 500 FC"),
  articlePrice: z.coerce.number().min(0, "Prix invalide"),
});

export default function OrderPage() {
  const { profile, setProfile, logout } = useStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [dialogPhone, setDialogPhone] = useState("");
  const [dialogName, setDialogName] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingFormValues, setPendingFormValues] = useState<z.infer<typeof formSchema> | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeField, setActiveField] = useState<'pickup' | 'delivery' | null>(null);
  const [myDeliveries, setMyDeliveries] = useState<Delivery[]>([]);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      pickupAddress: "",
      deliveryAddress: "",
      deliveryFee: 2500,
      articlePrice: 0,
    },
  });

  const loadDeliveries = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setIsLoadingDeliveries(true);
      const deliveries = await listDeliveries({ sellerId: profile.id });
      setMyDeliveries(deliveries);
    } catch (error) {
      console.error("Failed to load deliveries:", error);
    } finally {
      setIsLoadingDeliveries(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(loadDeliveries, 15000);
    return () => clearInterval(interval);
  }, [loadDeliveries]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            form.setValue("pickupAddress", address);
          } catch (e) {
            form.setValue("pickupAddress", `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        },
        () => {
          form.setValue("pickupAddress", "Kinshasa, RDC");
        }
      );
    }
  }, []);

  const handleAddressChange = async (value: string) => {
    if (value.length > 2) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}+Kinshasa&countrycodes=cd&limit=5`);
        const data = await response.json();
        setSuggestions(data.map((item: any) => item.display_name));
      } catch (e) { setSuggestions([]); }
    } else { setSuggestions([]); }
  };

  async function submitDelivery(values: z.infer<typeof formSchema>, sellerId?: string) {
    setIsSubmitting(true);
    try {
      const result = await createDelivery({
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        pickupAddress: values.pickupAddress,
        deliveryAddress: values.deliveryAddress,
        deliveryFee: values.deliveryFee.toString(),
        articlePrice: values.articlePrice.toString(),
        sellerId: sellerId || profile?.id || "",
      });
      toast({ title: "Colis envoyé !", description: result.message || `ID: ${result.delivery.id.substring(0, 8)}` });
      form.reset();
      form.setValue("deliveryFee", 2500);
      form.setValue("articlePrice", 0);
      setShowForm(false);
      await loadDeliveries();
    } catch (error: any) {
      const msg = error.message || "Impossible de créer la commande";
      if (msg.includes("session") || msg.includes("reconnecter")) {
        logout();
        toast({ title: "Session expirée", description: "Veuillez vous reconnecter.", variant: "destructive" });
        setLocation("/login");
        return;
      }
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLoggedInSeller = profile && (profile.role === 'temp_seller' || profile.role === 'pro_seller' || profile.role === 'seller');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isLoggedInSeller) {
      setPendingFormValues(values);
      setShowPhoneDialog(true);
      return;
    }
    await submitDelivery(values);
  }

  async function handlePhoneCheck() {
    if (dialogPhone.length < 9) { toast({ title: "Numéro invalide", description: "Entrez un numéro valide", variant: "destructive" }); return; }
    setIsChecking(true);
    try {
      const foundProfile = await getProfileByPhone(dialogPhone);
      const mappedRole = foundProfile.role === 'driver' ? 'courier' : foundProfile.role;
      setProfile({
        id: foundProfile.id,
        name: foundProfile.fullName || "",
        phone: foundProfile.phoneNumber,
        role: mappedRole as any,
        avatar: foundProfile.avatarUrl || undefined,
      });
      setShowPhoneDialog(false);
      toast({ title: "Connexion réussie", description: `Bienvenue ${foundProfile.fullName}!` });
      setDialogPhone("");
      if (foundProfile.role === 'driver') {
        setPendingFormValues(null);
        setLocation("/");
        return;
      }
      if (pendingFormValues) {
        await submitDelivery(pendingFormValues, foundProfile.id);
        setPendingFormValues(null);
      }
    } catch (error) {
      setShowPhoneDialog(false);
      setShowNameDialog(true);
    } finally {
      setIsChecking(false);
    }
  }

  async function handleNameSubmit() {
    if (!dialogName.trim()) { toast({ title: "Nom requis", description: "Entrez votre nom complet", variant: "destructive" }); return; }
    setIsCreating(true);
    try {
      const newProfile = await registerSeller({ phoneNumber: dialogPhone, fullName: dialogName, sellerType: 'temp_seller' });
      setProfile({
        id: newProfile.id,
        name: newProfile.fullName || "",
        phone: newProfile.phoneNumber,
        role: 'temp_seller',
        avatar: newProfile.avatarUrl || undefined,
      });
      setShowNameDialog(false);
      toast({ title: "Compte créé", description: `Bienvenue ${newProfile.fullName}!` });
      if (pendingFormValues) {
        await submitDelivery(pendingFormValues, newProfile.id);
        setPendingFormValues(null);
      }
      setDialogPhone("");
      setDialogName("");
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Impossible de créer le compte", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  }

  const statusLabel = (status: string | null) => {
    switch (status) {
      case 'delivered': return 'Livré';
      case 'in_transit': return 'En cours';
      case 'pending': return 'En attente';
      default: return status || 'Inconnu';
    }
  };

  const statusIcon = (status: string | null) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_transit': return <Truck className="h-5 w-5 text-blue-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-amber-500" />;
      default: return <Package className="h-5 w-5 text-gray-400" />;
    }
  };

  const statusColor = (status: string | null) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'in_transit': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (!showForm) {
    return (
      <div className="space-y-8 pb-20">
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-3"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Send className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-secondary" data-testid="text-title">
              Envoyer un Colis
            </h1>
            <p className="text-gray-500 font-medium max-w-sm mx-auto">
              Livraison rapide partout à Kinshasa. Simple et sécurisé.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={() => setShowForm(true)}
              className="h-16 px-12 bg-primary text-secondary hover:bg-primary/90 rounded-2xl font-black text-lg uppercase tracking-wider shadow-xl shadow-primary/30"
              data-testid="button-send-now"
            >
              <Send className="mr-3 h-6 w-6" />
              Envoyer Now
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-8 text-center pt-4"
          >
            <div className="space-y-1">
              <p className="text-2xl font-black text-secondary">2500</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">FC minimum</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="space-y-1">
              <p className="text-2xl font-black text-secondary">30</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">min en moyenne</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="space-y-1">
              <p className="text-2xl font-black text-secondary">SMS</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Suivi client</p>
            </div>
          </motion.div>
        </div>

        {isLoggedInSeller && myDeliveries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3 px-1"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-2">
                <Package className="h-3.5 w-3.5" /> Mes envois
              </p>
              <Badge variant="secondary" className="text-[9px] font-bold">{myDeliveries.length} colis</Badge>
            </div>

            <div className="space-y-3">
              {myDeliveries.slice(0, 10).map((d) => (
                <div
                  key={d.id}
                  className="bg-white rounded-2xl p-4 border border-gray-50 shadow-sm flex items-center gap-4"
                  data-testid={`card-delivery-${d.id}`}
                >
                  <div className="shrink-0">{statusIcon(d.status)}</div>
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
                      <span className="text-[10px] text-gray-400">
                        {d.createdAt ? format(new Date(d.createdAt), "dd MMM HH:mm", { locale: fr }) : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-secondary" data-testid="text-form-title">Nouveau Colis</h1>
          <p className="text-xs text-gray-500 font-medium">Remplissez les infos de livraison</p>
        </div>
        <Button
          variant="ghost"
          onClick={() => setShowForm(false)}
          className="text-gray-400 font-bold"
          data-testid="button-cancel"
        >
          Annuler
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <User className="h-3 w-3" /> Destinataire
            </p>
            <FormField control={form.control} name="customerName" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Nom du client" className="h-12 bg-gray-50 border-0 rounded-xl font-medium" {...field} data-testid="input-customer-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="customerPhone" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Téléphone du client" type="tel" className="h-12 bg-gray-50 border-0 rounded-xl font-medium" {...field} data-testid="input-customer-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <MapPin className="h-3 w-3" /> Adresses
            </p>
            <FormField control={form.control} name="pickupAddress" render={({ field }) => (
              <FormItem className="relative">
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-3.5 w-2.5 h-2.5 rounded-full bg-black ring-4 ring-white z-10" />
                    <Input placeholder="Adresse de départ" className={cn("pl-10 h-12 bg-gray-50 border-0 rounded-xl font-medium", activeField === 'pickup' && "ring-2 ring-primary")}
                      {...field} onChange={(e) => { field.onChange(e); handleAddressChange(e.target.value); }}
                      onFocus={() => setActiveField('pickup')} onBlur={() => setTimeout(() => setActiveField(null), 200)}
                      data-testid="input-pickup" />
                    {activeField === 'pickup' && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-xl z-50 mt-1 border max-h-48 overflow-y-auto">
                        {suggestions.map((s, i) => (
                          <div key={i} className="p-3 hover:bg-gray-50 cursor-pointer text-sm flex items-center gap-2"
                            onMouseDown={(e) => { e.preventDefault(); form.setValue("pickupAddress", s); setSuggestions([]); setActiveField(null); }}>
                            <MapPin className="h-3 w-3 text-gray-400 shrink-0" /><span className="truncate">{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="deliveryAddress" render={({ field }) => (
              <FormItem className="relative">
                <FormControl>
                  <div className="relative">
                    <div className="absolute left-3 top-3.5 w-2.5 h-2.5 bg-primary ring-4 ring-white z-10" />
                    <Input placeholder="Adresse de livraison" className={cn("pl-10 h-12 bg-gray-50 border-0 rounded-xl font-medium", activeField === 'delivery' && "ring-2 ring-primary")}
                      {...field} onChange={(e) => { field.onChange(e); handleAddressChange(e.target.value); }}
                      onFocus={() => setActiveField('delivery')} onBlur={() => setTimeout(() => setActiveField(null), 200)}
                      data-testid="input-delivery" />
                    {activeField === 'delivery' && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-xl z-50 mt-1 border max-h-48 overflow-y-auto">
                        {suggestions.map((s, i) => (
                          <div key={i} className="p-3 hover:bg-gray-50 cursor-pointer text-sm flex items-center gap-2"
                            onMouseDown={(e) => { e.preventDefault(); form.setValue("deliveryAddress", s); setSuggestions([]); setActiveField(null); }}>
                            <MapPin className="h-3 w-3 text-gray-400 shrink-0" /><span className="truncate">{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <DollarSign className="h-3 w-3" /> Prix
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="articlePrice" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-gray-500">Prix article (FC)</FormLabel>
                  <FormControl><Input type="number" placeholder="0" className="h-12 bg-gray-50 border-0 rounded-xl font-black text-lg" {...field} data-testid="input-article-price" /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="deliveryFee" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-gray-500">Frais livraison (FC)</FormLabel>
                  <FormControl><Input type="number" className="h-12 bg-gray-50 border-0 rounded-xl font-black text-lg" {...field} data-testid="input-delivery-fee" /></FormControl>
                </FormItem>
              )} />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}
            className="w-full h-14 bg-primary text-secondary hover:bg-primary/90 font-black text-base rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-wider"
            data-testid="button-submit-order">
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
            {isSubmitting ? "Envoi en cours..." : "Envoyer le colis"}
          </Button>
        </form>
      </Form>

      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="rounded-[2rem] p-8 max-w-sm">
          <DialogHeader><DialogTitle className="text-center font-black text-2xl tracking-tight text-secondary">Votre numéro</DialogTitle></DialogHeader>
          <div className="space-y-5 pt-4">
            <p className="text-sm text-gray-500 text-center">Entrez votre numéro de téléphone pour continuer</p>
            <Input type="tel" placeholder="0812345678" value={dialogPhone} onChange={(e) => setDialogPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="h-14 rounded-xl text-lg font-medium text-center tracking-wider" data-testid="input-dialog-phone" autoFocus />
            <Button onClick={handlePhoneCheck} disabled={isChecking || dialogPhone.length < 9}
              className="w-full h-14 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl text-base" data-testid="button-dialog-phone">
              {isChecking ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continuer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="rounded-[2rem] p-8 max-w-sm">
          <DialogHeader><DialogTitle className="text-center font-black text-2xl tracking-tight text-secondary">Créer votre compte</DialogTitle></DialogHeader>
          <div className="space-y-5 pt-4">
            <p className="text-sm text-gray-500 text-center">Numéro non reconnu. Entrez votre nom pour créer un compte.</p>
            <Input placeholder="Ex: Jean Mukendi" value={dialogName} onChange={(e) => setDialogName(e.target.value)}
              className="h-14 rounded-xl text-lg font-medium" data-testid="input-dialog-name" autoFocus />
            <Button onClick={handleNameSubmit} disabled={isCreating || !dialogName.trim()}
              className="w-full h-14 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl text-base" data-testid="button-dialog-name">
              {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Créer mon compte et envoyer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
