import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute } from "./components/routing/ProtectedRoute";
import { PublicOnlyRoute } from "./components/routing/PublicOnlyRoute";
import { OfflineBanner } from "./components/layout/OfflineBanner";
import { ChatLayout } from "./layouts/ChatLayout";
import { SettingsLayout } from "./layouts/SettingsLayout";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ChatIndex from "./pages/chat/ChatIndex";
import ChatWindow from "./pages/chat/ChatWindow";
import NewChat from "./pages/chat/NewChat";
import CreateGroup from "./pages/chat/CreateGroup";
import Profile from "./pages/profile/Profile";
import EditProfile from "./pages/profile/EditProfile";
import GlobalSearch from "./pages/search/GlobalSearch";
import AccountSettings from "./pages/settings/AccountSettings";
import AppearanceSettings from "./pages/settings/AppearanceSettings";
import NotificationsSettings from "./pages/settings/NotificationsSettings";
import PrivacySettings from "./pages/settings/PrivacySettings";
import SecuritySettings from "./pages/settings/SecuritySettings";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <OfflineBanner />
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<ChatLayout />}>
              <Route path="/chat" element={<ChatIndex />} />
              <Route path="/chat/:id" element={<ChatWindow />} />
              <Route path="/new-chat" element={<NewChat />} />
              <Route path="/new-group" element={<CreateGroup />} />
            </Route>

            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/search" element={<GlobalSearch />} />

            <Route path="/settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="account" replace />} />
              <Route path="account" element={<AccountSettings />} />
              <Route path="appearance" element={<AppearanceSettings />} />
              <Route path="notifications" element={<NotificationsSettings />} />
              <Route path="privacy" element={<PrivacySettings />} />
              <Route path="security" element={<SecuritySettings />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
