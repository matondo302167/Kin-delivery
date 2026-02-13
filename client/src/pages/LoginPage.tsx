import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import PhoneInput from "@/components/PhoneInput";
import { useStore } from "@/lib/store";
import { getProfileByPhone, sendOtp, verifyOtp } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import kolisaLogo from "@/assets/kolisa-logo.png";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { setProfile } = useStore();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 9) {
      toast({ title: "Numéro invalide", description: "Veuillez entrer un numéro de téléphone valide", variant: "destructive" });
      return;
    }
    setIsSendingOtp(true);
    try {
      await sendOtp(phone);
      toast({ title: "Code envoyé", description: "Code envoyé par SMS" });
    } catch (error) {
      toast({ title: "Erreur SMS", description: "Le SMS n'a pas pu être envoyé, mais vous pouvez continuer", variant: "destructive" });
    } finally {
      setIsSendingOtp(false);
      setStep('otp');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      toast({ title: "Code incomplet", description: "Veuillez entrer le code à 6 chiffres", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { verified } = await verifyOtp(phone, otpCode);
      if (!verified) {
        toast({ title: "Code invalide", description: "Le code entré est incorrect", variant: "destructive" });
        setIsLoading(false);
        return;
      }
    } catch (error) {
      toast({ title: "Code invalide", description: "Le code entré est incorrect", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const profile = await getProfileByPhone(phone);
      const roleMap: Record<string, string> = {
        'driver': 'courier',
        'temp_seller': 'temp_seller',
        'pro_seller': 'pro_seller',
        'admin': 'admin',
      };
      const displayRole = roleMap[profile.role || ''] || profile.role || 'customer';
      
      setProfile({
        id: profile.id,
        name: profile.fullName || "",
        phone: profile.phoneNumber,
        role: displayRole as any,
        avatar: profile.avatarUrl || undefined,
      });

      toast({ title: "Connexion réussie", description: `Bienvenue ${profile.fullName}!` });

      setLocation('/');
    } catch (error) {
      toast({ title: "Compte introuvable", description: "Ce numéro n'est pas enregistré. Créez un compte.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <header className="p-6">
        <Button variant="ghost" onClick={() => setLocation('/welcome')} className="flex items-center gap-2" data-testid="button-back">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="text-center mb-8">
              <img src={kolisaLogo} alt="KOLISA" className="h-16 mx-auto mb-6" />
              <h1 className="text-2xl font-black text-secondary tracking-tight mb-2">Connexion</h1>
              <p className="text-gray-500">
                {step === 'phone' ? "Entrez votre numéro de téléphone pour recevoir un code" : "Entrez le code reçu par SMS"}
              </p>
            </div>

            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Numéro de téléphone</label>
                  <PhoneInput value={phone} onChange={setPhone} placeholder="812345678" autoFocus data-testid="input-phone" />
                </div>
                <Button type="submit" disabled={isSendingOtp || phone.length < 9}
                  className="w-full h-14 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-bold text-base gap-2" data-testid="button-send-otp">
                  {isSendingOtp ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Envoyer le code <ArrowRight className="h-5 w-5" /></>}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Numéro de téléphone</label>
                  <div className="h-12 rounded-xl bg-gray-100 flex items-center px-4 text-gray-600 font-medium" data-testid="text-phone-readonly">
                    {phone}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Code de vérification</label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} data-testid="input-otp">
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="h-14 w-12 text-2xl font-black rounded-xl" />
                        <InputOTPSlot index={1} className="h-14 w-12 text-2xl font-black rounded-xl" />
                        <InputOTPSlot index={2} className="h-14 w-12 text-2xl font-black rounded-xl" />
                        <InputOTPSlot index={3} className="h-14 w-12 text-2xl font-black rounded-xl" />
                        <InputOTPSlot index={4} className="h-14 w-12 text-2xl font-black rounded-xl" />
                        <InputOTPSlot index={5} className="h-14 w-12 text-2xl font-black rounded-xl" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <Button type="submit" disabled={isLoading || otpCode.length < 6}
                  className="w-full h-14 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-bold text-base gap-2" data-testid="button-verify-otp">
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Vérifier <ArrowRight className="h-5 w-5" /></>}
                </Button>
                <button type="button" onClick={() => { setStep('phone'); setOtpCode(""); }}
                  className="w-full text-sm text-primary font-bold hover:underline" data-testid="link-change-phone">
                  Modifier le numéro
                </button>
              </form>
            )}

            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">Pas encore de compte?</p>
              <Button variant="link" onClick={() => setLocation('/register')} className="text-primary font-bold" data-testid="link-register">Créer un compte</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
