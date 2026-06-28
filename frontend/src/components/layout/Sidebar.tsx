import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/utils/cn";
import {
  LayoutDashboard, Database, Terminal, History, Shield, Users,
  Settings, LogOut, Sun, Moon,
} from "lucide-react";

const adminLinks = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Database, label: "Databases", path: "/databases" },
  { icon: Users, label: "Users", path: "/users" },
  { icon: Terminal, label: "Query", path: "/query" },
  { icon: History, label: "Query History", path: "/query-history" },
  { icon: Shield, label: "Audit Logs", path: "/audit-logs" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const analystLinks = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Terminal, label: "Query", path: "/query" },
  { icon: History, label: "Query History", path: "/query-history" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggle } = useTheme();
  const links = isAdmin ? adminLinks : analystLinks;

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-60 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center gap-3 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Terminal className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold">AI SQL Assistant</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3 space-y-2">
        <button
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>

        {user && (
          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            <Avatar name={user.username} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
