import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/contexts/auth-context";
import { ArrowLeft, User, Route, LogOut } from "lucide-react";

interface AppBarProps {
  title: string;
  subtitle?: string | React.ReactNode;
  showBack?: string | boolean;
  showActions?: boolean;
  showFilter?: boolean;
  showMenu?: boolean;
  className?: string;
  actions?: React.ReactNode;
}

export function AppBar({
  title,
  subtitle,
  showBack,
  showActions,
  showFilter,
  showMenu,
  className = "bg-primary",
  actions,
}: AppBarProps) {
  const [, navigate] = useLocation();
  const { toggleTheme } = useTheme();
  const { user, routeInfo, logout } = useAuth();

  const handleBack = () => {
    if (typeof showBack === "string") {
      navigate(showBack);
    } else {
      window.history.back();
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className={`${className} text-primary-foreground px-4 py-4 shadow-lg`}>
      <div className="flex items-center">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="text-primary-foreground mr-3"
          >
            <span className="material-icons">arrow_back</span>
          </Button>
        )}
        
        <div className="flex-1">
          <h1 className="text-xl font-medium">{title}</h1>
          {subtitle && (
            <div className="text-primary-foreground/80 text-sm">
              {subtitle}
            </div>
          )}
          
          {/* User and Route Info */}
          {user && (
            <div className="mt-1 text-primary-foreground/90 text-xs flex items-center space-x-4">
              <div className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                <span>{user.name}</span>
              </div>
              {routeInfo && (
                <div className="flex items-center">
                  <Route className="w-3 h-3 mr-1" />
                  <span>{routeInfo.routeName || `Ruta ${routeInfo.routeId}`}</span>
                </div>
              )}
              {routeInfo?.assistantName && (
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  <span>Ayudante: {routeInfo.assistantName}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {actions && actions}

        {showActions && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-primary-foreground"
            >
              <span className="material-icons">brightness_6</span>
            </Button>
            
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-primary-foreground"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground"
            >
              <span className="material-icons">sync</span>
            </Button>
            <Link href="/profile">
              <div className="w-8 h-8 bg-primary-foreground/30 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-foreground/40 transition-colors">
                <span className="text-primary text-sm font-medium">
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'JD'}
                </span>
              </div>
            </Link>
          </div>
        )}

        {showFilter && (
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground"
          >
            <span className="material-icons">filter_list</span>
          </Button>
        )}

        {showMenu && (
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground"
          >
            <span className="material-icons">more_vert</span>
          </Button>
        )}
      </div>
    </div>
  );
}
