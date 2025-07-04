import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, User, Clock, Truck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LoginFormData {
  username: string;
  password: string;
  routeId: string;
  assistantName: string;
  startMileage: string;
}

// Mock data for demo - in real app this would come from API
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
  "Sin ayudante"
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
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Login user
      const loginResponse = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!loginResponse.ok) {
        throw new Error("Credenciales inválidas");
      }

      const { user } = await loginResponse.json();

      // Start route session
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

      // Store session data in localStorage
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("routeId", formData.routeId);
      localStorage.setItem("assistantName", formData.assistantName);
      localStorage.setItem("startMileage", formData.startMileage);

      toast({
        title: "Sesión iniciada",
        description: `Bienvenido ${user.name}`,
      });

      setLocation("/");
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
            {/* Login Credentials */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Usuario
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingrese su usuario"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingrese su contraseña"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            {/* Route Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <MapPin className="inline w-4 h-4 mr-1" />
                Seleccionar Ruta
              </Label>
              <Select
                value={formData.routeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, routeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una ruta" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoutes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assistant Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                <User className="inline w-4 h-4 mr-1" />
                Ayudante de Ruta
              </Label>
              <Select
                value={formData.assistantName}
                onValueChange={(value) =>
                  setFormData({ ...formData, assistantName: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un ayudante" />
                </SelectTrigger>
                <SelectContent>
                  {assistants.map((assistant) => (
                    <SelectItem key={assistant} value={assistant}>
                      {assistant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Mileage */}
            <div className="space-y-2">
              <Label htmlFor="startMileage" className="text-sm font-medium">
                <Clock className="inline w-4 h-4 mr-1" />
                Kilometraje Inicial
              </Label>
              <Input
                id="startMileage"
                type="number"
                step="0.1"
                placeholder="Ej: 12450.5"
                value={formData.startMileage}
                onChange={(e) =>
                  setFormData({ ...formData, startMileage: e.target.value })
                }
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              <strong>Demo:</strong> Usuario: 1, Contraseña: 1
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}