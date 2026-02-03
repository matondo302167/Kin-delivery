import { useState } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { Search, MapPin, ArrowRight, UserPlus, LogIn, Send, Globe, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import heroCourier from "@/assets/hero-courier-illustration.png";
import courierIllustration from "@/assets/courier-illustration.png";
import sellerIllustration from "@/assets/seller-illustration.png";

export default function WelcomePage() {
  const { setRole } = useStore();
  const [, setLocation] = useLocation();
  const [trackingCode, setTrackingCode] = useState("");

  const handleTrack = () => {
    if (trackingCode.trim()) {
      setLocation(`/tracking?token=${trackingCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-black overflow-x-hidden">
      {/* Header / Navbar harmonisé avec les autres pages */}
      <header className="bg-white border-b border-gray-100 px-6 md:px-20 py-4 flex items-center justify-between sticky top-0 z-[1000]">
        <div className="flex items-center gap-12">
          <h1 className="text-2xl font-black tracking-tighter text-secondary">KINDELIVERY</h1>
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
              <MapPin className="h-3 w-3" /> Kinshasa, RDC
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

      {/* Options Section - Style selon les images chargées (pas de cards) */}
      <section className="px-6 md:px-20 py-24 border-t border-gray-50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Option 1: Devenir Livreur */}
          <div className="flex flex-col md:flex-row items-center gap-10 group cursor-pointer" onClick={() => { setRole('courier'); setLocation('/dashboard'); }}>
            <div className="w-full md:w-1/2 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white transition-transform duration-500 group-hover:scale-105">
              <img src={courierIllustration} alt="Livreur" className="w-full h-64 object-cover" />
            </div>
            <div className="flex-1 space-y-4 text-center md:text-left">
              <h3 className="text-4xl font-black tracking-tighter text-secondary">Devenir Livreur</h3>
              <p className="text-gray-500 font-medium leading-relaxed">Rejoignez la plus grande flotte de Kinshasa. Gagnez de l'argent selon vos disponibilités.</p>
              <button className="text-secondary font-black uppercase tracking-[0.2em] text-xs flex items-center gap-2 group-hover:gap-4 transition-all mx-auto md:mx-0">
                Savoir plus <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Option 2: Vendre en ligne */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-10 group cursor-pointer" onClick={() => { setRole('seller'); setLocation('/'); }}>
            <div className="w-full md:w-1/2 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white transition-transform duration-500 group-hover:scale-105">
              <img src={sellerIllustration} alt="Vendeur" className="w-full h-64 object-cover" />
            </div>
            <div className="flex-1 space-y-4 text-center md:text-right">
              <h3 className="text-4xl font-black tracking-tighter text-secondary">Vendre en ligne</h3>
              <p className="text-gray-500 font-medium leading-relaxed">Boostez votre commerce. Nous nous occupons de livrer vos clients partout à Kinshasa.</p>
              <button className="text-secondary font-black uppercase tracking-[0.2em] text-xs flex items-center gap-2 group-hover:gap-4 transition-all mx-auto md:ml-auto md:mr-0 flex-row-reverse">
                Commencer <ArrowRight className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer minimaliste */}
      <footer className="bg-secondary text-white px-6 md:px-20 py-12 text-center">
        <h2 className="text-xl font-black tracking-tighter mb-4">KINDELIVERY</h2>
        <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.4em]">© 2026 LOGISTIQUE • KINSHASA • RDC</p>
      </footer>
    </div>
  );
}
