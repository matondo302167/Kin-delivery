import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, User, PackagePlus, Clock, Wallet, Banknote, Navigation, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Popup } from 'react-leaflet';
import L, { LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const formSchema = z.object({
  recipientName: z.string().min(2, "Nom requis"),
  recipientPhone: z.string().min(9, "Numéro invalide"),
  pickupAddress: z.string().min(5, "Adresse de départ requise"),
  deliveryAddress: z.string().min(5, "Adresse d'arrivée requise"),
  price: z.coerce.number().min(500, "Livraison min 500 FC"),
  articlePrice: z.coerce.number().min(0, "Prix invalide"),
  paymentMethod: z.enum(["cod", "mobile_money"]),
});

function LocationMarker({ activeField, onLocationSelect, userLocation }: { activeField: 'pickup' | 'delivery' | null, onLocationSelect: (lat: number, lng: number) => void, userLocation: L.LatLng | null }) {
  const [pickupPos, setPickupPos] = useState<L.LatLng | null>(null);
  const [deliveryPos, setDeliveryPos] = useState<L.LatLng | null>(null);
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
       map.flyTo(userLocation, 15);
    }
  }, [userLocation, map]);

  useMapEvents({
    click(e: LeafletMouseEvent) {
      if (activeField === 'pickup') {
        setPickupPos(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
        map.flyTo(e.latlng, map.getZoom());
      } else if (activeField === 'delivery') {
        setDeliveryPos(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
        map.flyTo(e.latlng, map.getZoom());
      }
    },
  });

  return (
    <>
      {userLocation && <Marker position={userLocation} icon={new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png', iconSize: [25, 41], iconAnchor: [12, 41] })}><Popup>Votre position</Popup></Marker>}
      {pickupPos && <Marker position={pickupPos} icon={new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png', iconSize: [25, 41], iconAnchor: [12, 41] })}><Popup>Point de départ</Popup></Marker>}
      {deliveryPos && <Marker position={deliveryPos} icon={new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png', iconSize: [25, 41], iconAnchor: [12, 41] })}><Popup>Point d'arrivée</Popup></Marker>}
    </>
  );
}

export default function OrderPage() {
  const { addOrder, orders } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeField, setActiveField] = useState<'pickup' | 'delivery' | null>(null);
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lng: number} | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<{lat: number, lng: number} | null>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientName: "",
      recipientPhone: "",
      pickupAddress: "",
      deliveryAddress: "",
      price: 2500,
      articlePrice: 0,
      paymentMethod: "cod",
    },
  });

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (e) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation(new L.LatLng(latitude, longitude));
          
          // Auto-fill pickup address with current location
          const address = await fetchAddress(latitude, longitude);
          form.setValue("pickupAddress", address);
          setPickupCoords({ lat: latitude, lng: longitude });
          
          toast({
             title: "Localisation activée",
             description: "Votre position a été définie comme point de départ.",
          });
        },
        (error) => {
          console.error("Error getting location", error);
        }
      );
    }
  }, []);

  const handleLocationSelect = async (lat: number, lng: number) => {
    const address = await fetchAddress(lat, lng);
    
    if (activeField === 'pickup') {
      setPickupCoords({ lat, lng });
      form.setValue("pickupAddress", address);
    } else if (activeField === 'delivery') {
      setDeliveryCoords({ lat, lng });
      form.setValue("deliveryAddress", address);
    }
    setActiveField(null); // Clear active field to hide yellow text
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Combine addresses or use delivery for the main record
    // Using delivery coords for the order tracking
    const coords = deliveryCoords || { lat: -4.325, lng: 15.3222 };
    
    const token = addOrder({ 
      ...values, 
      address: values.deliveryAddress, // Map deliveryAddress to legacy address field
      lat: coords.lat, 
      lng: coords.lng 
    } as any);
    
    toast({
      title: "Course lancée !",
      description: `Votre coursier arrive. Tracking: ${token}`,
    });
    form.reset();
    setPickupCoords(null);
    setDeliveryCoords(null);
  }

  const paymentMethod = form.watch("paymentMethod");

  // Mock address suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const handleAddressChange = async (value: string) => {
    if (value.length > 2) {
      try {
        // Bias results towards Kinshasa
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}+Kinshasa&countrycodes=cd&limit=5`);
        const data = await response.json();
        setSuggestions(data.map((item: any) => item.display_name));
      } catch (e) {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] overflow-hidden bg-white">
      {/* Left Panel - Uber Style */}
      <div className="w-full md:w-[450px] bg-white z-20 flex flex-col shadow-2xl h-full overflow-y-auto">
        <div className="p-8 space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tighter text-secondary">Commander une course</h1>
            <p className="text-sm text-gray-500 font-medium">Remplissez les détails pour une livraison express.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Ride Inputs Card */}
              <div className="bg-gray-50 p-4 rounded-3xl space-y-4 border border-gray-100 relative">
                {/* Visual Connector Line */}
                <div className="absolute left-[27px] top-[40px] bottom-[40px] w-0.5 bg-gray-300 z-0"></div>
                
                {/* Pickup Input */}
                <FormField
                  control={form.control}
                  name="pickupAddress"
                  render={({ field }) => (
                    <FormItem className={cn("relative transition-all duration-200", activeField === 'pickup' ? "z-30" : "z-20")}>
                      <FormControl>
                        <div className="relative group">
                          <div className="absolute left-3 top-3.5 w-2.5 h-2.5 rounded-full bg-black border-2 border-black z-20 ring-4 ring-white" />
                          <Input 
                            placeholder="Point de départ" 
                            className={cn(
                              "pl-10 h-12 bg-white border-0 shadow-sm rounded-xl font-medium focus-visible:ring-2 focus-visible:ring-black transition-all",
                              activeField === 'pickup' && "ring-2 ring-black scale-[1.02] shadow-md"
                            )} 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleAddressChange(e.target.value);
                            }}
                            onFocus={() => setActiveField('pickup')}
                            onBlur={() => {
                               // Delay hiding to allow click on suggestion
                               setTimeout(() => {
                                 if (activeField === 'pickup') setActiveField(null);
                               }, 200);
                            }}
                          />
                          {/* Suggestions Dropdown */}
                          {activeField === 'pickup' && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-xl z-[9999] mt-2 border border-gray-100 max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in-95 duration-200">
                              {suggestions.map((suggestion, idx) => (
                                <div 
                                  key={idx} 
                                  className="p-3 hover:bg-gray-50 cursor-pointer text-sm font-medium border-b border-gray-50 last:border-none flex items-center gap-3 transition-colors"
                                  onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent blur
                                    form.setValue("pickupAddress", suggestion);
                                    setSuggestions([]);
                                    setActiveField(null);
                                  }}
                                >
                                  <div className="bg-gray-100 p-2 rounded-full shrink-0">
                                    <MapPin className="h-4 w-4 text-gray-600" />
                                  </div>
                                  <span className="truncate text-gray-700">{suggestion}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {activeField === 'pickup' && !field.value && (
                             <div className="absolute right-3 top-3.5 text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
                               Sélectionnez sur la carte
                             </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Delivery Input */}
                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem className={cn("relative transition-all duration-200", activeField === 'delivery' ? "z-30" : "z-20")}>
                      <FormControl>
                        <div className="relative group">
                          <div className="absolute left-3 top-3.5 w-2.5 h-2.5 bg-black z-20 ring-4 ring-white" />
                          <Input 
                            placeholder="Point d'arrivée" 
                            className={cn(
                              "pl-10 h-12 bg-white border-0 shadow-sm rounded-xl font-medium focus-visible:ring-2 focus-visible:ring-black transition-all",
                              activeField === 'delivery' && "ring-2 ring-black scale-[1.02] shadow-md"
                            )} 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleAddressChange(e.target.value);
                            }}
                            onFocus={() => setActiveField('delivery')}
                            onBlur={() => {
                               setTimeout(() => {
                                 if (activeField === 'delivery') setActiveField(null);
                               }, 200);
                            }}
                          />
                          {/* Suggestions Dropdown */}
                          {activeField === 'delivery' && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-xl z-[9999] mt-2 border border-gray-100 max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in-95 duration-200">
                              {suggestions.map((suggestion, idx) => (
                                <div 
                                  key={idx} 
                                  className="p-3 hover:bg-gray-50 cursor-pointer text-sm font-medium border-b border-gray-50 last:border-none flex items-center gap-3 transition-colors"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    form.setValue("deliveryAddress", suggestion);
                                    setSuggestions([]);
                                    setActiveField(null);
                                  }}
                                >
                                  <div className="bg-gray-100 p-2 rounded-full shrink-0">
                                    <MapPin className="h-4 w-4 text-gray-600" />
                                  </div>
                                  <span className="truncate text-gray-700">{suggestion}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {activeField === 'delivery' && !field.value && (
                             <div className="absolute right-3 top-3.5 text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
                               Sélectionnez sur la carte
                             </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Time Selector (Mock) */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-secondary" />
                  <span className="font-bold text-sm">Partir maintenant</span>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>

              {/* Details & Price */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="recipientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Nom du destinataire" className="h-12 bg-gray-50 border-gray-100 rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="recipientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Tél. destinataire" className="h-12 bg-gray-50 border-gray-100 rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {paymentMethod === 'cod' && (
                    <FormField
                      control={form.control}
                      name="articlePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest">Prix Article (FC)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="À récupérer" className="h-12 bg-gray-50 border-gray-100 rounded-xl font-black text-lg" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem className={cn(paymentMethod !== 'cod' && "col-span-2")}>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest">Prix Livraison (FC)</FormLabel>
                        <FormControl>
                          <Input type="number" className="h-12 bg-gray-50 border-gray-100 rounded-xl font-black text-lg" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                </div>
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest">Paiement</FormLabel>
                        <FormControl>
                           <select 
                             className="w-full h-12 bg-gray-50 border-gray-100 rounded-xl px-3 font-bold text-sm outline-none focus:ring-2 focus:ring-black"
                             {...field}
                           >
                             <option value="cod">Cash (Espèces)</option>
                             <option value="mobile_money">Mobile Money</option>
                           </select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
              </div>

              <Button type="submit" className="w-full h-14 bg-black hover:bg-gray-800 text-white font-bold text-lg rounded-xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                Lancer la course
              </Button>
            </form>
          </Form>
        </div>
      </div>

      {/* Right Panel - Map */}
      <div className="flex-1 relative bg-gray-100 h-[50vh] md:h-full w-full">
         <MapContainer 
            center={[-4.325, 15.3222]} 
            zoom={13} 
            scrollWheelZoom={true}
            className="h-full w-full z-0"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <LocationMarker activeField={activeField} onLocationSelect={handleLocationSelect} userLocation={userLocation} />
            
            {/* Custom Zoom Control could go here */}
          </MapContainer>
          
          {/* Map Overlay Info - REMOVED per user request */}
      </div>
    </div>
  );
}

