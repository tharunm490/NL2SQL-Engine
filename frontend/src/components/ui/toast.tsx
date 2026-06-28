import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: theme === "dark" ? "#18181b" : "#ffffff",
          color: theme === "dark" ? "#fafafa" : "#09090b",
          border: `1px solid ${theme === "dark" ? "#27272a" : "#e2e8f0"}`,
        },
      }}
    />
  );
}
