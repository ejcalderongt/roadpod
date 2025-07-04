import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StatusBar } from "@/components/status-bar";
import { AppBar } from "@/components/app-bar";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface InventoryItem {
  id: number;
  quantity: number;
  reservedQuantity: number;
  product: {
    id: number;
    name: string;
    code: string;
    category: string;
    price: string;
  };
}

interface InventorySummary {
  totalProducts: number;
  availableProducts: number;
  lowStockProducts: number;
}

export function Inventory() {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: inventory, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
    queryFn: () => fetch("/api/inventory?driverId=1").then(res => res.json()),
  });

  const updateInventoryMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, driverId: 1, quantity }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Inventario actualizado",
        description: "El stock ha sido actualizado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el inventario.",
        variant: "destructive",
      });
    },
  });

  const filteredInventory = inventory?.filter(item => {
    const matchesSearch = item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === "all") return matchesSearch;
    if (filter === "low_stock") return matchesSearch && item.quantity <= 10;
    return matchesSearch && item.product.category?.toLowerCase() === filter.toLowerCase();
  }) || [];

  const getInventorySummary = (): InventorySummary => {
    if (!inventory) return { totalProducts: 0, availableProducts: 0, lowStockProducts: 0 };
    
    return {
      totalProducts: inventory.length,
      availableProducts: inventory.filter(item => item.quantity > 0).length,
      lowStockProducts: inventory.filter(item => item.quantity <= 10).length,
    };
  };

  const getStockStatus = (quantity: number) => {
    if (quantity <= 5) {
      return { color: "bg-error/20 text-error", label: "Stock Crítico" };
    } else if (quantity <= 10) {
      return { color: "bg-warning/20 text-warning", label: "Stock Bajo" };
    } else if (quantity <= 20) {
      return { color: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300", label: "Stock Medio" };
    }
    return { color: "bg-success/20 text-success", label: "Stock OK" };
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const summary = getInventorySummary();

  return (
    <div className="min-h-screen bg-background">
      <StatusBar />
      
      <AppBar 
        title="Inventario de Ruta"
        showBack="/"
        actions={
          <Button variant="ghost" size="icon" className="text-primary-foreground">
            <span className="material-icons">qr_code_scanner</span>
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="px-4 pb-4">
        <div className="bg-primary/20 rounded-lg px-3 py-2 flex items-center">
          <span className="material-icons text-primary mr-2">search</span>
          <Input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:ring-0 placeholder:text-primary/70"
          />
        </div>
      </div>

      <div className="p-4 pb-20">
        {/* Inventory Summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-medium">{summary.totalProducts}</p>
              <p className="text-muted-foreground text-sm">Total Productos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-medium text-success">{summary.availableProducts}</p>
              <p className="text-muted-foreground text-sm">Disponibles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-medium text-error">{summary.lowStockProducts}</p>
              <p className="text-muted-foreground text-sm">Stock Bajo</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Categories */}
        <div className="flex space-x-2 overflow-x-auto mb-4">
          <Button
            variant={filter === "all" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter("all")}
            className="whitespace-nowrap"
          >
            Todos
          </Button>
          <Button
            variant={filter === "aceites" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter("aceites")}
            className="whitespace-nowrap"
          >
            Aceites
          </Button>
          <Button
            variant={filter === "granos" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter("granos")}
            className="whitespace-nowrap"
          >
            Granos
          </Button>
          <Button
            variant={filter === "condimentos" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter("condimentos")}
            className="whitespace-nowrap"
          >
            Condimentos
          </Button>
          <Button
            variant={filter === "low_stock" ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter("low_stock")}
            className="whitespace-nowrap"
          >
            Stock Bajo
          </Button>
        </div>

        {/* Inventory List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="text-center py-8">
            <span className="material-icons text-4xl text-muted-foreground mb-2">inventory_2</span>
            <p className="text-muted-foreground">No se encontraron productos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInventory.map((item) => {
              const stockStatus = getStockStatus(item.quantity);
              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <span className="material-icons text-muted-foreground">inventory_2</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.name}</h4>
                        <p className="text-muted-foreground text-sm">{item.product.code}</p>
                        <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                          <span>Precio: {formatCurrency(item.product.price)}</span>
                          <span>Categoría: {item.product.category || "General"}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${stockStatus.color} font-medium mb-1`}>
                          {item.quantity} unidades
                        </Badge>
                        <p className="text-xs text-muted-foreground">{stockStatus.label}</p>
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex space-x-2 mt-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const newQuantity = prompt(`Ajustar stock para ${item.product.name}:`, item.quantity.toString());
                          if (newQuantity && !isNaN(parseInt(newQuantity))) {
                            updateInventoryMutation.mutate({
                              productId: item.product.id,
                              quantity: parseInt(newQuantity),
                            });
                          }
                        }}
                        disabled={updateInventoryMutation.isPending}
                      >
                        Ajustar Stock
                      </Button>
                      <Button variant="outline" size="icon">
                        <span className="material-icons text-sm">qr_code</span>
                      </Button>
                    </div>
                    
                    {item.quantity <= 10 && (
                      <Button
                        variant="secondary"
                        className="w-full mt-2 bg-warning text-warning-foreground"
                        disabled={updateInventoryMutation.isPending}
                      >
                        Solicitar Reposición
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        size="icon"
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full shadow-lg"
      >
        <span className="material-icons">add</span>
      </Button>

      <BottomNavigation activeTab="inventory" />
    </div>
  );
}
