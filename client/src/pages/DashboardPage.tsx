import { useStore, Order } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Phone, Truck, CheckCircle2, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function DashboardPage() {
  const { orders, markAsDelivered, markAsDelivering } = useStore();
  
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const deliveringOrders = orders.filter(o => o.status === 'delivering');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-display font-black text-secondary italic uppercase tracking-tighter">Missions Motard</h2>
        <p className="text-muted-foreground font-medium text-xs tracking-widest uppercase">Prêt pour la course ?</p>
      </div>

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-secondary/5 border border-secondary/10 p-1 rounded-2xl">
          <TabsTrigger value="available" className="text-[10px] font-black uppercase tracking-tighter data-[state=active]:bg-secondary data-[state=active]:text-white rounded-xl">
            Dispo ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="text-[10px] font-black uppercase tracking-tighter data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl">
            En route ({deliveringOrders.length})
          </TabsTrigger>
          <TabsTrigger value="done" className="text-[10px] font-black uppercase tracking-tighter data-[state=active]:bg-muted data-[state=active]:text-muted-foreground rounded-xl">
            Fait ({deliveredOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4 mt-6">
          {pendingOrders.length === 0 ? (
            <EmptyState icon={Truck} text="Pas de courses disponibles." />
          ) : (
            pendingOrders.map(order => (
              <MotardOrderCard 
                key={order.id} 
                order={order} 
                actionLabel="Prendre la course"
                onAction={() => markAsDelivering(order.id)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4 mt-6">
          {deliveringOrders.map(order => (
            <MotardOrderCard 
              key={order.id} 
              order={order} 
              actionLabel="Livraison Terminée"
              onAction={() => markAsDelivered(order.id)}
              variant="active"
            />
          ))}
        </TabsContent>

        <TabsContent value="done" className="space-y-4 mt-6">
          {deliveredOrders.map(order => (
            <MotardOrderCard key={order.id} order={order} variant="done" />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: any) {
  return (
    <div className="text-center py-16 bg-white/50 border-2 border-dashed border-muted rounded-3xl">
      <Icon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
      <p className="text-muted-foreground font-bold tracking-tight">{text}</p>
    </div>
  );
}

function MotardOrderCard({ order, onAction, actionLabel, variant = 'available' }: any) {
  return (
    <Card className="overflow-hidden border-none shadow-xl shadow-secondary/5 bg-white rounded-3xl">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <Badge className="bg-secondary/5 text-secondary font-mono border-none px-3">
            {order.id}
          </Badge>
          <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(order.timestamp, { addSuffix: true, locale: fr })}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
             <div className="bg-primary/10 p-3 rounded-2xl h-fit">
                <MapPin className="h-5 w-5 text-primary" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Lieu de livraison</p>
                <p className="font-bold text-secondary text-sm leading-tight mt-0.5">{order.address}</p>
             </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
             <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
                   <Phone className="h-4 w-4 text-secondary" />
                </div>
                <div>
                   <p className="font-black text-[10px] uppercase tracking-tighter text-muted-foreground">{order.recipientName}</p>
                   <p className="text-xs font-bold font-mono">{order.recipientPhone}</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black uppercase text-muted-foreground">Gain</p>
                <p className="font-black text-secondary">{order.price.toLocaleString()} FC</p>
             </div>
          </div>
        </div>

        {onAction && (
          <Button 
            onClick={onAction} 
            className={`w-full h-14 mt-5 rounded-2xl font-black uppercase tracking-widest flex justify-between px-6 transition-all active:scale-[0.98] ${variant === 'active' ? 'bg-secondary text-white' : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'}`}
          >
            {actionLabel}
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
        
        {variant === 'done' && (
           <div className="mt-5 flex items-center justify-center gap-2 text-secondary font-black uppercase text-xs tracking-widest bg-secondary/5 py-4 rounded-2xl">
              <CheckCircle2 className="h-5 w-5" />
              Course Terminée
           </div>
        )}
      </CardContent>
    </Card>
  );
}
