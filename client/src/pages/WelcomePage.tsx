import { Link, useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { ShoppingBag, Truck, UserCheck, Smartphone, ArrowRight } from "lucide-react";
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
      title: "Vendeur",
      desc: "Gérez vos ventes et expéditions",
      icon: ShoppingBag,
      href: "/",
      color: "bg-primary",
      img: sellerImg
    },
    {
      id: "courier",
      title: "Livreur / Motard",
      desc: "Recevez des missions de livraison",
      icon: Truck,
      href: "/dashboard",
      color: "bg-secondary",
      img: courierImg
    },
    {
      id: "customer",
      title: "Client Final",
      desc: "Suivez l'arrivée de votre colis",
      icon: UserCheck,
      href: "/tracking",
      color: "bg-blue-600",
      img: customerImg
    }
  ] as const;

  const handleSelectRole = (role: typeof roles[number]) => {
    setRole(role.id);
    setLocation(role.href);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col p-6 pb-12">
      <div className="mt-12 mb-10 text-center space-y-2">
        <h1 className="text-5xl font-black font-display text-secondary italic tracking-tighter">
          KINDELIVERY
        </h1>
        <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px]">Logistique Urbaine • Kinshasa</p>
      </div>

      <div className="grid gap-6 max-w-md mx-auto w-full">
        {roles.map((role) => (
          <motion.div
            key={role.id}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectRole(role)}
            className="relative group overflow-hidden rounded-[2.5rem] bg-white shadow-2xl shadow-secondary/10 border border-secondary/5 flex flex-col cursor-pointer"
          >
            <div className="h-44 w-full overflow-hidden">
              <img src={role.img} alt={role.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
            
            <div className="p-6 flex items-center justify-between absolute bottom-0 left-0 right-0 text-white">
              <div className="flex items-center gap-4">
                <div className={`${role.color} p-3 rounded-2xl shadow-xl`}>
                  <role.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight leading-none">{role.title}</h3>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">{role.desc}</p>
                </div>
              </div>
              <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
