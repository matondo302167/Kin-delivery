import { Switch, Route, Link, useLocation } from "wouter";
import { Package, LayoutDashboard, Wallet, Truck, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { balance } = useStore();

  const navItems = [
    { href: "/", icon: Package, label: "Vendeur" },
    { href: "/dashboard", icon: Truck, label: "Motard" },
    { href: "/tracking", icon: Map, label: "Suivi" },
    { href: "/wallet", icon: Wallet, label: "Cash" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF8] pb-24 font-sans selection:bg-primary/30">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20 rotate-3">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-black font-display text-secondary tracking-tight leading-none">
              KinDelivery
            </h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">V1.0 MVP</p>
          </div>
        </div>

        <Link href="/wallet">
          <a className="flex items-center gap-2 bg-secondary/5 px-3 py-1.5 rounded-full border border-secondary/10 active:scale-95 transition-transform">
             <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
             <span className="text-xs font-bold text-secondary font-mono">{balance.toLocaleString()} FC</span>
          </a>
        </Link>
      </header>

      <main className="container max-w-lg mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {children}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
        <div className="bg-secondary/95 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl flex justify-around items-center h-18 px-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1.5 transition-all duration-300 relative",
                  isActive 
                    ? "text-primary scale-110" 
                    : "text-white/60 hover:text-white"
                )}>
                  {isActive && (
                    <motion.div 
                      layoutId="nav-active"
                      className="absolute -top-1 w-8 h-1 bg-primary rounded-full"
                    />
                  )}
                  <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// Minimal framer motion mock since it might not be fully configured in all environments
const motion = {
  div: ({ children, ...props }: any) => <div {...props}>{children}</div>
};
