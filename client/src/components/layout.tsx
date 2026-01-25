import { Link, useLocation } from "wouter";
import { Package, LayoutDashboard, Wallet, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Package, label: "Commander" },
    { href: "/dashboard", icon: LayoutDashboard, label: "Suivi" },
    { href: "/wallet", icon: Wallet, label: "Portefeuille" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      <header className="sticky top-0 z-50 bg-primary px-4 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-secondary p-1.5 rounded-full">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold font-display text-primary-foreground tracking-tight">
            KinDelivery
          </h1>
        </div>
        <div className="h-8 w-8 rounded-full bg-secondary/20 border-2 border-secondary overflow-hidden">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
            alt="Profile" 
            className="h-full w-full object-cover"
          />
        </div>
      </header>

      <main className="container max-w-md mx-auto p-4 animate-in fade-in duration-500">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border pb-safe">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                  isActive 
                    ? "text-secondary font-semibold" 
                    : "text-muted-foreground hover:text-foreground"
                )}>
                  <item.icon className={cn("h-6 w-6", isActive && "fill-current/10")} />
                  <span className="text-[10px] uppercase tracking-wide">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
