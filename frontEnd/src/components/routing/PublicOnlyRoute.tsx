import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FullScreenLoader } from "../ui/FullScreenLoader";

export function PublicOnlyRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <FullScreenLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return <Outlet />;
}
