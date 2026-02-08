import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { createDelivery, getProfileByPhone } from "@/lib/api";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Clock, ArrowRight, Package, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Popup } from 'react-leaflet';
import L, { LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const formSchema = z.object({
  customerName: z.string().min(2, "Nom requis"),
  customerPhone: z.string().min(9, "Numéro invalide"),
  pickupAddress: z.string().min(5, "Adresse de départ requise"),
  deliveryAddress: z.string().min(5, "Adresse d'arrivée requise"),
  deliveryFee: z.coerce.number().min(500, "Livraison min 500 FC"),
  articlePrice: z.coerce.number().min(0, "Prix invalide"),
});

function LocationMarker({ activeField, onLocationSelect, userLocation }: { activeField: 'pickup' | 'delivery' | null, onLocationSelect: (lat: number, lng: number) => void, userLocation: L.LatLng | null }) {
  const [pickupPos, setPickupPos] = useState<L.LatLng | null>(null);
  const [deliveryPos, setDeliveryPos] = useState<L.LatLng | null>(null);
  const map = useMap();

  useEffect(() => {
    if (userLocation) map.flyTo(userLocation, 15);
  }, [userLocation, map]);

  useMapEvents({
    click(e: LeafletMouseEvent) {
      if (activeField === 'pickup') {
        setPickupPos(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      } else if (activeField === 'delivery') {
        setDeliveryPos(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return (
    <>
      {userLocation && <Marker position={userLocation} icon={new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png', iconSize: [25, 41], iconAnchor: [12, 41] })}><Popup>Votre position</Popup></Marker>}
      {pickupPos && <Marker position={pickupPos} icon={new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png', iconSize: [25, 41], iconAnchor: [12, 41] })}><Popup>Point de départ</Popup></Marker>}
      {deliveryPos && <Marker position={deliveryPos} icon={new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png', iconSize: [25, 41], iconAnchor: [12, 41] })}><Popup>Point d'arrivée</Popup></Marker>}
    </>
  );
}

export default function OrderPage() {
  const { profile, setProfile } = useStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const [activeField, setActiveField] = useState<'pickup' | 'delivery' | null>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [pendingFormValues, setPendingFormValues] = useState<z.infer<typeof formSchema> | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      pickupAddress: "Avenue de la Libération, Kinshasa, RDC",
      deliveryAddress: "",
      deliveryFee: 2500,
      articlePrice: 0,
    },
  });

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (e) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation(new L.LatLng(latitude, longitude));
          const address = await fetchAddress(latitude, longitude);
          form.setValue("pickupAddress", address);
        },
        () => {}
      );
    }
  }, []);

  const handleLocationSelect = async (lat: number, lng: number) => {
    const address = await fetchAddress(lat, lng);
    if (activeField === 'pickup') form.setValue("pickupAddress", address);
    else if (activeField === 'delivery') form.setValue("deliveryAddress", address);
    setActiveField(null);
  };

  const { logout } = useStore();

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
      toast({ title: "Course lancée !", description: result.message || `ID: ${result.delivery.id.substring(0, 8)}` });
      form.reset();
      if (profile?.role === 'seller') setLocation("/seller-packages");
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!profile || (profile.role !== 'seller')) {
      setPendingFormValues(values);
      setShowLoginDialog(true);
      return;
    }
    await submitDelivery(values);
  }

  async function handleLoginFromDialog() {
    if (loginPhone.length < 9) { toast({ title: "Numéro invalide", variant: "destructive" }); return; }
    setIsLoggingIn(true);
    try {
      const foundProfile = await getProfileByPhone(loginPhone);
      const displayRole = foundProfile.role === 'driver' ? 'courier' : foundProfile.role === 'temp_seller' || foundProfile.role === 'pro_seller' ? 'seller' : 'customer';
      setProfile({ id: foundProfile.id, name: foundProfile.fullName || "", phone: foundProfile.phoneNumber, role: displayRole as any, avatar: foundProfile.avatarUrl || undefined });
      setShowLoginDialog(false);
      setLoginPhone("");
      toast({ title: "Connexion réussie", description: `Bienvenue ${foundProfile.fullName}!` });
      if (pendingFormValues) { await submitDelivery(pendingFormValues, foundProfile.id); setPendingFormValues(null); }
    } catch (error) {
      toast({ title: "Compte introuvable", description: "Ce numéro n'est pas enregistré.", variant: "destructive" });
    } finally {
      setIsLoggingIn(false);
    }
  }

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const handleAddressChange = async (value: string) => {
    if (value.length > 2) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}+Kinshasa&countrycodes=cd&limit=5`);
        const data = await response.json();
        setSuggestions(data.map((item: any) => item.display_name));
      } catch (e) { setSuggestions([]); }
    } else { setSuggestions([]); }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] overflow-hidden bg-white">
      <div className="w-full md:w-[450px] bg-white z-20 flex flex-col shadow-2xl h-full overflow-y-auto">
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tighter text-secondary">Commander</h1>
              <p className="text-sm text-gray-500 font-medium">Nouvelle livraison express.</p>
            </div>
            <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-2 border-gray-100"
              onClick={() => setLocation("/seller-packages")} data-testid="button-packages">
              <Package className="h-5 w-5 text-secondary" />
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-3xl space-y-4 border border-gray-100 relative">
                <div className="absolute left-[27px] top-[40px] bottom-[40px] w-0.5 bg-gray-300 z-0"></div>
                
                <FormField control={form.control} name="pickupAddress" render={({ field }) => (
                  <FormItem className={cn("relative", activeField === 'pickup' ? "z-30" : "z-20")}>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-3 top-3.5 w-2.5 h-2.5 rounded-full bg-black z-20 ring-4 ring-white" />
                        <Input placeholder="Point de départ" className={cn("pl-10 h-12 bg-white border-0 shadow-sm rounded-xl font-medium", activeField === 'pickup' && "ring-2 ring-black")}
                          {...field} onChange={(e) => { field.onChange(e); handleAddressChange(e.target.value); }}
                          onFocus={() => setActiveField('pickup')} onBlur={() => setTimeout(() => { if (activeField === 'pickup') setActiveField(null); }, 200)}
                          data-testid="input-pickup" />
                        {activeField === 'pickup' && suggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-xl z-[9999] mt-2 border max-h-60 overflow-y-auto">
                            {suggestions.map((s, i) => (
                              <div key={i} className="p-3 hover:bg-gray-50 cursor-pointer text-sm flex items-center gap-3"
                                onMouseDown={(e) => { e.preventDefault(); form.setValue("pickupAddress", s); setSuggestions([]); setActiveField(null); }}>
                                <MapPin className="h-4 w-4 text-gray-400 shrink-0" /><span className="truncate">{s}</span>
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
                  <FormItem className={cn("relative", activeField === 'delivery' ? "z-30" : "z-20")}>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-3 top-3.5 w-2.5 h-2.5 bg-black z-20 ring-4 ring-white" />
                        <Input placeholder="Point d'arrivée" className={cn("pl-10 h-12 bg-white border-0 shadow-sm rounded-xl font-medium", activeField === 'delivery' && "ring-2 ring-black")}
                          {...field} onChange={(e) => { field.onChange(e); handleAddressChange(e.target.value); }}
                          onFocus={() => setActiveField('delivery')} onBlur={() => setTimeout(() => { if (activeField === 'delivery') setActiveField(null); }, 200)}
                          data-testid="input-delivery" />
                        {activeField === 'delivery' && suggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-xl z-[9999] mt-2 border max-h-60 overflow-y-auto">
                            {suggestions.map((s, i) => (
                              <div key={i} className="p-3 hover:bg-gray-50 cursor-pointer text-sm flex items-center gap-3"
                                onMouseDown={(e) => { e.preventDefault(); form.setValue("deliveryAddress", s); setSuggestions([]); setActiveField(null); }}>
                                <MapPin className="h-4 w-4 text-gray-400 shrink-0" /><span className="truncate">{s}</span>
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

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-secondary" /><span className="font-bold text-sm">Partir maintenant</span></div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="customerName" render={({ field }) => (
                    <FormItem><FormControl><Input placeholder="Nom du destinataire" className="h-12 bg-gray-50 border-gray-100 rounded-xl" {...field} data-testid="input-customer-name" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="customerPhone" render={({ field }) => (
                    <FormItem><FormControl><Input placeholder="Tél. destinataire" className="h-12 bg-gray-50 border-gray-100 rounded-xl" {...field} data-testid="input-customer-phone" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="articlePrice" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest">Prix Article (FC)</FormLabel>
                      <FormControl><Input type="number" placeholder="À récupérer" className="h-12 bg-gray-50 border-gray-100 rounded-xl font-black text-lg" {...field} data-testid="input-article-price" /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="deliveryFee" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest">Prix Livraison (FC)</FormLabel>
                      <FormControl><Input type="number" className="h-12 bg-gray-50 border-gray-100 rounded-xl font-black text-lg" {...field} data-testid="input-delivery-fee" /></FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-black hover:bg-gray-800 text-white font-bold text-lg rounded-xl shadow-xl" data-testid="button-submit-order">
                {isSubmitting ? "Envoi en cours..." : "Lancer la course"}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      <div className="flex-1 relative bg-gray-100 h-[50vh] md:h-full w-full">
        <MapContainer center={[-4.325, 15.3222]} zoom={13} scrollWheelZoom={true} className="h-full w-full z-0">
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <LocationMarker activeField={activeField} onLocationSelect={handleLocationSelect} userLocation={userLocation} />
        </MapContainer>
      </div>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="rounded-[2rem] p-8 max-w-sm">
          <DialogHeader><DialogTitle className="text-center font-black text-xl">Connexion requise</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-gray-500 text-center">Connectez-vous pour continuer</p>
            <Input type="tel" placeholder="0812345678" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="h-14 rounded-xl text-lg font-medium text-center" data-testid="input-login-phone" />
            <Button onClick={handleLoginFromDialog} disabled={isLoggingIn || loginPhone.length < 9}
              className="w-full h-14 bg-secondary text-white font-bold rounded-xl" data-testid="button-dialog-login">
              {isLoggingIn ? <Loader2 className="h-5 w-5 animate-spin" /> : "Se connecter"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
