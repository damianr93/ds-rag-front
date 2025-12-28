import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

// Para mi yo del futuro: si querés permitir login aunque ya esté logueado (para cambiar usuario),
// sacá la redirección. Hoy preferimos mandar a /home si ya hay token.
export const PublicRouters = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem("auth_token");
  const isAuth = Boolean(token);

  return isAuth ? <Navigate to="/home" replace /> : <>{children}</>;
};