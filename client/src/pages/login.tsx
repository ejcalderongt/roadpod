import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, User, Clock, Truck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

interface LoginFormData {
  username: string;
  password: string;
  routeId: string;
  assistantName: string;
  startMileage: string;
}

const availableRoutes = [
  { id: "1", name: "Ruta Norte - Zona Comercial", area: "Norte" },
  { id: "2", name: "Ruta Sur - Zona Industrial", area: "Sur" },
  { id: "3", name: "Ruta Centro - Comercial", area: "Centro" },
];

const assistants = [
  "María González",
  "Carlos Rodríguez",
  "Ana López",
  "Luis Hernández",
  "Sin ayudante",
];

export function Login() {
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
    routeId: "",
    assistantName: "",
    startMileage: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login, setRouteInfo } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const { user } = response;

      if (!user) {
        throw new Error("Credenciales inválidas");
      }

      // Actualizar el estado global de autenticación
      login(user);

      // Registrar información de la ruta
      setRouteInfo({
        routeId: formData.routeId,
        routeName: availableRoutes.find(r => r.id === formData.routeId)?.name || "",
        assistantName: formData.assistantName,
        startMileage: formData.startMileage,
      });

      // Llamar al backend para iniciar sesión de ruta (opcional)
      if (formData.routeId && formData.startMileage) {
        await apiRequest("/api/route-sessions/start", {
          method: "POST",
          body: JSON.stringify({
            routeId: parseInt(formData.routeId),
            driverId: user.id,
            assistantName: formData.assistantName,
            startMileage: formData.startMileage,
          }),
        });
      }

      toast({
        title: "Sesión iniciada",
        description: `Bienvenido ${user.name}`,
      });

      navigate("/");

    } catch (error) {
      toast({
        title: "Error de inicio de sesión",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">DeliveryRoute</CardTitle>
          <CardDescription>
            Sistema de gestión de rutas de entrega
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Ingrese su usuario"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Ingrese su contraseña"
                required
              />
            </div>

            <div className="space-y-2">
              <Label><MapPin className="inline w-4 h-4 mr-1" />Seleccionar Ruta</Label>
              <Select
                value={formData.routeId}
                onValueChange={(value) => setFormData({ ...formData, routeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una ruta" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoutes.map(route => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label><User className="inline w-4 h-4 mr-1" />Ayudante de Ruta</Label>
              <Select
                value={formData.assistantName}
                onValueChange={(value) => setFormData({ ...formData, assistantName: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un ayudante" />
                </SelectTrigger>
                <SelectContent>
                  {assistants.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startMileage"><Clock className="inline w-4 h-4 mr-1" />Kilometraje Inicial</Label>
              <Input
                id="startMileage"
                type="number"
                step="0.1"
                placeholder="Ej: 12450.5"
                value={formData.startMileage}
                onChange={(e) => setFormData({ ...formData, startMileage: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center text-sm text-gray-600 dark:text-gray-400">
            <strong>Demo:</strong> Usuario: 1, Contraseña: 1
          </div>
        </CardContent>
      </Card>
    </div>
  );
}