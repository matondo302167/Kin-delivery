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
      window.location.href = `/tracking?token=${trackingCode.trim().toUpperCase()}`;
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
            className="rounded-3xl overflow-hidden"
          >
            <img src={heroCourier} alt="Livreur Hero" className="w-full h-auto object-contain" />
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

      {/* Options Section */}
      <section className="px-6 md:px-20 py-20 bg-gray-50/50">
        <h3 className="text-3xl font-black mb-12 tracking-tighter">Suggestions</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Option 1: Devenir Livreur */}
          <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => { setRole('courier'); setRole('courier'); setLocation('/dashboard'); }}
            className="bg-white p-0 rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden group cursor-pointer flex flex-col md:flex-row h-auto md:h-64"
          >
            <div className="p-8 flex-1 flex flex-col justify-center">
              <h4 className="text-3xl font-black mb-2 tracking-tight">Devenir Livreur</h4>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">Gagnez de l'argent en livrant à travers Kinshasa avec votre propre moto.</p>
              <Button variant="outline" className="rounded-full px-6 font-bold group-hover:bg-black group-hover:text-white transition-all w-fit">Détails</Button>
            </div>
            <div className="w-full md:w-1/2 h-48 md:h-full overflow-hidden">
              <img src={courierIllustration} alt="Livreur Kinshasa" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          </motion.div>

          {/* Option 2: Envoyer un colis */}
          <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => { setRole('seller'); setLocation('/'); }}
            className="bg-white p-0 rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden group cursor-pointer flex flex-col md:flex-row h-auto md:h-64"
          >
            <div className="p-8 flex-1 flex flex-col justify-center">
              <h4 className="text-3xl font-black mb-2 tracking-tight">Vendre en ligne</h4>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">Propulsez votre business kinois avec notre logistique express de pointe.</p>
              <Button variant="outline" className="rounded-full px-6 font-bold group-hover:bg-black group-hover:text-white transition-all w-fit">Détails</Button>
            </div>
            <div className="w-full md:w-1/2 h-48 md:h-full overflow-hidden">
              <img src={sellerIllustration} alt="Vendeur Kinshasa" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          </motion.div>
        </div>

        {/* Option 3: Compte */}
        <div className="mt-8 bg-black text-white p-12 rounded-[2rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="max-w-xl">
              <h4 className="text-4xl font-black tracking-tight leading-tight mb-4">Prêt à commencer l'expérience Kolisa ?</h4>
              <p className="text-gray-400 font-medium">Connectez-vous pour voir vos livraisons ou créez un compte vendeur/livreur dès aujourd'hui.</p>
           </div>
           <div className="flex gap-4 w-full md:w-auto">
              <Button onClick={() => setLocation('/profile')} className="bg-white text-black hover:bg-gray-200 rounded-xl h-14 px-8 font-black uppercase tracking-widest text-xs">Connexion</Button>
              <Button onClick={() => setLocation('/register')} variant="outline" className="border-white text-white hover:bg-white/10 rounded-xl h-14 px-8 font-black uppercase tracking-widest text-xs">Inscription</Button>
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
