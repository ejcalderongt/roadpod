import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "react-router-dom";
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
  const [, navigate] = useLocation();
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
    return <div className="min-h-screen bg-background">Cargando...</div>;
  }

  if (!order) {
    return <div className="min-h-screen bg-background">Pedido no encontrado</div>;
  }

  return <div className="min-h-screen bg-background">{/* ...resto del UI */}</div>;
}