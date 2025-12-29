import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Menu,
  Search,
  LogOut,
  Building2,
  Bot,
  ChevronLeft,
  FileText,
  Lock,
  MessageSquare,
  Settings,
} from "lucide-react";
import { getUsername, removeToken } from "../../shared/utils/storageToken";
import { isUserAdmin } from "../../shared/utils/jwtHelper";
import {
  Route,
  Routes,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { ChatRagPage } from "../../chat-rag/pages/Home";
import { DocumentExplorerPage } from "../../document-explorer/pages/DocumentExplorer";
import { OAuthSuccessPage } from "../../document-explorer/pages/OAuthSuccess";
import { AdminPanelPage } from "../../admin/pages/AdminPanel";
import DisclaimerPopup from "../../shared/components/DisclaimerPopup";
import type { AppDispatch } from "../../store/store";
import {
  selectLoadingUserData,
  selectDisclaimerPopupVisible,
  selectIsFirstTime,
  hideDisclaimerPopup,
  showDisclaimerPopup,
} from "../../store/slices/disclaimer/disclaimerSlice";
import {
  fetchUserData,
  updateDisclaimerChecked,
} from "../../store/slices/disclaimer/disclaimer.thunks";

/**
 * Para mi yo del futuro:
 * - Todos los imports de router deben venir de 'react-router-dom' (no de 'react-router').
 * - Uso useLocation para que el sidebar se sincronice con la URL real (no un estado local).
 */

interface NavbarProps {
  user: string;
  onLogout: () => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  onShowReadme: () => void;
}

interface SidebarProps {
  collapsed: boolean;
  currentPath: string;
  onNavigate: (path: string) => void;
  disclaimerAccepted: boolean;
}

interface UserLayoutProps {
  children: React.ReactNode;
  user: string;
  onLogout: () => void;
  disclaimerAccepted: boolean;
}

// BinaryMessage component removed - logo placeholder for future company logo

const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onToggleSidebar,
  sidebarCollapsed,
  onShowReadme,
}) => (
  <nav className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 px-4 py-3 relative z-30">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
        >
          {sidebarCollapsed ? (
            <Menu className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">RAG Interno</h1>
            <p className="text-xs text-slate-400 hidden sm:block"></p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={onShowReadme}
          className="flex items-center space-x-2 bg-slate-700 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-all duration-200 group"
          title="Descargo de responsabilidades"
        >
          <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-sm hidden sm:inline">README</span>
        </button>
        <div className="hidden sm:flex items-center space-x-2 bg-slate-700/50 px-3 py-2 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-slate-300 text-sm">{user}</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center space-x-2 bg-slate-700 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-all duration-200 group"
        >
          <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span className="text-sm hidden sm:inline">Salir</span>
        </button>
      </div>
    </div>
  </nav>
);

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  currentPath,
  onNavigate,

}) => {
  // ✅ SEGURO: Decodificamos el JWT para obtener el rol real
  const isAdmin = isUserAdmin();
  
  console.log("🔍 Debug Sidebar:");
  console.log("isAdmin (desde JWT):", isAdmin);

  const menuItems = [
    {
      path: "/home",
      icon: MessageSquare,
      label: "Chat IA",
      enabled: true,
      description: "Conversación con documentos",
      color: "blue",
    },
    {
      path: "/documents",
      icon: Search,
      label: "Explorador",
      enabled: true,
      description: "Archivos y directorios",
      color: "blue",
    },
    {
      path: "/admin",
      icon: Settings,
      label: "Admin Panel",
      enabled: isAdmin,
      description: "Gestión de fuentes",
      color: "purple",
      adminOnly: true,
    },
  ] as const;

  const getItemColors = (
    item: (typeof menuItems)[number],
    isActive: boolean
  ) => {
    if (!item.enabled) return "text-slate-500 cursor-not-allowed opacity-50";

    if (isActive) {
      const colorMap: Record<string, string> = {
        blue: "bg-blue-600 text-white shadow-lg shadow-blue-500/25",
        green: "bg-green-600 text-white shadow-lg shadow-green-500/25",
        purple: "bg-purple-600 text-white shadow-lg shadow-purple-500/25",
        orange: "bg-orange-600 text-white shadow-lg shadow-orange-500/25",
      };
      return colorMap[item.color ?? ""] || "bg-slate-600 text-white shadow-lg";
    }

    return "text-slate-300 hover:bg-slate-700 hover:text-white";
  };

  return (
    <div
      className={`bg-slate-800/95 backdrop-blur-sm border-r border-slate-700 transition-all duration-300 ${
        collapsed ? "w-16" : "w-72"
      } flex-shrink-0 relative z-20 flex flex-col`}
    >
      {/* Logo Section */}
      <div
        className={`p-4 border-b border-slate-700 ${collapsed ? "px-2" : ""}`}
      >
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="font-bold text-white truncate"></h2>
              <p className="text-xs text-slate-400 truncate">Panel Principal</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-3 space-y-2 flex-1 overflow-y-auto">
        {(() => {
          const filteredItems = menuItems.filter(item => item.enabled);
          console.log("📋 All menuItems:", menuItems);
          console.log("✅ Filtered items (enabled):", filteredItems);
          return filteredItems;
        })().map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <div key={item.path} className="relative group">
              <button
                onClick={() => item.enabled && onNavigate(item.path)}
                disabled={!item.enabled}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${getItemColors(
                  item,
                  isActive
                )}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-medium truncate">{item.label}</div>
                    {item.description && (
                      <div className="text-xs opacity-75 truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                )}
                {!collapsed &&
                  !item.enabled &&
                  (item.path as string) !== "/home" && (
                    <Lock className="w-4 h-4 flex-shrink-0" />
                  )}
              </button>

              {collapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-slate-400">
                      {item.description}
                    </div>
                  )}
                  {!item.enabled && (item.path as string) !== "/home" && (
                    <div className="text-xs text-red-400 flex items-center mt-1">
                      <Lock className="w-3 h-3 mr-1" />
                      Requiere aceptación
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        className={`p-4 border-t border-slate-700 space-y-3 ${collapsed ? "px-2" : ""}`}
      >
        <div className="flex items-center space-x-3 text-slate-400">
          <Building2 className="w-4 h-4 flex-shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs truncate">Ciber</p>
              <p className="text-xs text-slate-500 truncate">Sistema Interno</p>
            </div>
          )}
        </div>
      
        {/* Logo placeholder - espacio reservado para logo de la empresa */}
        <div className="flex items-center justify-center p-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
          <div className="text-xs text-slate-500 text-center">
            Logo de la empresa
          </div>
        </div>
      </div>
    </div>
  );
};

// Layout
const UserLayout: React.FC<UserLayoutProps> = ({
  children,
  user,
  onLogout,
  disclaimerAccepted,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const loadingUserData = useSelector(selectLoadingUserData);
  const isDisclaimerPopupVisible = useSelector(selectDisclaimerPopupVisible);
  const isFirstTime = useSelector(selectIsFirstTime);

  useEffect(() => {
    dispatch(fetchUserData());
  }, [dispatch]);

  const handleToggleSidebar = () => setSidebarCollapsed((s) => !s);
  const handleShowReadme = () => dispatch(showDisclaimerPopup());
  const handleCloseReadme = () => dispatch(hideDisclaimerPopup());

  const handleAcceptDisclaimer = async () => {
    try {
      await dispatch(updateDisclaimerChecked(true));
    } catch (error) {
      console.error("Error updating disclaimer:", error);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  if (loadingUserData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Navbar
        user={user}
        onLogout={onLogout}
        onToggleSidebar={handleToggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
        onShowReadme={handleShowReadme}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          disclaimerAccepted={disclaimerAccepted}
        />

        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-900 via-blue-900/10 to-slate-800">
          {children}
        </main>
      </div>

      <DisclaimerPopup
        isOpen={isDisclaimerPopupVisible}
        onClose={handleCloseReadme}
        onAccept={handleAcceptDisclaimer}
        showCheckbox={isFirstTime}
        isFirstTime={isFirstTime}
      />
    </div>
  );
};

export const UserRoutes: React.FC = () => {
  const navigate = useNavigate();
  const disclaimerAccepted = true;
  const user = getUsername();

  const onLogout = () => {
    removeToken();
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    navigate("/login", { replace: true });
  };

  return (
    <UserLayout
      user={user ? user : "Sin nombre"}
      onLogout={onLogout}
      disclaimerAccepted={disclaimerAccepted}
    >
      <Routes>
        {/* Ruta por defecto */}
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<ChatRagPage />} />
        <Route path="documents" element={<DocumentExplorerPage />} />
        <Route path="document-explorer" element={<DocumentExplorerPage />} />
        <Route path="document-explorer/oauth-success" element={<OAuthSuccessPage />} />
        <Route path="admin" element={<AdminPanelPage />} />

        {/* Fallback para rutas no encontradas */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </UserLayout>
  );
};