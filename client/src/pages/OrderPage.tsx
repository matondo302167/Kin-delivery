import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, User, PackagePlus, Navigation, Eye, Wallet, Banknote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import sellerHero from "@/assets/seller-hero.png";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const formSchema = z.object({
  recipientName: z.string().min(2, "Nom requis"),
  recipientPhone: z.string().min(9, "Numéro invalide"),
  address: z.string().min(5, "Adresse précise requise"),
  price: z.coerce.number().min(500, "Livraison min 500 FC"),
  articlePrice: z.coerce.number().min(0, "Prix invalide"),
  paymentMethod: z.enum(["cod", "mobile_money"]),
  note: z.string().optional(),
});

function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMap();

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function OrderPage() {
  const { addOrder, orders } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPos, setSelectedPos] = useState({ lat: -4.325, lng: 15.3222 }); // Kinshasa center

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientName: "",
      recipientPhone: "",
      address: "",
      price: 2500,
      articlePrice: 0,
      paymentMethod: "cod",
      note: "",
    },
  });

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedPos({ lat, lng });
    const addresses = [
      "Avenue Lukusa, Gombe",
      "Boulevard du 30 Juin, Gombe",
      "Avenue des Huileries, Lingwala",
      "Place Victoire, Kalamu",
      "UPN, Ngaliema",
      "Quartier GB, Gombe",
      "Rond-point Ngaba, Ngaba",
      "Binza Pigeon, Ngaliema",
      "Masina Sans-Fil, Masina",
      "Matete, Quartier 13",
      "Limete Industrial, 7ème Rue"
    ];
    const randomAddress = addresses[Math.floor(Math.random() * addresses.length)];
    form.setValue("address", randomAddress);
    toast({ 
      title: "Position sélectionnée", 
      description: `Coordonnées: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    });
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const token = addOrder({ ...values, lat: selectedPos.lat, lng: selectedPos.lng } as any);
    toast({
      title: "Course lancée !",
      description: `Tracking: ${token}`,
      className: "bg-secondary text-white",
    });
    form.reset();
  }

  const myOrders = orders.filter(o => o.status !== 'delivered');

  return (
    <div className="space-y-6 pb-20">
      <div className="relative h-44 rounded-[2.5rem] overflow-hidden shadow-2xl group">
        <img src={sellerHero} alt="Seller" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 via-secondary/40 to-transparent flex items-center p-8">
           <div className="space-y-2">
             <h2 className="text-white text-4xl font-black italic tracking-tighter uppercase leading-none">VENDRE</h2>
             <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Kinshasa Express</p>
           </div>
        </div>
      </div>

      {myOrders.length > 0 && (
        <Card className="bg-primary/10 border-2 border-primary/20 rounded-[2rem] overflow-hidden">
          <CardContent className="p-4 space-y-4">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest px-2">Suivre mes colis en cours ({myOrders.length})</p>
            <div className="space-y-2">
              {myOrders.map(o => (
                <div key={o.id} className="bg-white/50 p-3 rounded-2xl flex items-center justify-between shadow-sm border border-white">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-secondary">{o.recipientName}</span>
                    <span className="text-[10px] font-mono opacity-60">{o.trackingToken}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      "text-[9px] font-black uppercase py-0.5",
                      o.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    )}>
                      {o.status === 'pending' ? 'Attente' : 'En route'}
                    </Badge>
                    <Button size="icon" variant="ghost" onClick={() => setLocation(`/tracking?token=${o.trackingToken}`)} className="h-8 w-8 rounded-xl bg-primary text-primary-foreground">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-6">
        <Card className="w-full h-96 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl relative z-0">
          <MapContainer 
            center={[-4.325, 15.3222]} 
            zoom={13} 
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker onLocationSelect={handleLocationSelect} />
          </MapContainer>
          
          <div className="absolute top-4 left-4 right-4 z-[400] flex justify-between gap-2 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-md border border-slate-100 flex-1 pointer-events-auto">
              <p className="text-[7px] font-black text-secondary uppercase tracking-tighter">Ville</p>
              <p className="text-[10px] font-bold">Kinshasa</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-md border border-slate-100 flex-1 pointer-events-auto">
              <p className="text-[7px] font-black text-secondary uppercase tracking-tighter">Carte</p>
              <p className="text-[10px] font-bold italic">Interactive</p>
            </div>
          </div>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] bg-white/95 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-primary/20 text-center w-[85%] pointer-events-auto">
            <p className="text-[9px] font-black text-secondary uppercase tracking-widest">Carte Interactive</p>
            <p className="text-[8px] font-bold text-muted-foreground mt-1">Déplacez et cliquez pour choisir l'adresse</p>
          </div>
        </Card>

        <Card className="w-full border-none shadow-2xl bg-white rounded-[2.5rem]">
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recipientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Client</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-4 top-3.5 h-4 w-4 text-secondary/30" />
                            <Input placeholder="Nom du client" className="pl-12 h-13 bg-secondary/5 border-none rounded-2xl focus-visible:ring-primary font-bold" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="recipientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Téléphone</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-4 top-3.5 h-4 w-4 text-secondary/30" />
                            <Input placeholder="08..." className="pl-12 h-13 bg-secondary/5 border-none rounded-2xl focus-visible:ring-primary font-bold" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Adresse de livraison</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-secondary/30" />
                          <Input placeholder="Sélectionnez sur la carte ou tapez ici..." className="pl-12 h-13 bg-secondary/5 border-none rounded-2xl focus-visible:ring-primary font-bold" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="p-6 bg-secondary/5 rounded-3xl space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary text-center">Paiement & Prix</p>
                  
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-4"
                          >
                            <FormItem className="flex-1">
                              <FormControl>
                                <RadioGroupItem value="cod" className="sr-only" />
                              </FormControl>
                              <FormLabel className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all",
                                field.value === "cod" ? "border-primary bg-primary/10 text-primary" : "border-transparent bg-white shadow-sm"
                              )}>
                                <Banknote className="h-6 w-6 mb-1" />
                                <span className="text-[10px] font-black uppercase">Cash (COD)</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex-1">
                              <FormControl>
                                <RadioGroupItem value="mobile_money" className="sr-only" />
                              </FormControl>
                              <FormLabel className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all",
                                field.value === "mobile_money" ? "border-secondary bg-secondary/10 text-secondary" : "border-transparent bg-white shadow-sm"
                              )}>
                                <Wallet className="h-6 w-6 mb-1" />
                                <span className="text-[10px] font-black uppercase">Mobile Money</span>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="articlePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[9px] font-black uppercase text-muted-foreground ml-1">À Encaisser</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Article" className="h-12 bg-white border-none rounded-xl font-black text-secondary" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[9px] font-black uppercase text-muted-foreground ml-1">Frais Liv.</FormLabel>
                          <FormControl>
                            <Input type="number" className="h-12 bg-white border-none rounded-xl font-black text-primary" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-primary/30 text-lg group">
                  LANCER LA COURSE
                  <PackagePlus className="ml-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Badge({ children, className }: any) {
  return <span className={cn("px-2 py-0.5 rounded-full", className)}>{children}</span>;
}


        <Card className="w-full border-none shadow-2xl bg-white rounded-[2.5rem]">
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recipientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Client</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-4 top-3.5 h-4 w-4 text-secondary/30" />
                            <Input placeholder="Nom du client" className="pl-12 h-13 bg-secondary/5 border-none rounded-2xl focus-visible:ring-primary font-bold" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="recipientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Téléphone</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-4 top-3.5 h-4 w-4 text-secondary/30" />
                            <Input placeholder="08..." className="pl-12 h-13 bg-secondary/5 border-none rounded-2xl focus-visible:ring-primary font-bold" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Adresse de livraison</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-secondary/30" />
                          <Input placeholder="Sélectionnez sur la carte ou tapez ici..." className="pl-12 h-13 bg-secondary/5 border-none rounded-2xl focus-visible:ring-primary font-bold" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="p-6 bg-secondary/5 rounded-3xl space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-secondary text-center">Paiement & Prix</p>
                  
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex gap-4"
                          >
                            <FormItem className="flex-1">
                              <FormControl>
                                <RadioGroupItem value="cod" className="sr-only" />
                              </FormControl>
                              <FormLabel className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all",
                                field.value === "cod" ? "border-primary bg-primary/10 text-primary" : "border-transparent bg-white shadow-sm"
                              )}>
                                <Banknote className="h-6 w-6 mb-1" />
                                <span className="text-[10px] font-black uppercase">Cash (COD)</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex-1">
                              <FormControl>
                                <RadioGroupItem value="mobile_money" className="sr-only" />
                              </FormControl>
                              <FormLabel className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all",
                                field.value === "mobile_money" ? "border-secondary bg-secondary/10 text-secondary" : "border-transparent bg-white shadow-sm"
                              )}>
                                <Wallet className="h-6 w-6 mb-1" />
                                <span className="text-[10px] font-black uppercase">Mobile Money</span>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="articlePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[9px] font-black uppercase text-muted-foreground ml-1">À Encaisser</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Article" className="h-12 bg-white border-none rounded-xl font-black text-secondary" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[9px] font-black uppercase text-muted-foreground ml-1">Frais Liv.</FormLabel>
                          <FormControl>
                            <Input type="number" className="h-12 bg-white border-none rounded-xl font-black text-primary" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-primary/30 text-lg group">
                  LANCER LA COURSE
                  <PackagePlus className="ml-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Badge({ children, className }: any) {
  return <span className={cn("px-2 py-0.5 rounded-full", className)}>{children}</span>;
}
