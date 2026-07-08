import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Nav from "@/components/Nav";

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      toast.success("Account created — welcome!");
      navigate("/templates");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Sign-up failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Nav variant="landing" />
      <div className="mx-auto flex max-w-md flex-col px-6 py-20">
        <div className="mb-10 text-center">
          <span className="chip-label">Create account</span>
          <h1 className="font-display mt-3 text-4xl">Begin your first invite</h1>
          <p className="mt-2 text-sm text-stone-600">
            Just an email and password — no credit card required.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-5 rounded-2xl border border-stone-200 bg-white p-8"
          data-testid="register-form"
        >
          <div>
            <Label htmlFor="name" className="chip-label">Full name</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 rounded-lg"
              data-testid="register-name-input"
            />
          </div>
          <div>
            <Label htmlFor="email" className="chip-label">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 rounded-lg"
              data-testid="register-email-input"
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
              data-testid="register-password-input"
            />
            <p className="mt-1 text-xs text-stone-500">At least 6 characters.</p>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#1A1A1A] py-6 text-white hover:bg-[#D97757]"
            data-testid="register-submit-btn"
          >
            {loading ? "Creating..." : "Create account"}
          </Button>

          <div className="pt-2 text-center text-sm text-stone-600">
            Already a member?{" "}
            <Link to="/login" className="underline hover:text-[#D97757]" data-testid="register-to-login-link">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
