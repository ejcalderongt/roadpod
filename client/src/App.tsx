import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Dashboard } from "@/pages/dashboard";
import { Orders } from "@/pages/orders";
import { OrderDetail } from "@/pages/order-detail";
import { Delivery } from "@/pages/delivery";
import { RouteMap } from "@/pages/route";
import { Inventory } from "@/pages/inventory";
import { NotFound } from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        if (error?.status === 404) return false;
        return failureCount < 3;
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="delivery-route-theme">
        <Router>
          <div className="app-screen bg-background text-foreground">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderDetail />} />
              <Route path="/delivery/:id" element={<Delivery />} />
              <Route path="/route" element={<RouteMap />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Toaster />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
