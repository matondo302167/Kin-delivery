import { useState } from "react";
import { useStore } from "@/lib/store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { User, Phone, Mail, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  name: z.string().min(2, "Nom trop court"),
  phone: z.string().min(9, "Téléphone invalide"),
  email: z.string().email("Email invalide"),
});

export default function ProfilePage() {
  const { profile, updateProfile } = useStore();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || "",
      phone: profile?.phone || "",
      email: profile?.email || "",
    },
  });

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    updateProfile(values);
    setIsEditing(false);
    toast({
      title: "Profil mis à jour",
      description: "Vos informations ont été enregistrées.",
      className: "bg-secondary text-white",
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="text-center space-y-4">
        <div className="inline-block">
          <div className="h-32 w-32 border-4 border-white shadow-2xl ring-4 ring-primary/20 mx-auto rounded-full bg-secondary/10 flex items-center justify-center" data-testid="profile-silhouette">
            <User size={48} className="text-secondary/50" />
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-black font-display text-secondary italic tracking-tighter uppercase">{profile?.name || 'Utilisateur'}</h2>
          <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">{profile?.phone || 'Non renseigné'}</p>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-secondary p-8 text-white">
          <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center justify-between">
            Informations Personnelles
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl">
                Modifier
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nom Complet</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-4 top-3.5 h-4 w-4 text-secondary/30" />
                        <Input disabled={!isEditing} className="pl-12 h-14 bg-secondary/5 border-none rounded-2xl focus-visible:ring-primary font-bold" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Téléphone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-4 top-3.5 h-4 w-4 text-secondary/30" />
                        <Input disabled={!isEditing} className="pl-12 h-14 bg-secondary/5 border-none rounded-2xl focus-visible:ring-primary font-bold" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">E-mail</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 h-4 w-4 text-secondary/30" />
                        <Input disabled={!isEditing} className="pl-12 h-14 bg-secondary/5 border-none rounded-2xl focus-visible:ring-primary font-bold" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditing && (
                <div className="flex gap-4">
                  <Button type="button" variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest" onClick={() => setIsEditing(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-xl shadow-primary/20">
                    <Save className="mr-2 h-5 w-5" /> Sauver
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
