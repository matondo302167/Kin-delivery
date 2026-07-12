import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import KolisaLogo from "@/components/KolisaLogo";

export default function ProductPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white font-sans">
      <header className="bg-white border-b border-gray-100 px-6 md:px-20 py-4 flex items-center justify-between sticky top-0 z-50">
        <KolisaLogo size="sm" />
        <Button variant="ghost" onClick={() => setLocation('/welcome')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
      </header>

      <main className="container mx-auto px-6 md:px-20 py-12">
        <h1 className="text-4xl font-black text-secondary mb-8">Nos Produits</h1>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">App Client</h2>
            <p className="text-gray-600">L'application mobile pour suivre vos colis en temps réel et gérer vos réceptions.</p>
          </div>
          <div className="space-y-4">
             <h2 className="text-2xl font-bold">Dashboard Vendeur</h2>
             <p className="text-gray-600">Une interface web puissante pour gérer vos expéditions, imprimer vos étiquettes et suivre vos encaissements.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
