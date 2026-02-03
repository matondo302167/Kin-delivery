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
      desc: "Gérez vos ventes de A à Z",
      icon: ShoppingBag,
      href: "/",
      color: "from-amber-400 to-orange-500",
      img: sellerImg,
      accent: "border-orange-200"
    },
    {
      id: "courier",
      title: "LIVREUR",
      desc: "Liberté et revenus garantis",
      icon: Truck,
      href: "/dashboard",
      color: "from-emerald-400 to-green-600",
      img: courierImg,
      accent: "border-green-200"
    },
    {
      id: "customer",
      title: "CLIENT",
      desc: "Suivez vos colis en direct",
      icon: UserCheck,
      href: "/tracking",
      color: "from-blue-400 to-indigo-600",
      img: customerImg,
      accent: "border-blue-200"
    }
  ] as const;

  const handleSelectRole = (role: typeof roles[number]) => {
    setRole(role.id);
    setLocation(role.href);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px] animate-pulse" />

      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-12 relative z-10"
      >
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-6">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Bienvenue à Kinshasa</span>
        </div>
        <h1 className="text-6xl font-black font-display text-white italic tracking-tighter leading-none">
          KIN<span className="text-primary">DELIVERY</span>
        </h1>
        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-4">La nouvelle ère du commerce urbain</p>
      </motion.div>

      <div className="grid gap-6 max-w-md w-full relative z-10">
        {roles.map((role, i) => (
          <motion.div
            key={role.id}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            whileHover={{ scale: 1.02, x: 10 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectRole(role)}
            className={`group relative overflow-hidden rounded-[2.5rem] bg-white/5 backdrop-blur-xl border-2 ${role.accent} border-opacity-10 cursor-pointer h-32 flex items-center`}
          >
            <div className="absolute inset-0 w-1/3 overflow-hidden">
              <img src={role.img} alt={role.title} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000 grayscale group-hover:grayscale-0 opacity-40 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0F172A]" />
            </div>
            
            <div className="pl-[35%] pr-8 flex items-center justify-between w-full">
              <div className="space-y-1">
                <h3 className="font-black text-2xl text-white italic tracking-tighter">{role.title}</h3>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{role.desc}</p>
              </div>
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${role.color} text-white shadow-2xl`}>
                <role.icon className="h-6 w-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.p 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 1 }}
        className="mt-12 text-white/20 text-[9px] font-black uppercase tracking-[0.5em]"
      >
        © 2026 KINDELIVERY LOGISTICS
      </motion.p>
    </div>
  );
}
