import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { StatusBar } from "@/components/status-bar";
import { AppBar } from "@/components/app-bar";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface OrderDetail {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: string;
  scheduledDate: string;
  customer: {
    name: string;
    contact: string;
    address: string;
    phone: string;
    schedule: string;
  };
  items: Array<{
    id: number;
    quantity: number;
    deliveredQuantity: number;
    price: string;
    totalAmount: string;
    product: {
      name: string;
      code: string;
    };
  }>;
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation(); // ✅ corrección aplicada
  const { toast } = useToast();

  const { data: order, isLoading } = useQuery<OrderDetail>({
    queryKey: ["/api/orders", id],
    queryFn: () => fetch(`/api/orders/${id}`).then(res => res.json()),
  });

  const startDeliveryMutation = useMutation({
    mutationFn: () => fetch("/api/delivery/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: parseInt(id!) }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      navigate(`/delivery/${id}`);
      toast({
        title: "Entrega iniciada",
        description: "El proceso de entrega ha comenzado.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo iniciar la entrega.",
        variant: "destructive",
      });
    },
  });

  const markNotDeliveredMutation = useMutation({
    mutationFn: (reason: string) => fetch("/api/delivery/not-delivered", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: parseInt(id!), reason }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Pedido marcado como no entregado",
        description: "El pedido ha sido actualizado.",
      });
    },
  });

  const formatCurrency = (amount: string) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="status-pending">Pendiente</Badge>;
      case "delivered":
        return <Badge className="status-delivered">Entregado</Badge>;
      case "not_delivered":
        return <Badge className="status-not-delivered">No Entregado</Badge>;
      case "in_progress":
        return <Badge variant="secondary">En Progreso</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <StatusBar />
        <AppBar title="Cargando..." showBack="/orders" />
        <div className="p-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <StatusBar />
        <AppBar title="Pedido no encontrado" showBack="/orders" />
        <div className="p-4 text-center">
          <p className="text-muted-foreground">El pedido no fue encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StatusBar />
      <AppBar 
        title={`Pedido ${order.orderNumber}`}
        subtitle={order.customer.name}
        showBack="/orders"
        showMenu
      />

      <div className="p-4 pb-20">
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-lg">{order.customer.name}</h3>
                <p className="text-muted-foreground">{order.customer.contact}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="material-icons text-muted-foreground text-sm">location_on</span>
                <span>{order.customer.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="material-icons text-muted-foreground text-sm">phone</span>
                <span>{order.customer.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="material-icons text-muted-foreground text-sm">schedule</span>
                <span>{order.customer.schedule}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="material-icons text-muted-foreground text-sm">calendar_today</span>
                <span>Última visita: Hace 5 días</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="material-icons text-muted-foreground text-sm">credit_card</span>
                <span>Crédito: 30 días</span>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <Button className="flex-1" variant="outline">
                <span className="material-icons text-sm mr-2">map</span>
                Ver en Mapa
              </Button>
              <Button className="flex-1 bg-success text-success-foreground">
                <span className="material-icons text-sm mr-2">call</span>
                Llamar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Resumen del Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Productos</p>
                <p className="font-medium">{order.items?.length || 0} items</p>
              </div>
              <div>
                <p className="text-muted-foreground">Valor Total</p>
                <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fecha Pedido</p>
                <p className="font-medium">{new Date(order.scheduledDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado</p>
                {getStatusBadge(order.status)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Productos del Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {order.items?.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <span className="material-icons text-muted-foreground">inventory_2</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product.name}</h4>
                      <p className="text-muted-foreground text-sm">Código: {item.product.code}</p>
                      <div className="flex items-center space-x-4 text-sm mt-1">
                        <span className="text-muted-foreground">
                          Cant: <span className="font-medium">{item.quantity}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Precio: <span className="font-medium">{formatCurrency(item.price)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.totalAmount)}</p>
                      <div className="bg-success/20 text-success px-2 py-1 rounded text-xs mt-1">
                        Stock: 50
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {order.status === "pending" && (
          <div className="space-y-3">
            <Button 
              onClick={() => startDeliveryMutation.mutate()}
              disabled={startDeliveryMutation.isPending}
              className="w-full bg-success text-success-foreground py-4 text-lg shadow-lg"
            >
              <span className="material-icons mr-3">local_shipping</span>
              Iniciar Entrega
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="secondary"
                onClick={() => markNotDeliveredMutation.mutate("Cliente no disponible")}
                disabled={markNotDeliveredMutation.isPending}
              >
                <span className="material-icons text-sm mr-2">cancel</span>
                No Entregar
              </Button>
              <Button variant="outline">
                <span className="material-icons text-sm mr-2">edit</span>
                Editar
              </Button>
            </div>
          </div>
        )}

        {order.status === "delivered" && (
          <Button variant="secondary" className="w-full">
            <span className="material-icons mr-2">receipt</span>
            Ver Comprobante
          </Button>
        )}
      </div>

      <BottomNavigation activeTab="orders" />
    </div>
  );
}