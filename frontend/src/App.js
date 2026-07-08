import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth.jsx";
import { Toaster } from "sonner";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Templates from "@/pages/Templates";
import Editor from "@/pages/Editor";
import PublicView from "@/pages/PublicView";
import Guests from "@/pages/Guests";

function Protected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/i/:shareId" element={<PublicView />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/templates" element={<Protected><Templates /></Protected>} />
            <Route path="/editor/:id" element={<Protected><Editor /></Protected>} />
            <Route path="/invite/:id/guests" element={<Protected><Guests /></Protected>} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors closeButton />
      </AuthProvider>
    </div>
  );
}

export default App;
