import { useQuery } from "@tanstack/react-query";
import { StatusBar } from "@/components/status-bar";
import { AppBar } from "@/components/app-bar";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RouteData {
  id: number;
  name: string;
  totalDistance: string;
  estimatedTime: number;
  actualTime?: number;
  waypoints: Array<{
    lat: number;
    lng: number;
    orderId?: number;
  }>;
}

interface NextVisit {
  id: number;
  orderNumber: string;
  customer: {
    name: string;
    address: string;
    phone: string;
  };
  scheduledTime: string;
  itemCount: number;
  distance: number;
  estimatedTime: number;
  status: string;
}

export function RouteMap() {
  const { data: route } = useQuery<RouteData>({
    queryKey: ["/api/routes", "current"],
    queryFn: () => fetch("/api/routes?driverId=1").then(res => res.json().then(data => data[0])),
  });

  const { data: nextVisits } = useQuery<NextVisit[]>({
    queryKey: ["/api/orders", "next-visits"],
    queryFn: () => fetch("/api/orders?driverId=1&status=pending").then(res => res.json()),
  });

  const getVisitStatusColor = (index: number) => {
    if (index === 0) return "bg-warning";
    if (index === 1) return "bg-success";
    return "bg-muted";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="status-pending">Pendiente</Badge>;
      case "delivered":
        return <Badge className="status-delivered">Entregado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StatusBar />
      
      <AppBar 
        title="Ruta del Día"
        subtitle={
          <div className="flex items-center space-x-2 text-primary-foreground/80">
            <span className="material-icons text-sm">location_on</span>
            <span>Zona Norte - 8 de 23 visitados</span>
          </div>
        }
        actions={
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground">
              <span className="material-icons">my_location</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground">
              <span className="material-icons">layers</span>
            </Button>
          </div>
        }
      />

      {/* Map Container */}
      <div className="relative">
        <div className="h-96 bg-gradient-to-br from-blue-100 to-green-100 dark:from-muted dark:to-muted/50 relative overflow-hidden">
          {/* Map Pin Markers */}
          <div className="absolute top-16 left-12 w-6 h-6 bg-success rounded-full border-2 border-background shadow-lg flex items-center justify-center">
            <span className="text-xs text-success-foreground font-bold">1</span>
          </div>
          <div className="absolute top-32 right-20 w-6 h-6 bg-warning rounded-full border-2 border-background shadow-lg flex items-center justify-center">
            <span className="text-xs text-warning-foreground font-bold">2</span>
          </div>
          <div className="absolute bottom-20 left-20 w-6 h-6 bg-error rounded-full border-2 border-background shadow-lg flex items-center justify-center">
            <span className="text-xs text-error-foreground font-bold">3</span>
          </div>
          <div className="absolute bottom-32 right-16 w-6 h-6 bg-muted rounded-full border-2 border-background shadow-lg flex items-center justify-center">
            <span className="text-xs text-muted-foreground font-bold">4</span>
          </div>
          
          {/* Current Location */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg animate-pulse"></div>
            <div className="w-8 h-8 bg-primary/30 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
          </div>
          
          {/* Route Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path 
              d="M 80 80 Q 150 100 200 140 T 300 240" 
              stroke="hsl(var(--primary))" 
              strokeWidth="3" 
              fill="none" 
              strokeDasharray="5,5" 
              opacity="0.7"
            />
          </svg>
          
          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <Button variant="secondary" size="icon" className="w-10 h-10 shadow-lg">
              <span className="material-icons">add</span>
            </Button>
            <Button variant="secondary" size="icon" className="w-10 h-10 shadow-lg">
              <span className="material-icons">remove</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats Overlay */}
        <div className="absolute bottom-4 left-4 right-4 bg-card rounded-lg shadow-lg p-3">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <p className="font-medium">{route?.totalDistance || "8.5"} km</p>
              <p className="text-muted-foreground">Recorrido</p>
            </div>
            <div>
              <p className="font-medium">{route?.estimatedTime ? `${(route.estimatedTime / 60).toFixed(1)} hr` : "2.3 hr"}</p>
              <p className="text-muted-foreground">Tiempo</p>
            </div>
            <div>
              <p className="font-medium">8/23</p>
              <p className="text-muted-foreground">Visitados</p>
            </div>
            <div>
              <p className="font-medium">15</p>
              <p className="text-muted-foreground">Restantes</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Route Optimization */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Optimización de Ruta</h3>
              <Button variant="link" className="text-primary text-sm font-medium">
                Recalcular
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-success/10 rounded-lg">
                <p className="font-medium text-success">45 min</p>
                <p className="text-muted-foreground">Ahorro estimado</p>
              </div>
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <p className="font-medium text-primary">12.3 km</p>
                <p className="text-muted-foreground">Distancia optimizada</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Route Pattern */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Patrón de Visitas Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Days of the week */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
                <div key={index} className="text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Customer Visit Pattern */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm flex-1">Tienda El Progreso</span>
                <div className="flex space-x-1">
                  {[true, false, true, false, true, false, false].map((active, index) => (
                    <div 
                      key={index}
                      className={`w-4 h-4 rounded-sm ${active ? "bg-success" : "bg-muted"}`}
                    ></div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <span className="text-sm flex-1">Supermercado La Esquina</span>
                <div className="flex space-x-1">
                  {[false, true, false, true, false, true, false].map((active, index) => (
                    <div 
                      key={index}
                      className={`w-4 h-4 rounded-sm ${active ? "bg-warning" : "bg-muted"}`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Visits */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Visitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nextVisits?.slice(0, 3).map((visit, index) => (
                <div key={visit.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                  <div className={`w-8 h-8 ${getVisitStatusColor(index)} rounded-full flex items-center justify-center text-white text-sm font-medium`}>
                    {index + 2}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{visit.customer.name}</h4>
                    <p className="text-muted-foreground text-sm">{visit.customer.address}</p>
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                      <span>📞 {visit.customer.phone}</span>
                      <span>⏰ {visit.scheduledTime}</span>
                      <span>📦 {visit.itemCount} items</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{visit.distance} km</p>
                    <p className="text-xs text-muted-foreground">{visit.estimatedTime} min</p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  <span className="material-icons text-4xl mb-2">route</span>
                  <p>No hay visitas programadas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation activeTab="route" />
    </div>
  );
}
