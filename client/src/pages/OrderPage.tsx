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

const formSchema = z.object({
  recipientName: z.string().min(2, "Nom requis"),
  recipientPhone: z.string().min(9, "Numéro invalide"),
  address: z.string().min(5, "Adresse précise requise"),
  price: z.coerce.number().min(500, "Livraison min 500 FC"),
  articlePrice: z.coerce.number().min(0, "Prix invalide"),
  paymentMethod: z.enum(["cod", "mobile_money"]),
  note: z.string().optional(),
});

export default function OrderPage() {
  const { addOrder, orders } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPos, setSelectedPos] = useState({ lat: -4.315, lng: 15.305 });
  const [showLastOrder, setShowLastOrder] = useState(false);

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

  const handleMapClick = () => {
    const newLat = -4.315 + (Math.random() - 0.5) * 0.05;
    const newLng = 15.305 + (Math.random() - 0.5) * 0.05;
    setSelectedPos({ lat: newLat, lng: newLng });
    toast({ title: "Position mise à jour" });
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const token = addOrder({ ...values, lat: selectedPos.lat, lng: selectedPos.lng } as any);
    setShowLastOrder(true);
    toast({
      title: "Course lancée !",
      description: `Code de suivi: ${token}`,
      className: "bg-secondary text-white border-none",
    });
    form.reset();
  }

  const lastOrder = orders[0];

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

      <AnimatePresence>
        {showLastOrder && lastOrder && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card className="bg-primary/10 border-2 border-primary/20 rounded-[2rem] overflow-hidden">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Dernière commande</p>
                  <p className="font-mono font-bold text-lg">{lastOrder.trackingToken}</p>
                </div>
                <Button 
                  onClick={() => setLocation(`/tracking?token=${lastOrder.trackingToken}`)}
                  className="bg-primary text-primary-foreground rounded-xl"
                >
                  <Eye className="mr-2 h-4 w-4" /> Suivre
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-6">
        <Card 
          className="w-full h-64 bg-slate-100 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl relative cursor-crosshair group"
          onClick={handleMapClick}
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute z-10 w-8 h-8 -ml-4 -mt-4 flex items-center justify-center"
            style={{ 
              left: `${50 + (selectedPos.lng - 15.305) * 1000}%`, 
              top: `${50 + (selectedPos.lat + 4.315) * 1000}%` 
            }}
          >
            <div className="absolute w-full h-full bg-primary/40 rounded-full" />
            <div className="w-4 h-4 bg-primary rounded-full border-2 border-white" />
            <MapPin className="absolute -top-6 text-primary h-6 w-6" />
          </motion.div>
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
            <span className="text-[10px] font-black text-secondary uppercase tracking-widest">📍 Destination sur carte</span>
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
                      <FormLabel className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Adresse</FormLabel>
                      <FormControl>
                        <Input placeholder="Commune, Quartier, Avenue..." className="h-13 bg-secondary/5 border-none rounded-2xl focus-visible:ring-primary font-bold px-4" {...field} />
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
                                field.value === "cod" ? "border-primary bg-primary/10 text-primary" : "border-transparent bg-white"
                              )}>
                                <Banknote className="h-6 w-6 mb-1" />
                                <span className="text-[10px] font-black uppercase">Cash on Delivery</span>
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex-1">
                              <FormControl>
                                <RadioGroupItem value="mobile_money" className="sr-only" />
                              </FormControl>
                              <FormLabel className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all",
                                field.value === "mobile_money" ? "border-secondary bg-secondary/10 text-secondary" : "border-transparent bg-white"
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
                          <FormLabel className="text-[9px] font-black uppercase text-muted-foreground ml-1">Prix de l'article</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="FC" className="h-12 bg-white border-none rounded-xl font-black text-secondary" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[9px] font-black uppercase text-muted-foreground ml-1">Frais Livraison</FormLabel>
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
