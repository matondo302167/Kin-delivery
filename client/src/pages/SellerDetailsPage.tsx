import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Package, ShieldCheck, Zap } from "lucide-react";
import sellerIllustration from "@/assets/seller-illustration.png";

export default function SellerDetailsPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white font-sans">
      <header className="bg-white border-b border-gray-100 px-6 md:px-20 py-4 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-black tracking-tighter text-secondary">KOLISA <span className="text-primary font-normal">Business</span></h1>
        <Button variant="ghost" onClick={() => setLocation('/welcome')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
      </header>

      <main className="container mx-auto px-6 md:px-20 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-secondary mb-6">
              Simplifiez vos livraisons. <br/>
              <span className="text-primary">Développez votre business.</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              KinDelivery Business est conçu pour les commerçants de Kinshasa. 
              Fini les tracas logistiques, concentrez-vous sur vos ventes, nous gérons le reste.
            </p>
            <Button onClick={() => setLocation('/register')} className="bg-secondary text-white px-8 h-12 rounded-full font-bold">
              Commencer maintenant
            </Button>
          </div>
          <div className="rounded-[3rem] overflow-hidden shadow-2xl">
            <img src={sellerIllustration} alt="Seller" className="w-full h-auto" />
          </div>
        </div>

        <section className="mb-20">
          <h3 className="text-2xl font-black text-secondary mb-8">Pourquoi choisir KinDelivery ?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Livraison Express", desc: "Vos clients livrés en moins de 2h partout à Kinshasa.", icon: Zap },
              { title: "Paiement Sécurisé", desc: "Encaissement à la livraison (COD) ou Mobile Money sécurisé.", icon: ShieldCheck },
              { title: "Suivi en Temps Réel", desc: "Vous et vos clients suivez le colis à la trace.", icon: Package }
            ].map((feature, i) => (
              <div key={i} className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h4 className="font-bold text-xl mb-2">{feature.title}</h4>
                <p className="text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-secondary text-white p-12 rounded-[3rem]">
          <h3 className="text-2xl font-black mb-6">Nos Critères & Engagements</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4 text-primary">Pour les vendeurs</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /> Produits emballés et étiquetés correctement.</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /> Disponibilité immédiate lors du ramassage.</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /> Informations client précises.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-primary">Notre Garantie</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-white" /> Assurance colis incluse jusqu'à 50$.</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-white" /> Retour gratuit en cas d'échec de livraison.</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-white" /> Support client 7j/7.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
