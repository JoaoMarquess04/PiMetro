import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "../../firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";

type Props = { children: React.ReactNode };

export default function RequireAuth({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="p-4">Carregando...</div>;

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
