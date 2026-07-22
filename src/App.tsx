import { useState } from "react";
import { Login } from "./components/Login";
import { AdminDashboard } from "./components/AdminDashboard";
import { SuperAdminDashboard } from "./components/SuperAdminDashboard";
import { storage } from "./storage";

type Role = "alpha" | "superadmin" | null;

export default function App() {
  const [role, setRole] = useState<Role>(() => storage.getRole());

  function login(r: "alpha" | "superadmin") {
    storage.setRole(r);
    setRole(r);
  }
  function logout() {
    storage.setRole(null);
    setRole(null);
  }

  if (!role) return <Login onLogin={login} />;
  if (role === "superadmin") return <SuperAdminDashboard onLogout={logout} />;
  return <AdminDashboard onLogout={logout} />;
}
