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
import { MapPin, Phone, User, PackagePlus, Copy } from "lucide-react";

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

  const copyToken = () => {
    if (lastToken) {
      navigator.clipboard.writeText(lastToken);
      toast({ title: "Copié !", description: "Code de suivi copié dans le presse-papier." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-display font-black text-secondary italic">ESPACE VENDEUR</h2>
        <p className="text-muted-foreground font-medium uppercase tracking-tighter text-xs">Vendez, on livre.</p>
      </div>

      {lastToken && (
        <Card className="bg-primary/10 border-2 border-primary/20 border-dashed animate-in zoom-in-95">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-primary tracking-widest">Dernier Tracking</p>
              <p className="text-lg font-mono font-bold">{lastToken}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={copyToken} className="text-primary hover:bg-primary/20">
              <Copy className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-2xl shadow-secondary/10 overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="recipientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Client</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-secondary/40" />
                          <Input placeholder="Nom du client" className="pl-10 h-12 bg-white border-none shadow-sm focus-visible:ring-primary" {...field} />
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
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Numéro</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-secondary/40" />
                          <Input placeholder="08..." type="tel" className="pl-10 h-12 bg-white border-none shadow-sm focus-visible:ring-primary" {...field} />
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
                          <Input placeholder="Quartier, Avenue..." className="pl-10 h-12 bg-white border-none shadow-sm focus-visible:ring-primary" {...field} />
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prix (FC)</FormLabel>
                        <FormControl>
                          <Input type="number" className="h-12 bg-white border-none shadow-sm font-bold text-secondary focus-visible:ring-primary" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 rounded-2xl active:scale-95 transition-all flex gap-2"
              >
                <PackagePlus className="h-6 w-6" />
                COMMANDER LE MOTARD
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
