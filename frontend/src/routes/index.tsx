import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { RoleGate } from "@/components/common/RoleGate";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { QueryPage } from "@/pages/QueryPage";
import { QueryHistoryPage } from "@/pages/QueryHistoryPage";
import { DatabasesPage } from "@/pages/DatabasesPage";
import { UsersPage } from "@/pages/UsersPage";
import { AuditLogsPage } from "@/pages/AuditLogsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { AboutPage } from "@/pages/AboutPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "query", element: <QueryPage /> },
      { path: "query-history", element: <QueryHistoryPage /> },
      { path: "databases", element: <DatabasesPage /> },
      {
        path: "users",
        element: (
          <RoleGate roles={["admin"]}>
            <UsersPage />
          </RoleGate>
        ),
      },
      {
        path: "audit-logs",
        element: (
          <RoleGate roles={["admin"]}>
            <AuditLogsPage />
          </RoleGate>
        ),
      },
      { path: "about", element: <AboutPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
