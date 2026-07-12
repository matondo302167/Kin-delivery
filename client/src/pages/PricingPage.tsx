import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import KolisaLogo from "@/components/KolisaLogo";

export default function PricingPage() {
  const [, setLocation] = useLocation();
  const BASE = import.meta.env.BASE_URL || "/";

  return (
    <div className="min-h-screen bg-white font-sans">
      <header className="bg-white border-b border-gray-100 px-6 md:px-20 py-4 flex items-center justify-between sticky top-0 z-50">
        <KolisaLogo size="sm" />
        <Button variant="ghost" onClick={() => setLocation(`${BASE}welcome`)} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
      </header>

      <main className="container mx-auto px-6 md:px-20 py-12">
        <h1 className="text-4xl font-black text-secondary mb-12 text-center">Tarifs Simples & Transparents</h1>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="border p-8 rounded-3xl">
            <h3 className="text-xl font-bold mb-2">Standard</h3>
            <p className="text-4xl font-black mb-6">2500 FC <span className="text-sm font-normal text-gray-500">/course</span></p>
            <p className="text-gray-500 mb-6 text-sm">Pour les livraisons standards dans la même commune.</p>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-green-500" /> Livraison J+1</li>
              <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-green-500" /> Suivi basique</li>
            </ul>
            <Button className="w-full rounded-xl" variant="outline">Choisir</Button>
          </div>

          <div className="border-2 border-primary bg-primary/5 p-8 rounded-3xl relative">
            <div className="absolute top-0 right-0 bg-primary text-secondary text-xs font-black px-3 py-1 rounded-bl-xl rounded-tr-2xl">POPULAIRE</div>
            <h3 className="text-xl font-bold mb-2">Express</h3>
            <p className="text-4xl font-black mb-6">5000 FC <span className="text-sm font-normal text-gray-500">/course</span></p>
            <p className="text-gray-500 mb-6 text-sm">Livraison rapide partout à Kinshasa.</p>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-primary" /> Livraison &lt; 3h</li>
              <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-primary" /> Suivi Temps Réel</li>
              <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-primary" /> Assurance incluse</li>
            </ul>
            <Button className="w-full bg-secondary text-white hover:bg-black rounded-xl">Choisir</Button>
          </div>

          <div className="border p-8 rounded-3xl">
            <h3 className="text-xl font-bold mb-2">Business</h3>
            <p className="text-4xl font-black mb-6">Sur Mesure</p>
            <p className="text-gray-500 mb-6 text-sm">Pour les gros volumes et entreprises.</p>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-green-500" /> Tarifs dégressifs</li>
              <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-green-500" /> Gestionnaire dédié</li>
              <li className="flex gap-2 text-sm"><Check className="h-4 w-4 text-green-500" /> API Integration</li>
            </ul>
            <Button className="w-full rounded-xl" variant="outline">Contacter</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
