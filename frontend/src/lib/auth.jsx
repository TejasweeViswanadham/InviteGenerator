import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("ic_user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Any 401 from the API means the session is gone — drop the user so
    // protected pages redirect to /login instead of silently failing.
    const onUnauthorized = () => setUser(null);
    window.addEventListener("ic:unauthorized", onUnauthorized);

    // Re-validate a stored session on load. A 401 is handled by the API
    // interceptor; network errors (e.g. server waking up) keep the session.
    if (localStorage.getItem("ic_token")) {
      api.get("/auth/me")
        .then((r) => {
          setUser(r.data);
          localStorage.setItem("ic_user", JSON.stringify(r.data));
        })
        .catch(() => {});
    } else if (user) {
      setUser(null);
      localStorage.removeItem("ic_user");
    }
    return () => window.removeEventListener("ic:unauthorized", onUnauthorized);
    // eslint-disable-next-line
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("ic_token", data.token);
      localStorage.setItem("ic_user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      localStorage.setItem("ic_token", data.token);
      localStorage.setItem("ic_user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("ic_token");
    localStorage.removeItem("ic_user");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
