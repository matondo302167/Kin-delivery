import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { createDelivery, listDeliveries, getSellerDetails } from "@/lib/api";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PhoneInput from "@/components/PhoneInput";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Package, Loader2, Send, User, DollarSign, Clock, Truck, CheckCircle2, ChevronRight, Plus, ShieldCheck, Search, Eye } from "lucide-react";
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

export default function ProOrderPage() {
  const { profile } = useStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeField, setActiveField] = useState<'pickup' | 'delivery' | null>(null);
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([]);
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState(false);
  const [shopName, setShopName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [todayCount, setTodayCount] = useState(0);

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

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setIsLoadingDeliveries(true);
      const [deliveries, details] = await Promise.all([
        listDeliveries({ sellerId: profile.id }),
        getSellerDetails(profile.id).catch(() => null),
      ]);
      setRecentDeliveries(deliveries.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()));
      if (details?.shopName) setShopName(details.shopName);
      if (details?.businessAddress) form.setValue("pickupAddress", details.businessAddress);

      const today = new Date().toDateString();
      setTodayCount(deliveries.filter(d => new Date(d.createdAt!).toDateString() === today).length);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoadingDeliveries(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (!form.getValues("pickupAddress")) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              const data = await response.json();
              form.setValue("pickupAddress", data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            } catch (e) {
              form.setValue("pickupAddress", `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
          },
          () => {
            form.setValue("pickupAddress", "Kinshasa, RDC");
          }
        );
      } else {
        form.setValue("pickupAddress", "Kinshasa, RDC");
      }
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!profile?.id) return;
    setIsSubmitting(true);
    try {
      const result = await createDelivery({
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        pickupAddress: values.pickupAddress,
        deliveryAddress: values.deliveryAddress,
        deliveryFee: values.deliveryFee.toString(),
        articlePrice: values.articlePrice.toString(),
        sellerId: profile.id,
      });
      toast({ title: "Colis créé avec succès", description: `Commande #${result.delivery.id.substring(0, 8)} envoyée` });
      form.reset();
      form.setValue("deliveryFee", 2500);
      form.setValue("articlePrice", 0);
      setShowForm(false);
      await loadData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Impossible de créer la commande", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

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
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'in_transit': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const statusIcon = (status: string | null) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_transit': return <Truck className="h-4 w-4 text-blue-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />;
      default: return <Package className="h-4 w-4 text-gray-400" />;
    }
  };

  const pendingCount = recentDeliveries.filter(d => d.status === 'pending').length;
  const inTransitCount = recentDeliveries.filter(d => d.status === 'in_transit').length;
  const deliveredCount = recentDeliveries.filter(d => d.status === 'delivered').length;

  const filteredDeliveries = searchQuery
    ? recentDeliveries.filter(d =>
        d.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.customerPhone?.includes(searchQuery) ||
        d.deliveryAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recentDeliveries;

  return (
    <div className="space-y-6 pb-20">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tighter text-secondary" data-testid="text-pro-order-title">
              Expéditions
            </h1>
            <Badge className="bg-green-100 text-green-700 border-green-200 font-black text-[9px] uppercase tracking-widest gap-1">
              <ShieldCheck className="h-3 w-3" /> Pro
            </Badge>
          </div>
          {shopName && (
            <p className="text-xs text-gray-400 font-bold mt-0.5">{shopName}</p>
          )}
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary text-secondary hover:bg-primary/90 font-black uppercase tracking-wider text-xs rounded-xl h-11 px-5 shadow-lg shadow-primary/20"
          data-testid="button-new-shipment"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Nouveau colis
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <Clock className="h-4 w-4 text-amber-500 mb-2" />
          <p className="text-2xl font-black text-amber-700" data-testid="text-pending-count">{pendingCount}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">En attente</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <Truck className="h-4 w-4 text-blue-500 mb-2" />
          <p className="text-2xl font-black text-blue-700" data-testid="text-transit-count">{inTransitCount}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-blue-500">En route</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <CheckCircle2 className="h-4 w-4 text-green-500 mb-2" />
          <p className="text-2xl font-black text-green-700" data-testid="text-delivered-count">{deliveredCount}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-green-500">Livrés</p>
        </div>
      </motion.div>

      {todayCount > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="bg-secondary/5 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-secondary p-2 rounded-xl">
              <Send className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-secondary">{todayCount} colis aujourd'hui</p>
              <p className="text-[10px] text-gray-400 font-bold">Activité du jour</p>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-2 border-primary/20 shadow-lg shadow-primary/5 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-black text-secondary tracking-tight" data-testid="text-form-title">Nouveau Colis</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Remplissez les détails</p>
                  </div>
                  <Button variant="ghost" onClick={() => setShowForm(false)} className="text-gray-400 font-bold text-xs" data-testid="button-cancel-form">
                    Annuler
                  </Button>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <User className="h-3 w-3" /> Destinataire
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="customerName" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Nom du client" className="h-12 bg-gray-50 border-0 rounded-xl font-medium" {...field} data-testid="input-pro-customer-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="customerPhone" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <PhoneInput value={field.value} onChange={field.onChange} placeholder="812345678" data-testid="input-pro-customer-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <MapPin className="h-3 w-3" /> Adresses
                      </p>
                      <FormField control={form.control} name="pickupAddress" render={({ field }) => (
                        <FormItem className="relative">
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-gray-500">Départ (votre boutique)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute left-3 top-3.5 w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-white z-10" />
                              <Input placeholder="Adresse de départ" className={cn("pl-10 h-12 bg-gray-50 border-0 rounded-xl font-medium", activeField === 'pickup' && "ring-2 ring-primary")}
                                {...field} onChange={(e) => { field.onChange(e); handleAddressChange(e.target.value); }}
                                onFocus={() => setActiveField('pickup')} onBlur={() => setTimeout(() => setActiveField(null), 200)}
                                data-testid="input-pro-pickup" />
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
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest text-gray-500">Destination</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute left-3 top-3.5 w-2.5 h-2.5 bg-primary ring-4 ring-white z-10" />
                              <Input placeholder="Adresse de livraison" className={cn("pl-10 h-12 bg-gray-50 border-0 rounded-xl font-medium", activeField === 'delivery' && "ring-2 ring-primary")}
                                {...field} onChange={(e) => { field.onChange(e); handleAddressChange(e.target.value); }}
                                onFocus={() => setActiveField('delivery')} onBlur={() => setTimeout(() => setActiveField(null), 200)}
                                data-testid="input-pro-delivery" />
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

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <DollarSign className="h-3 w-3" /> Tarification
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="articlePrice" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-gray-500">Prix article (FC)</FormLabel>
                            <FormControl><Input type="number" placeholder="0" className="h-12 bg-gray-50 border-0 rounded-xl font-black text-lg" {...field} data-testid="input-pro-article-price" /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="deliveryFee" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-gray-500">Frais livraison (FC)</FormLabel>
                            <FormControl><Input type="number" className="h-12 bg-gray-50 border-0 rounded-xl font-black text-lg" {...field} data-testid="input-pro-delivery-fee" /></FormControl>
                          </FormItem>
                        )} />
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">Total client</span>
                        <span className="text-base font-black text-secondary" data-testid="text-total-price">
                          {(Number(form.watch("articlePrice") || 0) + Number(form.watch("deliveryFee") || 0)).toLocaleString()} FC
                        </span>
                      </div>
                    </div>

                    <Button type="submit" disabled={isSubmitting}
                      className="w-full h-14 bg-secondary text-white hover:bg-secondary/90 font-black text-base rounded-2xl shadow-xl uppercase tracking-wider"
                      data-testid="button-pro-submit">
                      {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
                      {isSubmitting ? "Envoi en cours..." : "Créer l'expédition"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-2">
            <Package className="h-3.5 w-3.5" /> Dernières expéditions
          </p>
          <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold h-8"
            onClick={() => setLocation('/seller-packages')} data-testid="button-view-all-pro">
            Voir tout
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, téléphone, adresse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 pl-10 bg-white border border-gray-100 rounded-xl text-sm font-medium"
            data-testid="input-pro-search"
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-50 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50/80 border-b border-gray-100">
            <span className="col-span-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Client</span>
            <span className="col-span-3 text-[9px] font-black uppercase tracking-widest text-gray-400">Destination</span>
            <span className="col-span-2 text-[9px] font-black uppercase tracking-widest text-gray-400">Montant</span>
            <span className="col-span-2 text-[9px] font-black uppercase tracking-widest text-gray-400">Statut</span>
            <span className="col-span-1"></span>
          </div>
          <ScrollArea className="max-h-[400px]">
            {filteredDeliveries.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-xs font-bold uppercase tracking-widest">Aucune expédition</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {filteredDeliveries.slice(0, 25).map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setLocation(`/tracking?id=${d.id}`)}
                    className="grid grid-cols-12 gap-2 px-4 py-3.5 items-center hover:bg-gray-50/50 cursor-pointer transition-colors"
                    data-testid={`pro-delivery-${d.id}`}
                  >
                    <div className="col-span-4 min-w-0">
                      <p className="font-bold text-sm text-secondary truncate">{d.customerName}</p>
                      <p className="text-[10px] text-gray-400 truncate">{d.customerPhone}</p>
                    </div>
                    <div className="col-span-3 min-w-0">
                      <p className="text-xs text-gray-500 truncate">{d.deliveryAddress}</p>
                      <p className="text-[10px] text-gray-400">
                        {d.createdAt ? format(new Date(d.createdAt), "dd MMM", { locale: fr }) : ""}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-black text-secondary">
                        {parseFloat(d.articlePrice || "0") > 0
                          ? `${parseFloat(d.articlePrice || "0").toLocaleString()}`
                          : parseFloat(d.deliveryFee || "0").toLocaleString()
                        }
                      </p>
                      <p className="text-[9px] text-gray-400">FC</p>
                    </div>
                    <div className="col-span-2">
                      <Badge className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full", statusColor(d.status))}>
                        {statusLabel(d.status)}
                      </Badge>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </motion.div>
    </div>
  );
}
