import { useState } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Truck, ShoppingBag, Store, MapPin, Tag } from "lucide-react";
import { registerSeller, createProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
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

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { setProfile } = useStore();
  const { toast } = useToast();
  const [role, setSelectedRole] = useState<'seller' | 'courier'>('seller');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    if (role === 'seller' && !formData.shopName.trim()) {
      toast({ title: "Champ requis", description: "Veuillez entrer le nom de votre boutique", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      let newProfile;

      if (role === 'seller') {
        newProfile = await registerSeller({
          phoneNumber: formData.phone,
          fullName: formData.fullName,
          shopName: formData.shopName,
          shopAddress: formData.shopAddress || undefined,
          category: formData.category || undefined,
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
        role: role,
      });

      toast({
        title: "Compte créé",
        description: `Bienvenue ${formData.fullName}!`,
      });

      if (role === 'seller') {
        setLocation('/');
      } else {
        setLocation('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le compte",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
          {role === 'seller' && (
            <div className="flex items-start gap-4">
              <div className="bg-primary/20 p-2 rounded-lg"><Check className="h-6 w-6 text-primary" /></div>
              <div>
                <h3 className="font-bold text-lg">Suivi en temps réel</h3>
                <p className="text-white/60 text-sm">Vos clients suivent leur colis en direct.</p>
              </div>
            </div>
          )}
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
            <div onClick={() => setSelectedRole('seller')}
              className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${role === 'seller' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
              data-testid="role-seller">
              <ShoppingBag className={`h-8 w-8 mb-2 ${role === 'seller' ? 'text-primary' : 'text-gray-400'}`} />
              <p className="font-bold text-sm">Vendeur</p>
            </div>
            <div onClick={() => setSelectedRole('courier')}
              className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${role === 'courier' ? 'border-secondary bg-secondary/5' : 'border-gray-100 hover:border-gray-200'}`}
              data-testid="role-courier">
              <Truck className={`h-8 w-8 mb-2 ${role === 'courier' ? 'text-secondary' : 'text-gray-400'}`} />
              <p className="font-bold text-sm">Livreur</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input id="fullName" name="fullName" required placeholder="Votre nom" value={formData.fullName} onChange={handleChange} className="h-12 rounded-xl" data-testid="input-name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" name="phone" required placeholder="08..." value={formData.phone} onChange={handleChange} className="h-12 rounded-xl" data-testid="input-phone" />
            </div>

            {role === 'seller' && (
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
              {isSubmitting ? "Création..." : "S'inscrire"}
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
    </div>
  );
}
