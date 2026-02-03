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
import { MapPin, Phone, User, PackagePlus, Navigation } from "lucide-react";
import sellerHero from "@/assets/seller-hero.png";

const formSchema = z.object({
  recipientName: z.string().min(2, "Nom requis"),
  recipientPhone: z.string().min(9, "Numéro invalide"),
  address: z.string().min(5, "Adresse précise requise"),
  price: z.coerce.number().min(500, "Prix minimum 500 FC"),
  note: z.string().optional(),
});

export default function OrderPage() {
  const { addOrder } = useStore();
  const { toast } = useToast();
  const [selectedPos, setSelectedPos] = useState({ lat: -4.315, lng: 15.305 });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientName: "",
      recipientPhone: "",
      address: "",
      price: 2500,
      note: "",
    },
  });

  // Mock Map Interaction
  const handleMapClick = (e: any) => {
    // In a real map, we'd get coordinates. Here we simulate movement.
    const newLat = -4.315 + (Math.random() - 0.5) * 0.05;
    const newLng = 15.305 + (Math.random() - 0.5) * 0.05;
    setSelectedPos({ lat: newLat, lng: newLng });
    toast({
      title: "Position mise à jour",
      description: `Lat: ${newLat.toFixed(4)}, Lng: ${newLng.toFixed(4)}`,
    });
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const token = addOrder({ ...values, lat: selectedPos.lat, lng: selectedPos.lng } as any);
    toast({
      title: "Course lancée !",
      description: `Code de suivi: ${token}`,
      className: "bg-secondary text-white border-none",
    });
    form.reset();
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="relative h-40 rounded-[2.5rem] overflow-hidden shadow-2xl mb-4 group">
        <img src={sellerHero} alt="Seller" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 to-transparent flex items-center p-8">
           <div className="space-y-1">
             <h2 className="text-white text-3xl font-black italic tracking-tighter uppercase leading-none">NOUVELLE COURSE</h2>
             <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Zone Kinshasa Centrale</p>
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Simplified Interactive Map Mock */}
        <Card 
          className="w-full h-64 bg-slate-100 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl relative cursor-crosshair group"
          onClick={handleMapClick}
        >
          {/* Mock Map Background using a Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
             <Navigation className="w-48 h-48 rotate-45 text-secondary" />
          </div>
          
          {/* Pulsing Marker */}
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
            <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg" />
            <MapPin className="absolute -top-6 text-primary h-6 w-6" />
          </motion.div>

          <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl flex items-center justify-between shadow-lg">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Point de livraison</span>
             </div>
             <p className="text-[10px] font-mono font-bold text-muted-foreground">Cliquez pour changer</p>
          </div>
        </Card>

        <Card className="w-full border-none shadow-2xl shadow-secondary/5 overflow-hidden bg-white rounded-[2rem]">
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="recipientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Destinataire</FormLabel>
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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Adresse Textuelle</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-secondary/30" />
                          <Input placeholder="Commune, Quartier, Avenue..." className="pl-12 h-13 bg-secondary/5 border-none rounded-2xl focus-visible:ring-primary font-bold" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recipientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Téléphone</FormLabel>
                        <FormControl>
                          <Input placeholder="08..." type="tel" className="h-13 bg-secondary/5 border-none rounded-2xl focus-visible:ring-primary font-bold" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Livraison (FC)</FormLabel>
                        <FormControl>
                          <Input type="number" className="h-13 bg-secondary/5 border-none rounded-2xl focus-visible:ring-primary font-black text-secondary" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full h-15 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.15em] rounded-2xl shadow-2xl shadow-primary/30 mt-4 active:scale-95 transition-all text-lg">
                  LANCER LA COURSE
                  <PackagePlus className="ml-3 h-6 w-6" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
