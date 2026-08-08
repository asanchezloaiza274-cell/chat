import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ChatProvider } from "../../context/ChatContext";
import { FullScreenLoader } from "../ui/FullScreenLoader";

export function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ChatProvider>
      <Outlet />
    </ChatProvider>
  );
}
