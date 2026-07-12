import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import KolisaLogo from "@/components/KolisaLogo";

export default function CompanyPage() {
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
        <h1 className="text-4xl font-black text-secondary mb-8">Entreprise</h1>
        <p className="text-lg text-gray-600 mb-8">
          KOLISA est une entreprise enregistrée en RDC, dédiée à l'amélioration de la logistique urbaine.
        </p>
        
        <div className="bg-gray-50 p-8 rounded-3xl mb-8">
           <h3 className="font-bold text-xl mb-4">Contact</h3>
           <p>Siège Social: 123 Boulevard du 30 Juin, Gombe, Kinshasa</p>
           <p>Email: contact@kolisa.cd</p>
           <p>Tél: +243 81 000 0000</p>
        </div>
      </main>
    </div>
  );
}
