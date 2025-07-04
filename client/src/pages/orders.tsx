import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { StatusBar } from "@/components/status-bar";
import { AppBar } from "@/components/app-bar";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: string;
  customer: {
    name: string;
    contact: string;
    address: string;
    phone: string;
    schedule: string;
  };
  items: any[];
  scheduledDate: string;
}

export function Orders() {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders", filter],
    queryFn: () => {
      const params = new URLSearchParams({ driverId: "1" });
      if (filter !== "all") params.append("status", filter);
      return fetch(`/api/orders?${params}`).then(res => res.json());
    },
  });

  const filteredOrders = orders?.filter(order =>
    order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="status-pending">Pendiente</Badge>;
      case "delivered":
        return <Badge className="status-delivered">Entregado</Badge>;
      case "not_delivered":
        return <Badge className="status-not-delivered">No Entregado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  return (
    <div className="min-h-screen bg-background">
      <StatusBar />
      
      <AppBar 
        title="Pedidos del Día"
        showBack="/dashboard"
        showFilter
      />

      {/* Search Bar */}
      <div className="px-4 pb-4">
        <div className="bg-primary/20 rounded-lg px-3 py-2 flex items-center">
          <span className="material-icons text-primary mr-2">search</span>
          <Input
            type="text"
            placeholder="Buscar cliente o pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:ring-0 placeholder:text-primary/70"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="p-4 flex space-x-2 overflow-x-auto">
        <Button
          variant={filter === "all" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("all")}
          className="whitespace-nowrap"
        >
          Todos ({orders?.length || 0})
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("pending")}
          className="whitespace-nowrap"
        >
          Pendientes ({orders?.filter(o => o.status === "pending").length || 0})
        </Button>
        <Button
          variant={filter === "delivered" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("delivered")}
          className="whitespace-nowrap"
        >
          Entregados ({orders?.filter(o => o.status === "delivered").length || 0})
        </Button>
        <Button
          variant={filter === "not_delivered" ? "default" : "secondary"}
          size="sm"
          onClick={() => setFilter("not_delivered")}
          className="whitespace-nowrap"
        >
          No Entregados ({orders?.filter(o => o.status === "not_delivered").length || 0})
        </Button>
      </div>

      {/* Orders List */}
      <div className="px-4 pb-20">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8">
            <span className="material-icons text-4xl text-muted-foreground mb-2">inbox</span>
            <p className="text-muted-foreground">No se encontraron pedidos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium">{order.customer.name}</h3>
                      <p className="text-muted-foreground text-sm">{order.customer.contact}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Pedido #</p>
                      <p className="font-medium">{order.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor Total</p>
                      <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Productos</p>
                      <p className="font-medium">{order.items?.length || 0} items</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {order.status === "delivered" ? "Entregado" : "Horario"}
                      </p>
                      <p className="font-medium">{order.customer.schedule}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-muted-foreground text-sm mb-3">
                    <span className="material-icons text-sm">location_on</span>
                    <span>{order.customer.address}</span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button asChild className="flex-1">
                      <Link to={`/orders/${order.id}`}>Ver Detalles</Link>
                    </Button>
                    <Button variant="outline" size="icon" className="touch-target">
                      <span className="material-icons">map</span>
                    </Button>
                    <Button variant="outline" size="icon" className="touch-target">
                      <span className="material-icons">call</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        size="icon"
        className="fixed bottom-20 right-6 w-14 h-14 bg-success text-success-foreground rounded-full shadow-lg"
      >
        <span className="material-icons">qr_code_scanner</span>
      </Button>

      <BottomNavigation activeTab="orders" />
    </div>
  );
}
