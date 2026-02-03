import { Link } from "wouter";
import { ShoppingBag, Truck, UserCheck, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import sellerImg from "@/assets/seller-hero.png";
import courierImg from "@/assets/courier-hero.png";
import customerImg from "@/assets/customer-hero.png";

export default function WelcomePage() {
  const roles = [
    {
      title: "Vendeur",
      desc: "Envoyez vos colis en un clic",
      icon: ShoppingBag,
      href: "/",
      color: "bg-primary",
      img: sellerImg
    },
    {
      title: "Livreur / Motard",
      desc: "Gagnez de l'argent en livrant",
      icon: Truck,
      href: "/dashboard",
      color: "bg-secondary",
      img: courierImg
    },
    {
      title: "Client Final",
      desc: "Suivez votre colis en temps réel",
      icon: UserCheck,
      href: "/tracking",
      color: "bg-blue-500",
      img: customerImg
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col p-6 pb-12">
      <div className="mt-8 mb-12 text-center">
        <h1 className="text-4xl font-black font-display text-secondary italic tracking-tighter">
          KINDELIVERY
        </h1>
        <p className="text-muted-foreground font-medium mt-2">La logistique simplifiée à Kinshasa</p>
      </div>

      <div className="grid gap-6 max-w-md mx-auto w-full">
        {roles.map((role, i) => (
          <Link key={role.title} href={role.href}>
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative group overflow-hidden rounded-3xl bg-white shadow-xl shadow-secondary/5 border border-border/50 flex flex-col cursor-pointer"
            >
              <div className="h-32 w-full overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500">
                <img src={role.img} alt={role.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`${role.color} p-3 rounded-2xl text-white shadow-lg`}>
                    <role.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-secondary tracking-tight">{role.title}</h3>
                    <p className="text-xs text-muted-foreground font-medium">{role.desc}</p>
                  </div>
                </div>
                <Smartphone className="h-5 w-5 text-muted-foreground opacity-20" />
              </div>
            </motion.a>
          </Link>
        ))}
      </div>
    </div>
  );
}
