import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Search, MapPin, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import courierIllustration from "@/assets/courier-illustration.png";
import sellerIllustration from "@/assets/seller-illustration.png";
import africanDeliveryIllustration from "@/assets/african-delivery-illustration.png";
import sendParcelDrawing from "@/assets/send-parcel-drawing.png";
import kolisaLogo from "@/assets/kolisa-logo.png";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const courierIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const KINSHASA_CENTER: [number, number] = [-4.3250, 15.3222];

const kinshasaPoints: { pos: [number, number]; type: 'courier' | 'pickup' }[] = [
  { pos: [-4.3117, 15.3125], type: 'courier' },
  { pos: [-4.3380, 15.2960], type: 'pickup' },
  { pos: [-4.3050, 15.3400], type: 'courier' },
  { pos: [-4.3500, 15.3100], type: 'pickup' },
  { pos: [-4.2900, 15.2800], type: 'courier' },
  { pos: [-4.3200, 15.3500], type: 'pickup' },
  { pos: [-4.3600, 15.2700], type: 'courier' },
  { pos: [-4.2950, 15.3300], type: 'pickup' },
];

function AnimatedMarkers() {
  const map = useMap();
  const [markers, setMarkers] = useState(kinshasaPoints);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarkers(prev => prev.map(m => ({
        ...m,
        pos: [
          m.pos[0] + (Math.random() - 0.5) * 0.003,
          m.pos[1] + (Math.random() - 0.5) * 0.003,
        ] as [number, number],
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {markers.map((m, i) => (
        <Marker 
          key={i} 
          position={m.pos} 
          icon={m.type === 'courier' ? courierIcon : pickupIcon} 
        />
      ))}
    </>
  );
}

export default function WelcomePage() {
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
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 md:px-20 py-4 flex items-center justify-between sticky top-0 z-[1000]">
        <div className="flex items-center gap-2">
          <img src={kolisaLogo} alt="KOLISA Logo" className="h-10 w-10 object-contain" />
          <h1 className="text-2xl font-black tracking-tighter text-secondary">KOLISA</h1>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setLocation('/login')} className="text-sm font-bold text-secondary" data-testid="link-header-login">Connexion</button>
          <button onClick={() => setLocation('/register')} className="bg-primary text-secondary px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest hover:bg-primary/90 transition-colors" data-testid="link-header-register">S'inscrire</button>
        </div>
      </header>

      <section className="relative min-h-[85vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <MapContainer 
            center={KINSHASA_CENTER} 
            zoom={13} 
            className="h-full w-full"
            zoomControl={false}
            attributionControl={false}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            touchZoom={false}
          >
            <TileLayer 
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <AnimatedMarkers />
          </MapContainer>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/30 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/50 z-10" />
        </div>

        <div className="relative z-20 px-6 md:px-20 py-16 w-full max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-10"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                <MapPin className="h-3 w-3" /> {locationName}
              </div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] text-secondary">
                Livraison <br /> 
                <span className="text-primary italic font-black">express</span> à<br />
                Kinshasa
              </h2>
              <p className="text-lg text-gray-500 font-medium max-w-md">
                Envoyez et recevez vos colis partout dans la ville. Suivi en temps réel.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              <Button 
                onClick={() => setLocation('/login')}
                className="bg-secondary text-white hover:bg-black h-14 px-8 rounded-xl font-black uppercase tracking-widest text-xs flex-1"
                data-testid="button-hero-login"
              >
                Se connecter <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                onClick={() => setLocation('/register')}
                variant="outline"
                className="h-14 px-8 rounded-xl font-black uppercase tracking-widest text-xs border-2"
                data-testid="button-hero-register"
              >
                S'inscrire
              </Button>
            </div>

            <div className="relative group max-w-md pt-4">
              <div className="relative flex items-center bg-white p-2 rounded-full shadow-2xl border border-gray-200">
                <div className="pl-4 pr-2">
                  <Search className="h-5 w-5 text-secondary/30" />
                </div>
                <Input 
                  placeholder="Suivre un colis (ex: KOL-XXXX)" 
                  className="border-none bg-transparent focus-visible:ring-0 text-base font-bold placeholder:text-gray-300 p-0 h-12"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                  data-testid="input-tracking"
                />
                <Button 
                  onClick={handleTrack}
                  className="bg-primary text-secondary hover:bg-primary/90 px-6 h-10 rounded-full font-black uppercase tracking-widest text-[10px]"
                  data-testid="button-track"
                >
                  Suivre
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-6 md:px-20 py-24 border-t border-gray-50 bg-gray-50/30">
        <h3 className="text-3xl font-black mb-16 tracking-tighter text-secondary">Suggestions</h3>
        
        <div className="space-y-24">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 group">
            <div className="flex-1 space-y-6 max-w-xl">
              <h3 className="text-5xl font-black tracking-tighter text-secondary leading-tight">Envoyez un colis à vos proches</h3>
              <p className="text-lg text-gray-500 font-medium leading-relaxed">
                Planifiez une livraison instantanée partout à Kinshasa. 
                Simple, rapide et sécurisé avec suivi en temps réel.
              </p>
              <div className="flex items-center gap-6 pt-4">
                <Button 
                  onClick={() => setLocation('/login')}
                  className="bg-black text-white hover:bg-gray-800 px-10 h-14 rounded-xl font-black uppercase tracking-widest text-xs"
                  data-testid="button-send-parcel"
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
            <div className="bg-[#F6F6F6] p-12 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 group cursor-pointer hover:shadow-xl transition-all" onClick={() => setLocation('/courier-details')}>
              <div className="flex-1 space-y-4">
                <h4 className="text-3xl font-black tracking-tighter text-secondary">Devenir Livreur</h4>
                <p className="text-sm text-gray-500 font-medium">Gagnez de l'argent en livrant selon votre propre horaire.</p>
                <div className="flex gap-4">
                  <Button onClick={(e) => { e.stopPropagation(); setLocation('/login'); }} variant="outline" className="rounded-full px-6 font-bold group-hover:bg-black group-hover:text-white transition-all">Se connecter</Button>
                  <Button onClick={(e) => { e.stopPropagation(); setLocation('/courier-details'); }} variant="ghost" className="rounded-full px-4 font-bold text-gray-500 hover:text-black">Détails</Button>
                </div>
              </div>
              <div className="w-40 h-32 flex items-center justify-center">
                <img src={courierIllustration} alt="Livreur" className="w-full h-full object-contain" />
              </div>
            </div>

            <div className="bg-[#F6F6F6] p-12 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 group cursor-pointer hover:shadow-xl transition-all" onClick={() => setLocation('/seller-details')}>
              <div className="flex-1 space-y-4">
                <h4 className="text-3xl font-black tracking-tighter text-secondary">Vendre en ligne</h4>
                <p className="text-sm text-gray-500 font-medium">Boostez votre business avec notre logistique express.</p>
                <Button onClick={(e) => { e.stopPropagation(); setLocation('/login'); }} variant="outline" className="rounded-full px-6 font-bold group-hover:bg-black group-hover:text-white transition-all">Se connecter</Button>
              </div>
              <div className="w-40 h-32 flex items-center justify-center">
                <img src={sellerIllustration} alt="Vendeur" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      </section>

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
                onClick={() => setLocation('/login')} 
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
              src={africanDeliveryIllustration} 
              alt="Account" 
              className="w-full max-w-sm h-auto mix-blend-multiply" 
            />
          </div>
        </div>
      </section>

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
