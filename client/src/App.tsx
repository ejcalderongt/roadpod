import { useAuth } from "@/contexts/auth-context";
import { Dashboard } from "@/pages/dashboard";
import { Orders } from "@/pages/orders";
import { OrderDetail } from "@/pages/order-detail";
import { Delivery } from "@/pages/delivery";
import { RouteMap } from "@/pages/route";
import { Inventory } from "@/pages/inventory";
import { Profile } from "@/pages/profile";
import { NotFound } from "@/pages/not-found";
import { Login } from "@/pages/login";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

import { Route, Switch } from "wouter";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Crear instancia de QueryClient
const queryClient = new QueryClient();

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-screen bg-background text-foreground">
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/orders" component={Orders} />
        <Route path="/orders/:id" component={OrderDetail} />
        <Route path="/delivery/:id" component={Delivery} />
        <Route path="/route" component={RouteMap} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="delivery-route-theme">
        <AppContent />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
