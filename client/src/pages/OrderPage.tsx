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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Phone, User, PackagePlus } from "lucide-react";
import heroImage from "@/assets/hero-delivery.png";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
      addOrder(values);
      toast({
        title: "Commande créée !",
        description: "Un livreur va bientôt arriver.",
        className: "bg-secondary text-white border-none",
      });
      form.reset();
      setIsSubmitting(false);
    }, 800);
  }

  return (
    <div className="space-y-6">
      <div className="relative h-40 rounded-xl overflow-hidden shadow-lg mb-6">
        <img 
          src={heroImage} 
          alt="Kinshasa Delivery" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
          <h2 className="text-white text-2xl font-display font-bold">Nouvelle Course</h2>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-primary" />
            Détails de la livraison
          </CardTitle>
          <CardDescription>Remplissez les infos pour le livreur.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destinataire</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Nom du client" className="pl-9 bg-background/50" {...field} />
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
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="082..." type="tel" className="pl-9 bg-background/50" {...field} />
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
                    <FormLabel>Adresse de livraison</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Avenue, Quartier, Commune..." className="pl-9 bg-background/50" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix (FC)</FormLabel>
                      <FormControl>
                        <Input type="number" className="bg-background/50 font-bold text-secondary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (Optionnel)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ex: Porte bleue, appeler à l'arrivée..." 
                        className="bg-background/50 resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Envoi..." : "Lancer la course"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
