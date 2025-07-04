import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface BottomNavigationProps {
  activeTab?: string;
}

export function BottomNavigation({ activeTab }: BottomNavigationProps) {
  const location = useLocation();
  
  const getActiveTab = () => {
    if (activeTab) return activeTab;
    
    const path = location.pathname;
    if (path === "/" || path === "/dashboard") return "dashboard";
    if (path.startsWith("/orders")) return "orders";
    if (path.startsWith("/route")) return "route";
    if (path.startsWith("/inventory")) return "inventory";
    return "dashboard";
  };

  const currentTab = getActiveTab();

  const NavButton = ({ 
    to, 
    icon, 
    label, 
    tabName 
  }: { 
    to: string; 
    icon: string; 
    label: string; 
    tabName: string; 
  }) => {
    const isActive = currentTab === tabName;
    
    return (
      <Button
        asChild
        variant="ghost"
        className={`flex flex-col items-center p-2 h-auto ${
          isActive ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <Link to={to}>
          <span className="material-icons text-sm">{icon}</span>
          <span className={`text-xs ${isActive ? "font-medium" : ""}`}>{label}</span>
        </Link>
      </Button>
    );
  };

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-card border-t shadow-lg">
      <div className="flex items-center justify-around py-2">
        <NavButton to="/" icon="dashboard" label="Inicio" tabName="dashboard" />
        <NavButton to="/orders" icon="list_alt" label="Pedidos" tabName="orders" />
        <NavButton to="/route" icon="map" label="Ruta" tabName="route" />
        <NavButton to="/inventory" icon="inventory" label="Inventario" tabName="inventory" />
        <NavButton to="/profile" icon="person" label="Perfil" tabName="profile" />
      </div>
    </div>
  );
}
