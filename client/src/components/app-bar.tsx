import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

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
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();

  const handleBack = () => {
    if (typeof showBack === "string") {
      navigate(showBack);
    } else {
      navigate(-1);
    }
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
        </div>

        {actions && actions}

        {showActions && (
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-primary-foreground"
            >
              <span className="material-icons">brightness_6</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground"
            >
              <span className="material-icons">sync</span>
            </Button>
            <div className="w-8 h-8 bg-primary-foreground/30 rounded-full flex items-center justify-center">
              <span className="text-primary text-sm font-medium">JD</span>
            </div>
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
