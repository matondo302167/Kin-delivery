import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { getProfileByPhone } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import kolisaLogo from "@/assets/kolisa-logo.png";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { setProfile } = useStore();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.slice(0, 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phone.length < 9) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez entrer un numéro de téléphone valide",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const profile = await getProfileByPhone(phone);
      
      setProfile({
        id: profile.id,
        name: profile.name,
        phone: profile.phone,
        email: profile.email || undefined,
        role: profile.role as 'seller' | 'courier' | 'customer',
        avatar: profile.avatar || undefined,
      });

      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${profile.name}!`,
      });

      if (profile.role === 'courier') {
        setLocation('/dashboard');
      } else if (profile.role === 'seller') {
        setLocation('/');
      } else {
        setLocation('/tracking');
      }
    } catch (error) {
      toast({
        title: "Compte introuvable",
        description: "Ce numéro n'est pas enregistré. Créez un compte.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <header className="p-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/welcome')}
          className="flex items-center gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="text-center mb-8">
              <img 
                src={kolisaLogo} 
                alt="KOLISA" 
                className="h-16 mx-auto mb-6"
              />
              <h1 className="text-2xl font-black text-secondary tracking-tight mb-2">
                Connexion
              </h1>
              <p className="text-gray-500">
                Entrez votre numéro de téléphone pour vous connecter
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Numéro de téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="tel"
                    placeholder="0812345678"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    className="pl-12 h-14 rounded-xl text-lg font-medium"
                    data-testid="input-phone"
                    autoFocus
                  />
                </div>
              </div>

              <Button 
                type="submit"
                disabled={isLoading || phone.length < 9}
                className="w-full h-14 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-bold text-base gap-2"
                data-testid="button-login"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                Pas encore de compte?
              </p>
              <Button
                variant="link"
                onClick={() => setLocation('/register')}
                className="text-primary font-bold"
                data-testid="link-register"
              >
                Créer un compte
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
