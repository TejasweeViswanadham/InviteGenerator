import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Nav from "@/components/Nav";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Nav variant="landing" />
      <div className="mx-auto flex max-w-md flex-col px-6 py-20">
        <div className="mb-10 text-center">
          <span className="chip-label">Sign in</span>
          <h1 className="font-display mt-3 text-4xl">Welcome back</h1>
          <p className="mt-2 text-sm text-stone-600">
            Continue building your beautiful invitations.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-5 rounded-2xl border border-stone-200 bg-white p-8"
          data-testid="login-form"
        >
          <div>
            <Label htmlFor="email" className="chip-label">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 rounded-lg"
              data-testid="login-email-input"
            />
          </div>
          <div>
            <Label htmlFor="password" className="chip-label">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 rounded-lg"
              data-testid="login-password-input"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#1A1A1A] py-6 text-white hover:bg-[#D97757]"
            data-testid="login-submit-btn"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>

          <div className="pt-2 text-center text-sm text-stone-600">
            No account yet?{" "}
            <Link to="/register" className="underline hover:text-[#D97757]" data-testid="login-to-register-link">
              Create one
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
