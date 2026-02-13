import { useState, useEffect, useCallback } from "react";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, XCircle, MapPin, Users, Package, TrendingUp, Bell, Truck, DollarSign, Clock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAdminDriverLocations, getAdminAlerts, getAdminStats, listCashoutRequests, resolveCashoutRequest } from "@/lib/api";
import type { CashoutRequest } from "@shared/schema";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const driverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const inactiveDriverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function AdminDashboardPage() {
  const { profile } = useStore();
  const { toast } = useToast();
  const [driverLocations, setDriverLocations] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [cashoutRequests, setCashoutRequests] = useState<CashoutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCashout, setSelectedCashout] = useState<CashoutRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'cashouts'>('map');

  const loadAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const [locs, alertsData, statsData, cashouts] = await Promise.all([
        getAdminDriverLocations(),
        getAdminAlerts(),
        getAdminStats(),
        listCashoutRequests({ status: 'pending' }),
      ]);
      setDriverLocations(locs);
      setAlerts(alertsData);
      setStats(statsData);
      setCashoutRequests(cashouts);
    } catch (error) {
      console.error("Admin load error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, [loadAll]);

  const handleResolveCashout = async (id: string, status: string) => {
    try {
      await resolveCashoutRequest(id, status, adminNote);
      toast({
        title: status === 'approved' ? "Retrait approuvé" : "Retrait refusé",
        description: status === 'approved' ? "Le retrait a été validé" : "Le retrait a été refusé",
      });
      setSelectedCashout(null);
      setAdminNote("");
      await loadAll();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-black tracking-tighter text-secondary" data-testid="text-admin-title">Admin</h1>
          </div>
          <p className="text-xs text-gray-500 font-medium">Tableau de bord administrateur</p>
        </div>
        {alerts.length > 0 && (
          <div className="flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-full">
            <Bell className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-black text-red-600" data-testid="text-alert-count">{alerts.length} alerte{alerts.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white rounded-2xl p-3 text-center border border-gray-50 shadow-sm">
            <p className="text-xl font-black text-secondary" data-testid="stat-deliveries">{stats.totalDeliveries}</p>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Colis</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center border border-gray-50 shadow-sm">
            <p className="text-xl font-black text-blue-600" data-testid="stat-drivers">{stats.totalDrivers}</p>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Livreurs</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center border border-gray-50 shadow-sm">
            <p className="text-xl font-black text-green-600" data-testid="stat-revenue">{stats.totalRevenue?.toLocaleString()}</p>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Rev FC</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center border border-gray-50 shadow-sm">
            <p className="text-xl font-black text-amber-600" data-testid="stat-pending-cashouts">{stats.pendingCashouts}</p>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Retraits</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {(['map', 'alerts', 'cashouts'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === tab
                ? 'bg-secondary text-white shadow-lg'
                : 'bg-gray-100 text-gray-500'
            }`}
            data-testid={`tab-${tab}`}
          >
            {tab === 'map' ? 'Carte' : tab === 'alerts' ? `Alertes (${alerts.length})` : `Retraits (${cashoutRequests.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'map' && (
        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: '400px' }} data-testid="admin-map">
          <MapContainer
            center={[-4.3217, 15.3126]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {driverLocations.map((loc, i) => (
              <Marker
                key={loc.driverId || i}
                position={[loc.latitude, loc.longitude]}
                icon={loc.isActive ? driverIcon : inactiveDriverIcon}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-sm">{loc.driverName || 'Livreur'}</p>
                    <Badge className={`text-[9px] mt-1 ${loc.isActive ? 'bg-green-500' : 'bg-gray-400'} text-white`}>
                      {loc.isActive ? 'En service' : 'Hors service'}
                    </Badge>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          {driverLocations.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-[500]">
              <div className="text-center">
                <MapPin className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-400">Aucun livreur localisé</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-50">
              <CheckCircle2 className="h-12 w-12 text-green-200 mx-auto mb-3" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tout est en ordre</p>
              <p className="text-[10px] text-gray-400 mt-1">Aucune alerte pour le moment</p>
            </div>
          ) : (
            alerts.map((alert, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl border ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 border-red-100'
                    : 'bg-amber-50 border-amber-100'
                }`}
                data-testid={`alert-${i}`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                    alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-secondary">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-[9px] ${
                        alert.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                      } text-white`}>
                        {alert.type === 'late_delivery' ? 'Retard' : 'Dette'}
                      </Badge>
                      <span className="text-[10px] text-gray-400">
                        {alert.type === 'late_delivery' ? 'Colis en retard' : 'Dette élevée'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'cashouts' && (
        <div className="space-y-3">
          {cashoutRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-50">
              <DollarSign className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aucune demande en attente</p>
            </div>
          ) : (
            cashoutRequests.map(req => (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-4 border border-gray-50 shadow-sm"
                data-testid={`cashout-${req.id}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-secondary">Demande de retrait</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">ID: {req.userId.substring(0, 8)}</p>
                    {req.createdAt && (
                      <p className="text-[10px] text-gray-400">
                        {new Date(req.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-secondary">{parseFloat(req.amount || "0").toLocaleString()} FC</p>
                    <Badge className="bg-amber-500 text-white text-[9px] font-black uppercase mt-1">En attente</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <Button
                    className="rounded-xl bg-green-500 text-white font-bold text-xs h-10"
                    onClick={() => handleResolveCashout(req.id, 'approved')}
                    data-testid={`button-approve-${req.id}`}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Approuver
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-red-200 text-red-500 font-bold text-xs h-10"
                    onClick={() => { setSelectedCashout(req); }}
                    data-testid={`button-reject-${req.id}`}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Refuser
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Dialog open={!!selectedCashout} onOpenChange={(open) => { if (!open) setSelectedCashout(null); }}>
        <DialogContent className="rounded-[2rem] p-6 max-w-[90%]">
          <DialogHeader>
            <DialogTitle className="text-center font-black text-lg">Refuser le retrait</DialogTitle>
          </DialogHeader>
          {selectedCashout && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-gray-500 text-center">
                Montant: <span className="font-bold text-secondary">{parseFloat(selectedCashout.amount || "0").toLocaleString()} FC</span>
              </p>
              <Input
                placeholder="Raison du refus (optionnel)"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="h-12 rounded-xl"
                data-testid="input-admin-note"
              />
              <Button
                className="w-full h-12 rounded-xl bg-red-500 text-white font-bold"
                onClick={() => handleResolveCashout(selectedCashout.id, 'rejected')}
                data-testid="button-confirm-reject"
              >
                Confirmer le refus
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
