import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { StatusBar } from "@/components/status-bar";
import { AppBar } from "@/components/app-bar";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  pending: number;
  delivered: number;
  notDelivered: number;
  totalInventory: number;
}

interface UpcomingVisit {
  id: number;
  customer: {
    name: string;
    address: string;
    schedule: string;
  };
  scheduledTime: string;
  status: string;
}

export function Dashboard() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/statistics"],
    queryFn: () => fetch("/api/statistics?driverId=1").then(res => res.json()),
  });

  const { data: upcomingVisits } = useQuery<UpcomingVisit[]>({
    queryKey: ["/api/orders", "upcoming"],
    queryFn: () => fetch("/api/orders?driverId=1&status=pending").then(res => res.json()),
  });

  return (
    <div className="min-h-screen bg-background">
      <StatusBar />
      
      <AppBar 
        title="DeliveryRoute"
        subtitle="Ruta del día - Zona Norte"
        showActions
      />

      {/* Status Cards */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Pendientes</p>
              <p className="text-2xl font-medium">{stats?.pending || 0}</p>
            </div>
            <div className="bg-warning/20 p-2 rounded-full">
              <span className="material-icons text-warning">pending</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Entregados</p>
              <p className="text-2xl font-medium text-success">{stats?.delivered || 0}</p>
            </div>
            <div className="bg-success/20 p-2 rounded-full">
              <span className="material-icons text-success">check_circle</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">No Entregados</p>
              <p className="text-2xl font-medium text-error">{stats?.notDelivered || 0}</p>
            </div>
            <div className="bg-error/20 p-2 rounded-full">
              <span className="material-icons text-error">cancel</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Inventario</p>
              <p className="text-2xl font-medium">{stats?.totalInventory || 0}</p>
            </div>
            <div className="bg-primary/20 p-2 rounded-full">
              <span className="material-icons text-primary">inventory</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <h2 className="text-lg font-medium mb-3">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button asChild className="bg-primary text-primary-foreground p-4 h-auto">
            <Link to="/orders" className="flex items-center space-x-3">
              <span className="material-icons">list_alt</span>
              <span className="font-medium">Ver Pedidos</span>
            </Link>
          </Button>
          
          <Button asChild variant="secondary" className="bg-success text-success-foreground p-4 h-auto">
            <Link to="/route" className="flex items-center space-x-3">
              <span className="material-icons">map</span>
              <span className="font-medium">Ver Ruta</span>
            </Link>
          </Button>
          
          <Button asChild className="bg-warning text-warning-foreground p-4 h-auto">
            <Link to="/inventory" className="flex items-center space-x-3">
              <span className="material-icons">inventory_2</span>
              <span className="font-medium">Inventario</span>
            </Link>
          </Button>
          
          <Button variant="secondary" className="bg-muted text-muted-foreground p-4 h-auto">
            <div className="flex items-center space-x-3">
              <span className="material-icons">cloud_sync</span>
              <span className="font-medium">Sincronizar</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="p-4 pb-20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Próximas Visitas</h2>
          <Button variant="link" asChild className="text-primary text-sm font-medium">
            <Link to="/orders">Ver todas</Link>
          </Button>
        </div>
        
        <div className="space-y-3">
          {upcomingVisits?.slice(0, 2).map((visit) => (
            <Card key={visit.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{visit.customer.name}</h3>
                    <p className="text-muted-foreground text-sm">{visit.customer.address}</p>
                    <p className="text-muted-foreground text-xs">Horario: {visit.customer.schedule}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={visit.status === 'pending' ? 'secondary' : 'default'} className="mb-1">
                      {visit.status === 'pending' ? 'Pendiente' : 'Entregado'}
                    </Badge>
                    <p className="text-muted-foreground text-sm">{visit.scheduledTime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <BottomNavigation activeTab="dashboard" />
    </div>
  );
}
