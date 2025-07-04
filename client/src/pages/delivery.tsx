import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { StatusBar } from "@/components/status-bar";
import { AppBar } from "@/components/app-bar";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface DeliveryItem {
  id: number;
  quantity: number;
  deliveredQuantity: number;
  price: string;
  totalAmount: string;
  partialReason?: string;
  product: {
    name: string;
    code: string;
  };
}

interface DeliveryOrder {
  id: number;
  orderNumber: string;
  totalAmount: string;
  customer: {
    name: string;
  };
  items: DeliveryItem[];
}

export function Delivery() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deliveryStep, setDeliveryStep] = useState("products");
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);
  const [signatureData, setSignatureData] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const { data: order, isLoading } = useQuery<DeliveryOrder>({
    queryKey: ["/api/orders", id],
    queryFn: () => fetch(`/api/orders/${id}`).then(res => res.json()),
  });

  const completeDeliveryMutation = useMutation({
    mutationFn: (deliveryData: any) => fetch("/api/delivery/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deliveryData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      navigate("/orders");
      toast({
        title: "Entrega completada",
        description: "El pedido ha sido entregado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo completar la entrega.",
        variant: "destructive",
      });
    },
  });

  // Initialize delivery items when order loads
  useState(() => {
    if (order && deliveryItems.length === 0) {
      setDeliveryItems(order.items.map(item => ({
        ...item,
        deliveredQuantity: item.quantity,
      })));
    }
  });

  const updateDeliveredQuantity = (itemId: number, quantity: number) => {
    setDeliveryItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, deliveredQuantity: quantity } : item
      )
    );
  };

  const updatePartialReason = (itemId: number, reason: string) => {
    setDeliveryItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, partialReason: reason } : item
      )
    );
  };

  const getTotalDeliveredAmount = () => {
    return deliveryItems.reduce((total, item) => {
      const unitPrice = parseFloat(item.price);
      return total + (unitPrice * item.deliveredQuantity);
    }, 0);
  };

  const getTotalItemsOrdered = () => {
    return deliveryItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalItemsDelivered = () => {
    return deliveryItems.reduce((total, item) => total + item.deliveredQuantity, 0);
  };

  const handleCompleteDelivery = () => {
    const deliveryData = {
      orderId: parseInt(id!),
      deliveredAmount: getTotalDeliveredAmount().toString(),
      signatureData,
      photoUrl,
      items: deliveryItems,
    };

    completeDeliveryMutation.mutate(deliveryData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <StatusBar />
        <AppBar title="Cargando..." showBack={`/orders/${id}`} />
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StatusBar />
      
      <AppBar 
        title="Proceso de Entrega"
        subtitle={order.customer.name}
        showBack={`/orders/${id}`}
        className="bg-success"
      />

      {/* Delivery Steps */}
      <div className="p-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              deliveryStep === "products" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
            }`}>
              1
            </div>
            <span className="text-xs mt-1">Productos</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${deliveryStep !== "products" ? "bg-success" : "bg-muted"}`}></div>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              deliveryStep === "signature" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
            }`}>
              2
            </div>
            <span className="text-xs mt-1">Firma</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${deliveryStep === "receipt" ? "bg-success" : "bg-muted"}`}></div>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              deliveryStep === "receipt" ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
            }`}>
              3
            </div>
            <span className="text-xs mt-1">Comprobante</span>
          </div>
        </div>
      </div>

      <div className="p-4 pb-20">
        {deliveryStep === "products" && (
          <>
            {/* Product Selection */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Confirmar Productos Entregados</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Selecciona los productos y cantidades entregadas
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deliveryItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start space-x-3 mb-3">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <span className="material-icons text-muted-foreground">inventory_2</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-muted-foreground text-sm">Pedido: {item.quantity} unidades</p>
                          <div className="bg-success/20 text-success px-2 py-1 rounded text-xs inline-block mt-1">
                            Stock disponible: 50
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Label className="text-sm font-medium">Cantidad entregada:</Label>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateDeliveredQuantity(item.id, Math.max(0, item.deliveredQuantity - 1))}
                          >
                            <span className="material-icons text-sm">remove</span>
                          </Button>
                          <Input
                            type="number"
                            value={item.deliveredQuantity}
                            onChange={(e) => updateDeliveredQuantity(item.id, parseInt(e.target.value) || 0)}
                            className="w-16 text-center"
                            min="0"
                            max={item.quantity}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateDeliveredQuantity(item.id, Math.min(item.quantity, item.deliveredQuantity + 1))}
                          >
                            <span className="material-icons text-sm">add</span>
                          </Button>
                        </div>
                        <div className="ml-auto">
                          <span className={`text-sm font-medium ${
                            item.deliveredQuantity === item.quantity ? "text-success" : "text-warning"
                          }`}>
                            {item.deliveredQuantity === item.quantity ? "✓ Completo" : "⚠ Parcial"}
                          </span>
                        </div>
                      </div>
                      
                      {item.deliveredQuantity < item.quantity && (
                        <div className="mt-3 p-3 bg-warning/10 rounded-lg">
                          <Label className="block text-sm font-medium mb-2">
                            Razón de entrega parcial:
                          </Label>
                          <Select onValueChange={(value) => updatePartialReason(item.id, value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar razón" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="stock_insufficient">Stock insuficiente</SelectItem>
                              <SelectItem value="damaged_product">Producto dañado</SelectItem>
                              <SelectItem value="customer_rejection">Cliente rechaza producto</SelectItem>
                              <SelectItem value="order_error">Error en pedido</SelectItem>
                              <SelectItem value="other">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Summary */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Resumen de Entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Productos pedidos:</span>
                    <span className="font-medium">{getTotalItemsOrdered()} unidades</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Productos entregados:</span>
                    <span className="font-medium">{getTotalItemsDelivered()} unidades</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Valor total pedido:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(order.totalAmount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor entregado:</span>
                    <span className="font-medium text-success">{formatCurrency(getTotalDeliveredAmount())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Camera for Photo Confirmation */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Foto de Confirmación (Opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  <span className="material-icons text-4xl text-muted-foreground mb-2">camera_alt</span>
                  <p className="text-muted-foreground text-sm mb-3">
                    Tomar foto de los productos entregados
                  </p>
                  <Button variant="secondary">
                    Abrir Cámara
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={() => setDeliveryStep("signature")}
              className="w-full bg-success text-success-foreground py-4 text-lg shadow-lg"
            >
              Continuar a Firma
              <span className="material-icons ml-3">arrow_forward</span>
            </Button>
          </>
        )}

        {deliveryStep === "signature" && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Firma del Cliente</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Solicite la firma del cliente para confirmar la recepción
                </p>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg h-48 bg-muted/30 flex items-center justify-center">
                  <p className="text-muted-foreground">Área de firma</p>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button variant="outline" className="flex-1">
                    Limpiar
                  </Button>
                  <Button 
                    onClick={() => setDeliveryStep("receipt")}
                    className="flex-1 bg-success text-success-foreground"
                  >
                    Continuar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {deliveryStep === "receipt" && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Comprobante de Entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-medium text-lg">{order.customer.name}</h3>
                    <p className="text-muted-foreground">Pedido #{order.orderNumber}</p>
                  </div>
                  
                  <div className="border-t border-b py-4">
                    <div className="space-y-2 text-sm">
                      {deliveryItems.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.product.name}</span>
                          <span>{item.deliveredQuantity} x {formatCurrency(parseFloat(item.price))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(getTotalDeliveredAmount())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleCompleteDelivery}
              disabled={completeDeliveryMutation.isPending}
              className="w-full bg-success text-success-foreground py-4 text-lg shadow-lg"
            >
              {completeDeliveryMutation.isPending ? "Completando..." : "Completar Entrega"}
            </Button>
          </>
        )}
      </div>

      <BottomNavigation activeTab="orders" />
    </div>
  );
}
