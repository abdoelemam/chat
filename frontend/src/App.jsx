import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { useAuthStore } from "./store/useAuthStore.js";
import { useChatStore } from "./store/useChatStore.js";
import { useThemeStore } from "./store/useThemeStore.js";
import { useCallStore } from "./store/useCallStore.js";

import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

import Navbar from "./components/common/Navbar.jsx";
import VoiceCallModal from "./components/call/VoiceCallModal.jsx";
import IncomingCallModal from "./components/call/IncomingCallModal.jsx";

function App() {
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore();
  const { theme } = useThemeStore();
  const { callStatus, setIncomingCall, endCall } = useCallStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (socket) {
      socket.on("incomingCall", (data) => {
        setIncomingCall({ ...data.from, signal: data.signal });
      });
      socket.on("callEnded", () => {
        endCall(false);
      });

      socket.on("groupUpdated", (updatedGroup) => {
        useChatStore.getState().updateConversationDetails(updatedGroup);
      });

      socket.on("leftGroup", ({ groupId }) => {
        useChatStore.getState().removeConversation(groupId);
      });

      return () => {
        socket.off("incomingCall");
        socket.off("callEnded");
        socket.off("groupUpdated");
        socket.off("leftGroup");
      };
    }
  }, [socket, setIncomingCall, endCall]);

  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div data-theme={theme} className="h-screen flex flex-col bg-base-300">
      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/register" element={!authUser ? <RegisterPage /> : <Navigate to="/" />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>

      <Toaster position="top-center" reverseOrder={false} />

      {callStatus === "receiving" && <IncomingCallModal />}
      {(callStatus === "calling" || callStatus === "inCall") && <VoiceCallModal />}
    </div>
  );
}

export default App;
