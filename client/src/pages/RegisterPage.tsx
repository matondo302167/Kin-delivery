import { useState } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PhoneInput from "@/components/PhoneInput";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Truck, Store, MapPin, Tag, Crown, Loader2 } from "lucide-react";
import { registerSeller, createProfile, sendOtp, verifyOtp } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import kolisaLogo from "@/assets/kolisa-logo.png";

const SELLER_CATEGORIES = [
  { value: "mode", label: "Mode & Vêtements" },
  { value: "electronique", label: "Électronique" },
  { value: "alimentation", label: "Alimentation" },
  { value: "beaute", label: "Beauté & Cosmétiques" },
  { value: "maison", label: "Maison & Décoration" },
  { value: "sante", label: "Santé & Bien-être" },
  { value: "sport", label: "Sport & Loisirs" },
  { value: "autre", label: "Autre" },
];

type RoleChoice = 'pro_seller' | 'courier';

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { setProfile } = useStore();
  const { toast } = useToast();
  const [role, setSelectedRole] = useState<RoleChoice>('pro_seller');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    shopName: "",
    shopAddress: "",
    category: "",
    vehicleType: "moto",
    licensePlate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === 'pro_seller' && !formData.shopName.trim()) {
      toast({ title: "Champ requis", description: "Veuillez entrer le nom de votre boutique", variant: "destructive" });
      return;
    }

    if (formData.phone.length < 9) {
      toast({ title: "Numéro invalide", description: "Veuillez entrer un numéro de téléphone valide", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await sendOtp(formData.phone);
      toast({ title: "Code envoyé", description: "Code envoyé par SMS" });
    } catch (error) {
      toast({ title: "Erreur SMS", description: "Le SMS n'a pas pu être envoyé, mais vous pouvez continuer", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setShowOtpStep(true);
      setOtpCode("");
    }
  };

  const handleVerifyAndRegister = async () => {
    if (otpCode.length < 6) {
      toast({ title: "Code incomplet", description: "Veuillez entrer le code à 6 chiffres", variant: "destructive" });
      return;
    }

    setIsVerifying(true);
    try {
      const { verified } = await verifyOtp(formData.phone, otpCode);
      if (!verified) {
        toast({ title: "Code invalide", description: "Le code entré est incorrect", variant: "destructive" });
        setIsVerifying(false);
        return;
      }
    } catch (error) {
      toast({ title: "Code invalide", description: "Le code entré est incorrect", variant: "destructive" });
      setIsVerifying(false);
      return;
    }

    try {
      let newProfile;

      if (role === 'pro_seller') {
        newProfile = await registerSeller({
          phoneNumber: formData.phone,
          fullName: formData.fullName,
          shopName: formData.shopName,
          shopAddress: formData.shopAddress || undefined,
          category: formData.category || undefined,
          sellerType: 'pro_seller',
        });
      } else {
        newProfile = await createProfile({
          phoneNumber: formData.phone,
          fullName: formData.fullName,
          role: 'driver',
        });
      }

      setProfile({
        id: newProfile.id,
        name: newProfile.fullName || "",
        phone: newProfile.phoneNumber,
        role: role === 'courier' ? 'courier' : 'pro_seller',
      });

      toast({
        title: "Compte créé",
        description: `Bienvenue ${formData.fullName}!`,
      });

      setShowOtpStep(false);
      setLocation('/');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le compte",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 bg-secondary text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <img src={kolisaLogo} alt="KOLISA" className="h-10 w-10 object-contain" />
            <h1 className="text-4xl font-black tracking-tighter">KOLISA</h1>
          </div>
          <p className="text-white/60 font-medium">Rejoignez la révolution logistique à Kinshasa.</p>
        </div>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary/20 p-2 rounded-lg"><Check className="h-6 w-6 text-primary" /></div>
            <div>
              <h3 className="font-bold text-lg">Paiements Rapides</h3>
              <p className="text-white/60 text-sm">Recevez vos gains directement sur Mobile Money.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-primary/20 p-2 rounded-lg"><Check className="h-6 w-6 text-primary" /></div>
            <div>
              <h3 className="font-bold text-lg">Flexibilité Totale</h3>
              <p className="text-white/60 text-sm">Travaillez quand vous voulez, où vous voulez.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-primary/20 p-2 rounded-lg"><Check className="h-6 w-6 text-primary" /></div>
            <div>
              <h3 className="font-bold text-lg">Suivi en temps réel</h3>
              <p className="text-white/60 text-sm">Vos clients suivent leur colis en direct.</p>
            </div>
          </div>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-white/40">© 2026 KOLISA RDC</p>
      </div>

      <div className="flex-1 p-8 md:p-20 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-secondary">Créer un compte</h2>
            <p className="text-gray-500 mt-2">Choisissez votre profil pour commencer.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div onClick={() => setSelectedRole('pro_seller')}
              className={`cursor-pointer p-5 rounded-2xl border-2 transition-all text-center ${role === 'pro_seller' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
              data-testid="role-pro-seller">
              <Crown className={`h-8 w-8 mx-auto mb-2 ${role === 'pro_seller' ? 'text-primary' : 'text-gray-400'}`} />
              <p className="font-bold text-sm">Vendeur Pro</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Boutique & business</p>
            </div>
            <div onClick={() => setSelectedRole('courier')}
              className={`cursor-pointer p-5 rounded-2xl border-2 transition-all text-center ${role === 'courier' ? 'border-secondary bg-secondary/5' : 'border-gray-100 hover:border-gray-200'}`}
              data-testid="role-courier">
              <Truck className={`h-8 w-8 mx-auto mb-2 ${role === 'courier' ? 'text-secondary' : 'text-gray-400'}`} />
              <p className="font-bold text-sm">Livreur</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Conduire & livrer</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input id="fullName" name="fullName" required placeholder="Votre nom" value={formData.fullName} onChange={handleChange} className="h-12 rounded-xl" data-testid="input-name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <PhoneInput value={formData.phone} onChange={(val) => setFormData(prev => ({ ...prev, phone: val }))} placeholder="812345678" data-testid="input-phone" />
            </div>

            {role === 'pro_seller' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="shopName" className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" /> Nom de la boutique *
                  </Label>
                  <Input id="shopName" name="shopName" required placeholder="Ex: Boutique Mama Jolie" value={formData.shopName} onChange={handleChange} className="h-12 rounded-xl" data-testid="input-shop-name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopAddress" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> Adresse de la boutique
                  </Label>
                  <Input id="shopAddress" name="shopAddress" placeholder="Ex: Avenue Kasa-Vubu, Bandalungwa" value={formData.shopAddress} onChange={handleChange} className="h-12 rounded-xl" data-testid="input-shop-address" />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" /> Catégorie
                  </Label>
                  <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                    <SelectTrigger className="h-12 rounded-xl" data-testid="select-category">
                      <SelectValue placeholder="Choisissez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {SELLER_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value} data-testid={`category-${cat.value}`}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {role === 'courier' && (
              <>
                <div className="space-y-2">
                  <Label>Type de véhicule</Label>
                  <RadioGroup defaultValue="moto" onValueChange={(val) => setFormData({...formData, vehicleType: val})} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="moto" id="moto" />
                      <Label htmlFor="moto">Moto</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bike" id="bike" />
                      <Label htmlFor="bike">Vélo</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">Plaque d'immatriculation</Label>
                  <Input id="licensePlate" name="licensePlate" placeholder="KIN..." value={formData.licensePlate} onChange={handleChange} className="h-12 rounded-xl" />
                </div>
              </>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-secondary text-white font-bold rounded-xl text-lg mt-8" data-testid="button-register">
              {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Envoi du code...</> : "S'inscrire"}
            </Button>
          </form>
          
          <div className="text-center space-y-2">
            <p className="text-gray-500 text-sm">Déjà un compte?</p>
            <button onClick={() => setLocation('/login')} className="text-sm font-bold text-primary underline">Se connecter</button>
            <br />
            <button onClick={() => setLocation('/welcome')} className="text-sm text-gray-400 underline mt-2">Retour à l'accueil</button>
          </div>
        </div>
      </div>

      <Dialog open={showOtpStep} onOpenChange={setShowOtpStep}>
        <DialogContent className="rounded-[2rem] p-8 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center font-black text-2xl tracking-tight text-secondary">Vérification</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            <p className="text-sm text-gray-500 text-center">
              Entrez le code à 6 chiffres envoyé au <span className="font-bold text-secondary">{formData.phone}</span>
            </p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} data-testid="input-register-otp">
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
            <Button onClick={handleVerifyAndRegister} disabled={isVerifying || otpCode.length < 6}
              className="w-full h-14 bg-secondary hover:bg-secondary/90 text-white font-bold rounded-xl text-base" data-testid="button-verify-register-otp">
              {isVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Vérifier et créer le compte"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
