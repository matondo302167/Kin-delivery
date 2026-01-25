import { useStore, Order } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, MapPin, Phone, Truck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function DashboardPage() {
  const { orders, markAsDelivered } = useStore();
  
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-display font-bold">Tableau de Bord</h2>
        <p className="text-muted-foreground">Gérez vos livraisons en temps réel.</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50 p-1">
          <TabsTrigger value="pending" className="text-base data-[state=active]:bg-white data-[state=active]:text-secondary data-[state=active]:shadow-sm">
            En Cours ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="delivered" className="text-base data-[state=active]:bg-white data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">
            Terminées ({deliveredOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border border-dashed border-border">
              <Truck className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Aucune commande en attente.</p>
            </div>
          ) : (
            pendingOrders.map(order => (
              <OrderCard key={order.id} order={order} onDeliver={() => markAsDelivered(order.id)} />
            ))
          )}
        </TabsContent>

        <TabsContent value="delivered" className="space-y-4 mt-6">
          {deliveredOrders.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border border-dashed border-border">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Aucune commande livrée aujourd'hui.</p>
            </div>
          ) : (
            deliveredOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrderCard({ order, onDeliver }: { order: Order; onDeliver?: () => void }) {
  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
      <div className={`h-1.5 w-full ${order.status === 'delivered' ? 'bg-secondary' : 'bg-primary'}`} />
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <Badge variant="outline" className="font-mono text-xs bg-muted/50">
            {order.id}
          </Badge>
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(order.timestamp, { addSuffix: true, locale: fr })}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-muted p-2 rounded-full shrink-0">
              <MapPin className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm leading-tight">{order.address}</p>
              {order.note && <p className="text-xs text-muted-foreground mt-1 italic">"{order.note}"</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-muted p-2 rounded-full shrink-0">
              <Phone className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">{order.recipientName}</p>
              <p className="text-xs text-muted-foreground">{order.recipientPhone}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/50">
          <p className="font-bold text-lg font-mono">
            {order.price.toLocaleString()} FC
          </p>
          
          {onDeliver && (
            <Button size="sm" onClick={onDeliver} className="bg-secondary hover:bg-secondary/90 text-white">
              Marquer Livré
            </Button>
          )}
          {order.status === 'delivered' && (
             <Badge className="bg-secondary/10 text-secondary hover:bg-secondary/20 border-none px-3 py-1">
                Livré
             </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
