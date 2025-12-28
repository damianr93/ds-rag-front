import { toast } from "react-toastify";

export const saveToken = (token: string, name: string) => {
  if (!token) {
    toast.error("No se proporcionó un token válido", { position: "top-right" });
    return false;
  }
  localStorage.setItem("auth_token", token);
  localStorage.setItem("user_data", JSON.stringify({ name }));
  return true;
};

export const getToken = () => {
  const token = localStorage.getItem("auth_token");
  // Para mi yo del futuro: no hagamos toast acá; es ruidoso si se llama en muchos lugares. //! mover toasts al caller
  return token; // null si no hay
};


export const getUsername = () => {
  const userData = localStorage.getItem("user_data");
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      return parsed.name;
    } catch {
      return null;
    }
  }
  return null;
};

export const removeToken = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("user_data");
  return true;
};
