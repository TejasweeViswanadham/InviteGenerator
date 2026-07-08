import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth.jsx";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Nav({ variant = "app" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header
      className="sticky top-0 z-30 border-b border-stone-200 bg-[#FAF9F6]/85 backdrop-blur"
      data-testid="app-nav"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2" data-testid="nav-logo">
          <span
            className="inline-block h-8 w-8 rounded-full"
            style={{ background: "radial-gradient(circle at 30% 30%, #E7B98A, #D97757 55%, #8A4A31)" }}
          />
          <span className="font-display text-2xl tracking-tight">InviteCraft</span>
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="chip-label hover:text-[#D97757] smooth"
                data-testid="nav-dashboard-link"
              >
                My Invites
              </Link>
              <Link
                to="/templates"
                className="chip-label hover:text-[#D97757] smooth"
                data-testid="nav-templates-link"
              >
                Templates
              </Link>
            </>
          ) : variant === "landing" ? (
            <>
              <a href="#features" className="chip-label hover:text-[#D97757] smooth">Features</a>
              <a href="#gallery" className="chip-label hover:text-[#D97757] smooth">Gallery</a>
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-stone-600 sm:inline" data-testid="nav-user-name">
                {user.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="rounded-full"
                data-testid="nav-logout-btn"
              >
                <LogOut className="mr-1.5 h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="rounded-full" data-testid="nav-login-btn">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  size="sm"
                  className="rounded-full bg-[#1A1A1A] px-5 text-white hover:bg-[#D97757]"
                  data-testid="nav-register-btn"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
