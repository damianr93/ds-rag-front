import { Route, Routes } from "react-router-dom";
import { PublicRouters } from "./PublicRouter";
import { PrivateRouters } from "./PrivateRouters";
import { UserRoutes } from "./UserRoutes";
import { Login } from "../../auth/pages/Login";

export const AppRouter = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route
        path="/login"
        element={
          <PublicRouters>
            <Login />
          </PublicRouters>
        }
      />

      {/* Rutas privadas - CAMBIO IMPORTANTE: sin /* */}
      <Route
        path="/*"
        element={
          <PrivateRouters>
            <UserRoutes />
          </PrivateRouters>
        }
      />
    </Routes>
  );
};
