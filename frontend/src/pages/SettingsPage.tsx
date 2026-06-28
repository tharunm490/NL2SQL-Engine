import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Sun, Moon } from "lucide-react";

export function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar name={user?.username || "U"} className="h-12 w-12 text-base" />
          <div>
            <p className="font-medium">{user?.username}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant={user?.role === "admin" ? "default" : "secondary"} className="mt-1">
              {user?.role}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <button
            onClick={toggle}
            className="flex items-center justify-between w-full rounded-md border border-input px-4 py-3 hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <div className="text-left">
                <p className="text-sm font-medium">{theme === "light" ? "Dark Mode" : "Light Mode"}</p>
                <p className="text-xs text-muted-foreground">
                  {theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
                </p>
              </div>
            </div>
            <div
              className={`w-10 h-6 rounded-full ${theme === "dark" ? "bg-primary" : "bg-input"} relative transition-colors`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow-sm transition-all ${
                  theme === "dark" ? "left-[18px]" : "left-0.5"
                }`}
              />
            </div>
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Backend</span>
            <span>FastAPI</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frontend</span>
            <span>React + TypeScript</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
