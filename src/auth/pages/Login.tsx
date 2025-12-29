import React, { useState } from "react";
import { Lock, User, Eye, EyeOff, Building2, Bot, UserPlus, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom"; 
import { toast } from "react-toastify";
import { apiFetch } from "../../shared/utils/api";
import { saveToken } from "../../shared/utils/storageToken";

type LoginResponse = {
  success: boolean;
  data?: {
    user: {
      id: number;
      name: string;
      last_name: string;
      division: string;
      email: string;
    };
    token: string;
  };
  message?: string;
};

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [credentials, setCredentials] = useState({
    email: "", // Para mi yo del futuro: en backend el login es por email, no "username".
    password: "",
    name: "",
    lastName: "",
    division: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        body: {
          email: credentials.email.trim(),
          password: credentials.password,
          name: credentials.name.trim(),
          lastName: credentials.lastName.trim(),
          division: credentials.division.trim(),
        },
      });

      if (res?.success) {
        toast.success("Usuario registrado exitosamente. Espera a que un administrador active tu cuenta.", { 
          position: "top-right" 
        });
        setIsRegisterMode(false);
        setCredentials({
          email: credentials.email,
          password: "",
          name: "",
          lastName: "",
          division: "",
        });
      }
    } catch (err: any) {
      console.error("Register error:", err);
      toast.error(err?.message || "Error al registrarse", {
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // evitar refresh
    if (isLoading) return;

    setIsLoading(true);
    try {
      // POST /auth/login (ajustá el path según tu server, p.ej. /api/v1/auth/login)
      const res = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: {
          email: credentials.email.trim(),
          password: credentials.password,
        },
      });

      const token = res?.data?.token;
      const name = res?.data?.user.name;
      if (!token || !name) throw new Error("No se recibió token o username del servidor");

      saveToken(token, name);
      toast.success("Bienvenido 👋", { position: "top-right" });

      navigate("/home");
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err?.message || "Error al iniciar sesión", {
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (isRegisterMode) {
      submitRegister(e);
    } else {
      submitLogin(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            RAG Interno
          </h1>
          <p className="text-slate-400 text-sm">Sistema de RAG para tu documentación</p>
        </div>

        {/* Toggle Login/Register */}
        <div className="flex bg-slate-700/50 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setIsRegisterMode(false)}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg transition-all ${
              !isRegisterMode
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => setIsRegisterMode(true)}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg transition-all ${
              isRegisterMode
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Registrarse
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="email"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="usuario@empresa.com"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Campos de registro */}
          {isRegisterMode && (
            <>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Nombre
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={credentials.name}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Tu nombre"
                    autoComplete="given-name"
                    required={isRegisterMode}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Apellido
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={credentials.lastName}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Tu apellido"
                    autoComplete="family-name"
                    required={isRegisterMode}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  División
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value={credentials.division}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, division: e.target.value }))
                    }
                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Tu división"
                    autoComplete="organization"
                    required={isRegisterMode}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                value={credentials.password}
                onChange={(e) =>
                  setCredentials((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !credentials.email || !credentials.password || (isRegisterMode && (!credentials.name || !credentials.lastName || !credentials.division))}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-blue-500/25 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span className="ml-2">
                  {isRegisterMode ? "Registrando..." : "Iniciando sesión..."}
                </span>
              </div>
            ) : (
              isRegisterMode ? "Registrarse" : "Iniciar Sesión"
            )}
          </button>
        </form>

        {isRegisterMode && (
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
            <p className="text-center text-sm text-blue-300">
              <UserPlus className="inline w-4 h-4 mr-1" />
              Tu cuenta será activada por un administrador
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-700">
          <p className="text-center text-xs text-slate-500">
            <Building2 className="inline w-4 h-4 mr-1" />
            Sistema Interno
          </p>
        </div>
      </div>
    </div>
  );
};
