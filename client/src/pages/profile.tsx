import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { StatusBar } from "@/components/status-bar";
import { AppBar } from "@/components/app-bar";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, MapPin, Package, TrendingUp, Calculator, Clock, AlertTriangle } from "lucide-react";

interface RouteStats {
  totalDeliveries: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  totalDistance: number;
  averageDeliveryTime: number;
  startTime: string;
  endTime?: string;
}

interface ReturnItem {
  id: number;
  productId: number;
  quantity: number;
  reason: string;
  product: {
    name: string;
    code: string;
    wmsCode: string;
  };
}

export function Profile() {
  const { user, routeInfo, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isEndingDay, setIsEndingDay] = useState(false);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [endMileage, setEndMileage] = useState("");
  const [observations, setObservations] = useState("");

  const { data: routeStats } = useQuery<RouteStats>({
    queryKey: ["/api/route-stats", user?.id],
    queryFn: () => apiRequest(`/api/route-stats?driverId=${user?.id}`),
  });

  const { data: inventory } = useQuery({
    queryKey: ["/api/inventory", user?.id],
    queryFn: () => apiRequest(`/api/inventory?driverId=${user?.id}`),
  });

  const endDayMutation = useMutation({
    mutationFn: (data: {
      endMileage: string;
      observations: string;
      returnItems: ReturnItem[];
    }) => apiRequest("/api/route-sessions/end", {
      method: "POST",
      body: JSON.stringify({
        driverId: user?.id,
        endMileage: data.endMileage,
        observations: data.observations,
        returnItems: data.returnItems,
      }),
    }),
    onSuccess: () => {
      toast({
        title: "Día terminado exitosamente",
        description: "Cierre Z completado. Sesión finalizada.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/route-stats"] });
      logout();
    },
    onError: (error) => {
      toast({
        title: "Error al terminar el día",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    },
  });

  const handleEndDay = () => {
    if (!endMileage) {
      toast({
        title: "Kilometraje requerido",
        description: "Por favor ingrese el kilometraje final",
        variant: "destructive",
      });
      return;
    }

    endDayMutation.mutate({
      endMileage,
      observations,
      returnItems,
    });
  };

  const addReturnItem = () => {
    setReturnItems([
      ...returnItems,
      {
        id: Date.now(),
        productId: 0,
        quantity: 0,
        reason: "",
        product: { name: "", code: "", wmsCode: "" },
      },
    ]);
  };

  const removeReturnItem = (id: number) => {
    setReturnItems(returnItems.filter(item => item.id !== id));
  };

  const updateReturnItem = (id: number, field: string, value: any) => {
    setReturnItems(returnItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <StatusBar />
      
      <AppBar 
        title="Perfil"
        subtitle={`${user.name} - ${routeInfo?.routeName || 'Sin ruta'}`}
        showBack="/"
      />

      <div className="p-4 pb-20 space-y-4">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información del Conductor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nombre:</span>
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usuario:</span>
              <span className="font-medium">{user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ruta:</span>
              <span className="font-medium">{routeInfo?.routeName || 'No asignada'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Asistente:</span>
              <span className="font-medium">{routeInfo?.assistantName || 'No asignado'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Route Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Estadísticas de la Ruta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-success/10 rounded-lg">
                <p className="text-2xl font-bold text-success">
                  {routeStats?.completedDeliveries || 0}
                </p>
                <p className="text-sm text-muted-foreground">Entregas Completadas</p>
              </div>
              <div className="text-center p-3 bg-warning/10 rounded-lg">
                <p className="text-2xl font-bold text-warning">
                  {routeStats?.pendingDeliveries || 0}
                </p>
                <p className="text-sm text-muted-foreground">Entregas Pendientes</p>
              </div>
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {routeStats?.totalDistance || 0} km
                </p>
                <p className="text-sm text-muted-foreground">Distancia Total</p>
              </div>
              <div className="text-center p-3 bg-info/10 rounded-lg">
                <p className="text-2xl font-bold text-info">
                  {routeStats?.averageDeliveryTime || 0} min
                </p>
                <p className="text-sm text-muted-foreground">Tiempo Promedio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mileage Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Información de Kilometraje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kilometraje Inicial:</span>
              <span className="font-medium">{routeInfo?.startMileage || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hora de Inicio:</span>
              <span className="font-medium">
                {routeStats?.startTime ? new Date(routeStats.startTime).toLocaleTimeString() : 'N/A'}
              </span>
            </div>
            {routeStats?.endTime && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hora de Fin:</span>
                <span className="font-medium">
                  {new Date(routeStats.endTime).toLocaleTimeString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* End of Day Button */}
        <Dialog open={isEndingDay} onOpenChange={setIsEndingDay}>
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              variant="destructive"
              disabled={routeStats?.endTime !== undefined}
            >
              <Calculator className="w-4 h-4 mr-2" />
              {routeStats?.endTime ? 'Día ya terminado' : 'Terminar Día (Cierre Z)'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cierre Z - Liquidación de Ruta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="endMileage">Kilometraje Final</Label>
                <Input
                  id="endMileage"
                  type="number"
                  value={endMileage}
                  onChange={(e) => setEndMileage(e.target.value)}
                  placeholder="Ingrese kilometraje final"
                />
              </div>

              <div>
                <Label htmlFor="observations">Observaciones</Label>
                <Textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Observaciones del día..."
                  rows={3}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Devoluciones de Mercancía</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addReturnItem}
                  >
                    + Agregar
                  </Button>
                </div>
                {returnItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 mb-2">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Producto #{item.id}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeReturnItem(item.id)}
                      >
                        ×
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Código del producto"
                        value={item.product.code}
                        onChange={(e) => updateReturnItem(item.id, 'product', {
                          ...item.product,
                          code: e.target.value
                        })}
                      />
                      <Input
                        type="number"
                        placeholder="Cantidad"
                        value={item.quantity}
                        onChange={(e) => updateReturnItem(item.id, 'quantity', parseInt(e.target.value))}
                      />
                      <Input
                        placeholder="Motivo de devolución"
                        value={item.reason}
                        onChange={(e) => updateReturnItem(item.id, 'reason', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEndingDay(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEndDay}
                  disabled={endDayMutation.isPending}
                  className="flex-1"
                >
                  {endDayMutation.isPending ? 'Procesando...' : 'Finalizar Día'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Logout Button */}
        <Button 
          variant="outline" 
          onClick={logout}
          className="w-full"
        >
          Cerrar Sesión
        </Button>
      </div>

      <BottomNavigation />
    </div>
  );
}