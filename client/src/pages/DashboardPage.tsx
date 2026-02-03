import { useStore, Order } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Phone, Truck, CheckCircle2, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import courierHero from "@/assets/courier-hero.png";

export default function DashboardPage() {
  const { orders, markAsDelivered, markAsDelivering } = useStore();
  
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const deliveringOrders = orders.filter(o => o.status === 'delivering');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  return (
    <div className="space-y-6">
      <div className="relative h-32 rounded-3xl overflow-hidden shadow-xl mb-4">
        <img src={courierHero} alt="Courier" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent flex items-center p-8">
           <h2 className="text-primary-foreground text-2xl font-black italic tracking-tighter uppercase">MISSIONS MOTARD</h2>
        </div>
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
          {pendingOrders.map(order => (
            <MotardOrderCard key={order.id} order={order} actionLabel="Prendre" onAction={() => markAsDelivering(order.id)} />
          ))}
        </TabsContent>

        <TabsContent value="active" className="space-y-4 mt-6">
          {deliveringOrders.map(order => (
            <MotardOrderCard key={order.id} order={order} actionLabel="Terminer" onAction={() => markAsDelivered(order.id)} variant="active" />
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
        <div className="space-y-2">
           <p className="font-bold text-secondary text-sm leading-tight">{order.address}</p>
           <p className="text-xs font-bold text-muted-foreground uppercase">{order.recipientName} • {order.recipientPhone}</p>
        </div>
        {onAction && (
          <Button onClick={onAction} className="w-full h-11 mt-4 rounded-xl font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-lg shadow-primary/10">
            {actionLabel} <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
