import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Upload, Receipt, Target, BarChart3, Home } from "lucide-react";

export const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    return location.pathname === path;
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors">
              <Home className="h-5 w-5 text-yellow-500" />
            </div>
          </Link>
          
          <div className="flex items-center gap-8">
            <Button
              variant={isActive("/") ? "default" : "ghost"}
              asChild
              className={isActive("/") ? "gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700" : "gap-2"}
            >
              <Link to="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button
              variant={isActive("/upload") ? "default" : "ghost"}
              asChild
              className={isActive("/upload") ? "gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700" : "gap-2"}
            >
              <Link to="/upload">
                <Upload className="h-4 w-4" />
                Upload
              </Link>
            </Button>
            <Button
              variant={isActive("/transactions") ? "default" : "ghost"}
              asChild
              className={isActive("/transactions") ? "gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700" : "gap-2"}
            >
              <Link to="/transactions">
                <Receipt className="h-4 w-4" />
                Transactions
              </Link>
            </Button>
            <Button
              variant={isActive("/budgets") ? "default" : "ghost"}
              asChild
              className={isActive("/budgets") ? "gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700" : "gap-2"}
            >
              <Link to="/budgets">
                <Target className="h-4 w-4" />
                Budgets
              </Link>
            </Button>
            <Button
              variant={isActive("/analytics") ? "default" : "ghost"}
              asChild
              className={isActive("/analytics") ? "gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700" : "gap-2"}
            >
              <Link to="/analytics">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
