import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth.jsx";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";

export default function Nav({ variant = "app" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/");
  };

  // Same links for the desktop bar and the phone menu.
  const links = user
    ? [
        { to: "/dashboard", label: "My Invites", testid: "nav-dashboard-link" },
        { to: "/templates", label: "Templates", testid: "nav-templates-link" },
      ]
    : variant === "landing"
      ? [
          { href: "#features", label: "Features" },
          { href: "#gallery", label: "Gallery" },
        ]
      : [];
  const renderLink = (l, className, onClick) =>
    l.to ? (
      <Link key={l.label} to={l.to} className={className} onClick={onClick} data-testid={l.testid}>{l.label}</Link>
    ) : (
      <a key={l.label} href={l.href} className={className} onClick={onClick}>{l.label}</a>
    );

  return (
    <header
      className="sticky top-0 z-30 border-b border-stone-200 bg-[#FAF9F6]/85 backdrop-blur"
      data-testid="app-nav"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-10">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2" data-testid="nav-logo">
          <span
            className="inline-block h-8 w-8 rounded-full"
            style={{ background: "radial-gradient(circle at 30% 30%, #E7B98A, #D97757 55%, #8A4A31)" }}
          />
          <span className="font-display text-2xl tracking-tight">InviteCraft</span>
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          {links.map((l) => renderLink(l, "chip-label hover:text-[#D97757] smooth"))}
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
                className="hidden rounded-full sm:inline-flex"
                data-testid="nav-logout-btn"
              >
                <LogOut className="mr-1.5 h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block">
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
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-full p-2 text-stone-700 hover:bg-stone-100 sm:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            data-testid="nav-menu-btn"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Phone menu */}
      {menuOpen && (
        <nav className="border-t border-stone-200 bg-[#FAF9F6] px-4 pb-4 pt-2 sm:hidden" data-testid="nav-mobile-menu">
          {links.map((l) => renderLink(l, "block rounded-lg px-3 py-3 text-base hover:bg-stone-100", () => setMenuOpen(false)))}
          {user ? (
            <>
              <div className="px-3 pt-3 text-xs text-stone-500">Signed in as {user.name}</div>
              <button onClick={handleLogout} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-base hover:bg-stone-100">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-3 text-base hover:bg-stone-100">
              Sign in
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
