import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { ShoppingBag, Truck, UserCheck, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import sellerImg from "@/assets/seller-hero.png";
import courierImg from "@/assets/courier-hero.png";
import customerImg from "@/assets/customer-hero.png";

export default function WelcomePage() {
  const { setRole } = useStore();
  const [, setLocation] = useLocation();

  const roles = [
    {
      id: "seller",
      title: "VENDEUR",
      desc: "Vendez vos produits à Kin",
      icon: ShoppingBag,
      href: "/",
      color: "bg-primary",
      img: sellerImg,
      accent: "border-primary"
    },
    {
      id: "courier",
      title: "LIVREUR",
      desc: "Gagnez de l'argent par course",
      icon: Truck,
      href: "/dashboard",
      color: "bg-secondary",
      img: courierImg,
      accent: "border-secondary"
    },
    {
      id: "customer",
      title: "CLIENT",
      desc: "Où est votre colis ?",
      icon: UserCheck,
      href: "/tracking",
      color: "bg-white",
      img: customerImg,
      accent: "border-white"
    }
  ] as const;

  const handleSelectRole = (role: typeof roles[number]) => {
    setRole(role.id);
    setLocation(role.href);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-between p-8 relative overflow-hidden">
      {/* Uber-like Minimal Background */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-secondary opacity-[0.03] skew-y-6 -translate-y-20" />
      
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-left w-full mt-12 relative z-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-1 w-secondary bg-secondary rounded-full" />
          <span className="text-[10px] font-black text-secondary uppercase tracking-[0.4em]">KinDelivery v1.0</span>
        </div>
        <h1 className="text-6xl font-black font-display text-secondary tracking-tighter leading-none mb-4">
          Livraison <br />
          <span className="text-primary italic">en un clic.</span>
        </h1>
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] max-w-[200px]">La logistique simplifiée pour le commerce à Kinshasa.</p>
      </motion.div>

      <div className="grid gap-4 w-full max-w-md relative z-10 mb-12">
        {roles.map((role, i) => (
          <motion.div
            key={role.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectRole(role)}
            className={cn(
              "group relative overflow-hidden rounded-[2rem] h-28 flex items-center shadow-lg transition-all",
              role.id === 'customer' ? "bg-secondary text-white" : "bg-white border-2 border-muted/50"
            )}
          >
            <div className="absolute inset-y-0 left-0 w-24 overflow-hidden">
              <img src={role.img} alt={role.title} className="w-full h-full object-cover opacity-80" />
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r",
                role.id === 'customer' ? "from-transparent to-secondary" : "from-transparent to-white"
              )} />
            </div>
            
            <div className="pl-28 pr-8 flex items-center justify-between w-full">
              <div className="space-y-0.5 text-left">
                <h3 className="font-black text-xl italic tracking-tighter">{role.title}</h3>
                <p className={cn(
                  "text-[9px] font-bold uppercase tracking-widest",
                  role.id === 'customer' ? "text-white/60" : "text-muted-foreground"
                )}>{role.desc}</p>
              </div>
              <div className={cn(
                "p-3 rounded-2xl shadow-xl",
                role.id === 'customer' ? "bg-white text-secondary" : "bg-secondary text-white"
              )}>
                <role.icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="w-full text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">KINDELIVERY LOGISTICS • RDC</p>
      </div>
    </div>
  );
}
