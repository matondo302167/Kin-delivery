import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Wallet, Map, BadgeCheck } from "lucide-react";
import courierIllustration from "@/assets/courier-illustration.png";

export default function CourierDetailsPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white font-sans">
      <header className="bg-white border-b border-gray-100 px-6 md:px-20 py-4 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-xl font-black tracking-tighter text-secondary">KOLISA <span className="text-primary font-normal">Driver</span></h1>
        <Button variant="ghost" onClick={() => setLocation('/welcome')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
      </header>

      <main className="container mx-auto px-6 md:px-20 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
           <div className="rounded-[3rem] overflow-hidden shadow-2xl order-2 md:order-1">
            <img src={courierIllustration} alt="Courier" className="w-full h-auto" />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-secondary mb-6">
              Roulez. Livrez. <br/>
              <span className="text-primary">Encaissez.</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Devenez votre propre patron. Avec KOLISA, vous choisissez vos horaires et vous êtes payé chaque semaine pour vos livraisons.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => setLocation('/login')} className="bg-secondary text-white px-8 h-12 rounded-full font-bold">
                Se connecter
              </Button>
              <Button onClick={() => setLocation('/register')} variant="outline" className="px-8 h-12 rounded-full font-bold">
                Créer un compte
              </Button>
            </div>
          </div>
        </div>

        <section className="mb-20">
          <h3 className="text-2xl font-black text-secondary mb-8">Avantages Livreur</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Liberté Totale", desc: "Pas de patron. Connectez-vous quand vous voulez travailler.", icon: Clock },
              { title: "Gains Attractifs", desc: "Gagnez jusqu'à 30$ par jour + pourboires.", icon: Wallet },
              { title: "Optimisation Trajets", desc: "Notre app vous donne les meilleurs itinéraires.", icon: Map }
            ].map((feature, i) => (
              <div key={i} className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h4 className="font-bold text-xl mb-2">{feature.title}</h4>
                <p className="text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-900 text-white p-12 rounded-[3rem]">
          <h3 className="text-2xl font-black mb-8">Conditions requises</h3>
          <div className="grid md:grid-cols-2 gap-6">
             <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl">
               <BadgeCheck className="h-8 w-8 text-primary" />
               <p className="font-bold">Avoir plus de 18 ans</p>
             </div>
             <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl">
               <BadgeCheck className="h-8 w-8 text-primary" />
               <p className="font-bold">Moto ou Vélo en bon état</p>
             </div>
             <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl">
               <BadgeCheck className="h-8 w-8 text-primary" />
               <p className="font-bold">Smartphone Android/iOS</p>
             </div>
             <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl">
               <BadgeCheck className="h-8 w-8 text-primary" />
               <p className="font-bold">Carte d'identité valide</p>
             </div>
          </div>
        </section>
      </main>
    </div>
  );
}
