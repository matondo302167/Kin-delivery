import { useLocation, Redirect, Link } from "wouter";
import { useStore } from "@/lib/store";
import { Package, Wallet, Truck, Map, LogOut, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { userRole, setRole, profile } = useStore();

  if (!userRole) {
    return <Redirect to="/welcome" />;
  }

  const handleLogout = () => {
    setRole(null);
    setLocation("/welcome");
  };

  const sellerNav = [
    { href: "/", icon: Package, label: "Commander" },
    { href: "/wallet", icon: Wallet, label: "Portefeuille" },
  ];

  const courierNav = [
    { href: "/dashboard", icon: Truck, label: "Missions" },
    { href: "/wallet", icon: Wallet, label: "Gains" },
  ];

  const customerNav = [
    { href: "/tracking", icon: Map, label: "Suivi" },
  ];

  const navItems = userRole === 'seller' ? sellerNav : userRole === 'courier' ? courierNav : customerNav;

  return (
    <div className="min-h-screen bg-[#FDFCF8] pb-24 font-sans selection:bg-primary/30">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-black font-display text-secondary tracking-tight leading-none">
              KOLISA
            </h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{userRole}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/profile">
            <button className="flex items-center gap-2 group transition-transform active:scale-95">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-secondary leading-none">{profile.name}</p>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Profil</p>
              </div>
              <Avatar className="h-9 w-9 border-2 border-white shadow-md ring-2 ring-primary/20">
                <AvatarImage src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} />
                <AvatarFallback><User /></AvatarFallback>
              </Avatar>
            </button>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full hover:bg-red-50 text-red-500">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {children}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md">
        <div className="bg-secondary/95 backdrop-blur-lg border border-white/10 shadow-2xl rounded-[2rem] flex justify-around items-center h-16 px-4">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <button
                key={item.href}
                onClick={() => setLocation(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 relative",
                  isActive ? "text-primary scale-110" : "text-white/50"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
