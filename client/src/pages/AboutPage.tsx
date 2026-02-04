import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white font-sans">
      <header className="bg-white border-b border-gray-100 px-6 md:px-20 py-4 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-black tracking-tighter text-secondary">KOLISA</h1>
        <Button variant="ghost" onClick={() => setLocation('/welcome')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
      </header>

      <main className="container mx-auto px-6 md:px-20 py-12 max-w-4xl">
        <h1 className="text-4xl font-black text-secondary mb-8">À propos de nous</h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          KinDelivery est la première plateforme logistique digitale 100% kinoise. 
          Née du constat que la logistique du dernier kilomètre à Kinshasa est un défi majeur, 
          nous avons créé une solution technologique adaptée à nos réalités locales.
        </p>

        <div className="grid md:grid-cols-2 gap-8 my-12">
          <div className="bg-gray-50 p-8 rounded-3xl">
            <h3 className="text-2xl font-bold mb-4">Notre Mission</h3>
            <p className="text-gray-600">Connecter chaque vendeur à ses clients en un temps record, de manière sécurisée et fiable.</p>
          </div>
          <div className="bg-gray-50 p-8 rounded-3xl">
            <h3 className="text-2xl font-bold mb-4">Notre Vision</h3>
            <p className="text-gray-600">Devenir l'infrastructure logistique de référence pour le commerce électronique en RDC.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
