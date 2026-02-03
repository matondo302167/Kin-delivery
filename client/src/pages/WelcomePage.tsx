import { useState } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { Search, MapPin, ArrowRight, UserPlus, LogIn, Send, Globe, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import heroMap from "@/assets/hero-map-illustration.png";
import rideImg from "@/assets/ride-option.jpg";

export default function WelcomePage() {
  const { setRole } = useStore();
  const [, setLocation] = useLocation();
  const [trackingCode, setTrackingCode] = useState("");

  const handleTrack = () => {
    if (trackingCode) {
      setLocation(`/tracking?token=${trackingCode}`);
    }
  };

  const navLinks = [
    { label: "Course", active: true },
    { label: "Chauffeur" },
    { label: "Livraison" },
    { label: "À propos", hasSub: true }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-black overflow-x-hidden">
      {/* Header / Navbar style Uber */}
      <header className="bg-black text-white px-6 md:px-20 py-4 flex items-center justify-between sticky top-0 z-[1000]">
        <div className="flex items-center gap-12">
          <h1 className="text-2xl font-black tracking-tighter">KINDELIVERY</h1>
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <button key={link.label} className={cn(
                "text-sm font-medium hover:text-gray-300 transition-colors flex items-center gap-1",
                link.active && "text-white"
              )}>
                {link.label}
                {link.hasSub && <span className="text-[10px]">▼</span>}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <button className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Globe className="h-4 w-4" /> FR
          </button>
          <button className="hidden md:flex items-center gap-1 text-sm font-medium">Aide</button>
          <button onClick={() => setLocation('/profile')} className="text-sm font-medium">Connexion</button>
          <button onClick={() => setLocation('/register')} className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors">Inscription</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 md:px-20 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
        <div className="space-y-8 max-w-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold">
              <MapPin className="h-4 w-4" /> Kinshasa, RDC <button className="underline ml-1">Changer</button>
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
              Suivez votre colis <br /> 
              <span className="text-primary italic">en temps réel.</span>
            </h2>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
             <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-black" />
                <Input 
                  placeholder="Entrez votre numéro de suivi..." 
                  className="border-none bg-transparent focus-visible:ring-0 text-lg font-bold placeholder:text-gray-400 p-0 h-auto"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                />
             </div>
             <div className="flex items-center gap-4">
                <Button 
                  onClick={handleTrack}
                  className="bg-black text-white hover:bg-gray-800 px-8 h-12 rounded-xl font-bold text-base"
                >
                  Suivre mon colis
                </Button>
                <button className="text-sm font-medium underline">Consulter l'historique</button>
             </div>
          </div>
        </div>

        <div className="relative">
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
          >
            <img src={heroMap} alt="Abstract Map" className="w-full h-auto object-cover" />
          </motion.div>
          {/* Decorative floating element */}
          <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 hidden md:block">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Send className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-black">Livraison Express</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Kinshasa 24/7</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Options Section (Second Image Reference) */}
      <section className="px-6 md:px-20 py-20 bg-gray-50/50">
        <h3 className="text-3xl font-black mb-12 tracking-tighter">Suggestions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Option 1: Devenir Livreur */}
          <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => { setRole('courier'); setLocation('/dashboard'); }}
            className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100 flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <h4 className="text-2xl font-black mb-2 tracking-tight">Devenir Livreur</h4>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">Gagnez de l'argent en livrant à travers la ville de Kinshasa selon votre propre horaire.</p>
              <Button variant="outline" className="rounded-full px-6 font-bold group-hover:bg-black group-hover:text-white transition-all">Détails</Button>
            </div>
            <div className="mt-8 flex justify-end">
              <div className="w-32 h-20 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                 <img src={rideImg} alt="Ride" className="w-24 h-auto object-contain" />
              </div>
            </div>
          </motion.div>

          {/* Option 2: Envoie un colis */}
          <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => { setRole('seller'); setLocation('/'); }}
            className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100 flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <h4 className="text-2xl font-black mb-2 tracking-tight">Envoyer un colis</h4>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">Planifiez une course pour vos produits et clients en quelques secondes.</p>
              <Button variant="outline" className="rounded-full px-6 font-bold group-hover:bg-black group-hover:text-white transition-all">Détails</Button>
            </div>
            <div className="mt-8 flex justify-end">
              <div className="w-32 h-20 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:bg-secondary/10 transition-colors">
                <Send className="h-10 w-10 text-secondary" />
              </div>
            </div>
          </motion.div>

          {/* Option 3: Compte */}
          <div className="lg:col-span-1 bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100 flex flex-col items-start justify-center text-left gap-4">
             <h4 className="text-3xl font-black tracking-tight leading-none">Connectez-vous pour voir vos détails</h4>
             <p className="text-sm text-gray-500 font-medium">Consultez vos livraisons passées, suggestions personnalisées et plus encore.</p>
             <div className="flex gap-4 mt-4 w-full">
                <Button onClick={() => setLocation('/profile')} className="bg-black text-white rounded-xl h-12 px-6 flex-1 font-bold">Connexion</Button>
                <button onClick={() => setLocation('/register')} className="text-sm font-bold underline px-4">Créer un compte</button>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white px-6 md:px-20 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-8 mb-8">
           <h2 className="text-2xl font-black tracking-tighter mb-4 md:mb-0">KINDELIVERY</h2>
           <div className="flex gap-8">
              <button className="text-sm font-medium flex items-center gap-2"><HelpCircle className="h-4 w-4" /> Centre d'aide</button>
           </div>
        </div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">© 2026 KINDELIVERY LOGISTICS • RDC</p>
      </footer>
    </div>
  );
}
