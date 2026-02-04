import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Search, MapPin, ArrowRight, UserPlus, LogIn, Send, Globe, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import heroCourier from "@/assets/hero-courier-illustration.png";
import courierIllustration from "@/assets/courier-illustration.png";
import sellerIllustration from "@/assets/seller-illustration.png";
import sendParcelDrawing from "@/assets/send-parcel-drawing.png";

export default function WelcomePage() {
  const { setRole } = useStore();
  const [, setLocation] = useLocation();
  const [trackingCode, setTrackingCode] = useState("");
  const { toast } = useToast();
  const [locationName, setLocationName] = useState("Kinshasa, RDC");

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            if (data && data.address) {
              const city = data.address.city || data.address.town || data.address.village || data.address.county;
              const country = data.address.country;
              if (city && country) {
                setLocationName(`${city}, ${country}`);
              } else if (country) {
                setLocationName(country);
              }
            }
          } catch (error) {
            console.error("Error fetching location:", error);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  const handleTrack = () => {
    if (trackingCode.trim()) {
      setLocation(`/tracking?token=${trackingCode.trim().toUpperCase()}`);
    } else {
      toast({
        title: "Code requis",
        description: "Veuillez entrer un numéro de suivi pour continuer.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-black overflow-x-hidden">
      {/* Header / Navbar harmonisé avec les autres pages */}
      <header className="bg-white border-b border-gray-100 px-6 md:px-20 py-4 flex items-center justify-between sticky top-0 z-[1000]">
        <div className="flex items-center gap-12">
          <h1 className="text-2xl font-black tracking-tighter text-secondary">KOLISA</h1>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setLocation('/profile')} className="text-sm font-bold text-secondary">Connexion</button>
          <button onClick={() => setLocation('/register')} className="bg-primary text-secondary px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest hover:bg-primary/90 transition-colors">S'inscrire</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 md:px-20 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh]">
        <div className="space-y-10 max-w-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              <MapPin className="h-3 w-3" /> {locationName}
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] text-secondary">
              Où est votre <br /> 
              <span className="text-primary italic font-black">colis ?</span>
            </h2>
          </div>

          {/* Nouveau Design du champ de suivi */}
          <div className="relative group max-w-md">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/30 transition-all duration-500" />
            <div className="relative flex items-center bg-white p-2 rounded-full shadow-2xl border-2 border-primary/10">
              <div className="pl-4 pr-2">
                <Search className="h-5 w-5 text-secondary/30" />
              </div>
              <Input 
                placeholder="Code de suivi (ex: 1234)" 
                className="border-none bg-transparent focus-visible:ring-0 text-lg font-black placeholder:text-gray-300 p-0 h-12"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              />
              <Button 
                onClick={handleTrack}
                className="bg-secondary text-white hover:bg-black px-8 h-12 rounded-full font-black uppercase tracking-widest text-xs"
              >
                Suivre
              </Button>
            </div>
          </div>
        </div>

        <div className="relative">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[3rem] overflow-hidden"
          >
            <img src={heroCourier} alt="Livreur Hero" className="w-full h-auto object-contain" />
          </motion.div>
        </div>
      </section>

      {/* Options Section - Style selon les images chargées */}
      <section className="px-6 md:px-20 py-24 border-t border-gray-50 bg-gray-50/30">
        <h3 className="text-3xl font-black mb-16 tracking-tighter text-secondary">Suggestions</h3>
        
        <div className="space-y-24">
          {/* Option: Envoyer un colis (Design exact de l'image Uber) */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 group">
            <div className="flex-1 space-y-6 max-w-xl">
              <h3 className="text-5xl font-black tracking-tighter text-secondary leading-tight">Envoyez un colis à vos proches</h3>
              <p className="text-lg text-gray-500 font-medium leading-relaxed">
                Planifiez une livraison instantanée partout à Kinshasa. 
                Simple, rapide et sécurisé avec suivi en temps réel.
              </p>
              <div className="flex items-center gap-6 pt-4">
                <Button 
                  onClick={() => { setRole('seller'); setLocation('/'); }}
                  className="bg-black text-white hover:bg-gray-800 px-10 h-14 rounded-xl font-black uppercase tracking-widest text-xs"
                >
                  Envoyer un colis
                </Button>
                <button 
                  onClick={() => setLocation('/seller-details')}
                  className="text-sm font-black underline decoration-2 underline-offset-8 hover:text-primary transition-colors"
                >
                  Détails
                </button>
              </div>
            </div>
            <div className="flex-1 relative">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-[#F6F6F6] rounded-[2.5rem] p-12 flex items-center justify-center min-h-[400px]"
              >
                <img 
                  src={sendParcelDrawing} 
                  alt="Envoyer colis" 
                  className="w-full max-w-md h-auto object-contain drop-shadow-2xl" 
                />
              </motion.div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12">
            {/* Option: Devenir Livreur */}
            <div className="bg-[#F6F6F6] p-12 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 group cursor-pointer hover:shadow-xl transition-all" onClick={() => { setRole('courier'); setLocation('/dashboard'); }}>
              <div className="flex-1 space-y-4">
                <h4 className="text-3xl font-black tracking-tighter text-secondary">Devenir Livreur</h4>
                <p className="text-sm text-gray-500 font-medium">Gagnez de l'argent en livrant selon votre propre horaire.</p>
                <div className="flex gap-4">
                  <Button onClick={(e) => { e.stopPropagation(); setLocation('/register'); }} variant="outline" className="rounded-full px-6 font-bold group-hover:bg-black group-hover:text-white transition-all">S'inscrire</Button>
                  <Button onClick={(e) => { e.stopPropagation(); setLocation('/courier-details'); }} variant="ghost" className="rounded-full px-4 font-bold text-gray-500 hover:text-black">Détails</Button>
                </div>
              </div>
              <div className="w-40 h-32 flex items-center justify-center">
                <img src={courierIllustration} alt="Livreur" className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Option: Vendre en ligne */}
            <div className="bg-[#F6F6F6] p-12 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 group cursor-pointer hover:shadow-xl transition-all" onClick={() => { setRole('seller'); setLocation('/'); }}>
              <div className="flex-1 space-y-4">
                <h4 className="text-3xl font-black tracking-tighter text-secondary">Vendre en ligne</h4>
                <p className="text-sm text-gray-500 font-medium">Boostez votre business avec notre logistique express.</p>
                <Button variant="outline" className="rounded-full px-6 font-bold group-hover:bg-black group-hover:text-white transition-all">Commencer</Button>
              </div>
              <div className="w-40 h-32 flex items-center justify-center">
                <img src={sellerIllustration} alt="Vendeur" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Login CTA Section (Style Uber) */}
      <section className="px-6 md:px-20 py-24 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h3 className="text-5xl font-black tracking-tighter text-secondary leading-tight">
              Connectez-vous pour voir vos détails
            </h3>
            <p className="text-lg text-gray-500 font-medium">
              Consultez vos livraisons passées, vos gains et vos statistiques en un coup d'œil.
            </p>
            <div className="flex items-center gap-8">
              <Button 
                onClick={() => setLocation('/profile')} 
                className="bg-black text-white hover:bg-gray-800 px-10 h-14 rounded-xl font-black uppercase tracking-widest text-xs"
              >
                Se connecter
              </Button>
              <button 
                onClick={() => setLocation('/register')}
                className="text-sm font-black underline decoration-2 underline-offset-8 hover:text-primary transition-colors"
              >
                Créer un compte
              </button>
            </div>
          </div>
          <div className="bg-[#F6F6F6] rounded-[2.5rem] p-12 flex items-center justify-center min-h-[400px]">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Kin" 
              alt="Account" 
              className="w-full max-w-sm h-auto opacity-80" 
            />
          </div>
        </div>
      </section>

      {/* Footer minimaliste */}
      <footer className="bg-secondary text-white px-6 md:px-20 py-16 text-left border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
          <h2 className="text-3xl font-black tracking-tighter">KOLISA</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <p className="font-black uppercase tracking-widest text-[10px] text-white/40">Entreprise</p>
              <p onClick={() => setLocation('/about')} className="text-sm font-medium hover:text-primary cursor-pointer transition-colors">À propos</p>
              <p onClick={() => setLocation('/pricing')} className="text-sm font-medium hover:text-primary cursor-pointer transition-colors">Tarifs</p>
              <p onClick={() => setLocation('/company')} className="text-sm font-medium hover:text-primary cursor-pointer transition-colors">Info Légal</p>
            </div>
            <div className="space-y-4">
              <p className="font-black uppercase tracking-widest text-[10px] text-white/40">Produit</p>
              <p onClick={() => setLocation('/seller-details')} className="text-sm font-medium hover:text-primary cursor-pointer transition-colors">Vendre</p>
              <p onClick={() => setLocation('/courier-details')} className="text-sm font-medium hover:text-primary cursor-pointer transition-colors">Livrer</p>
              <p onClick={() => setLocation('/product')} className="text-sm font-medium hover:text-primary cursor-pointer transition-colors">Apps</p>
            </div>
          </div>
        </div>
        <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em]">© 2026 LOGISTIQUE • KINSHASA • RDC</p>
      </footer>
    </div>
  );
}
