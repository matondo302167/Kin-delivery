import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, User, PackagePlus, Copy, Map as MapIcon } from "lucide-react";
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
  const [lastToken, setLastToken] = useState<string | null>(null);

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

  function onSubmit(values: z.infer<typeof formSchema>) {
    const token = addOrder(values);
    setLastToken(token);
    toast({
      title: "Course lancée !",
      description: `Code de suivi: ${token}`,
      className: "bg-secondary text-white border-none",
    });
    form.reset();
  }

  return (
    <div className="space-y-6">
      <div className="relative h-32 rounded-3xl overflow-hidden shadow-xl mb-4 group">
        <img src={sellerHero} alt="Seller" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/80 to-transparent flex items-center p-8">
           <h2 className="text-white text-2xl font-black italic tracking-tighter">ESPACE VENDEUR</h2>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 items-start">
        {/* Form Column */}
        <Card className="w-full border-none shadow-2xl shadow-secondary/5 overflow-hidden bg-white/50 backdrop-blur-sm rounded-3xl">
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="recipientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Client</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-secondary/40" />
                          <Input placeholder="Nom du client" className="pl-10 h-11 bg-white border-none shadow-sm" {...field} />
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
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Destination</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-secondary/40" />
                          <Input placeholder="Quartier, Avenue..." className="pl-10 h-11 bg-white border-none shadow-sm" {...field} />
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tél</FormLabel>
                        <FormControl>
                          <Input placeholder="08..." type="tel" className="h-11 bg-white border-none shadow-sm" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">FC</FormLabel>
                        <FormControl>
                          <Input type="number" className="h-11 bg-white border-none shadow-sm font-bold" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full h-12 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20">
                  <PackagePlus className="mr-2 h-5 w-5" />
                  COMMANDER
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Map Placeholder Column */}
        <div className="w-full h-64 lg:h-full min-h-[300px] rounded-3xl bg-muted/20 border-2 border-dashed border-muted flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://api.dicebear.com/7.x/identicon/svg?seed=kinshasa')] opacity-5" />
          <div className="bg-white p-4 rounded-full shadow-xl mb-4 relative z-10 group-hover:scale-110 transition-transform">
            <MapIcon className="h-10 w-10 text-secondary" />
          </div>
          <h4 className="font-black text-secondary uppercase tracking-widest relative z-10">Localisation</h4>
          <p className="text-xs text-muted-foreground mt-2 relative z-10">La carte interactive de Kinshasa s'affichera ici pour sélectionner précisément le point de livraison.</p>
        </div>
      </div>
    </div>
  );
}
