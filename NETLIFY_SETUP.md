# Configuración de Netlify para el Frontend

## ⚠️ IMPORTANTE: Variable de Entorno Requerida

El frontend **requiere** que configures la variable de entorno `VITE_API_URL` en Netlify para conectarse al backend en Railway.

## 📋 Pasos para Configurar

### 1. Obtener la URL del Backend
- Ve a tu proyecto en Railway
- Copia la URL pública de tu servicio backend (ej: `https://tu-backend.railway.app`)

### 2. Configurar en Netlify

1. Ve a tu proyecto en Netlify
2. Ve a **Site settings** → **Environment variables**
3. Click en **Add a variable**
4. Configura:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://tu-backend.railway.app` (sin barra final `/`)
   - **Scopes**: Deja marcado "All scopes" o selecciona "Production"
5. Click en **Save**

### 3. **REDEPLOY OBLIGATORIO**

⚠️ **CRÍTICO**: Después de agregar la variable, debes hacer un **redeploy**:

1. Ve a **Deploys**
2. Click en los tres puntos (⋯) del último deploy
3. Selecciona **Trigger deploy** → **Deploy site**

O simplemente haz un nuevo commit y push a tu repositorio.

## ✅ Verificación

Después del redeploy, abre la consola del navegador (F12) y deberías ver:

```
🌐 API Base URL: https://tu-backend.railway.app
```

Si ves `http://localhost:3000`, significa que:
- La variable no está configurada, O
- No hiciste redeploy después de configurarla

## 🔍 Debug

Si sigue sin funcionar, en la consola del navegador ejecuta:

```javascript
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
```

Si muestra `undefined`, la variable no está configurada correctamente.

## 📝 Notas

- Las variables de entorno en Vite deben empezar con `VITE_` para estar disponibles en el cliente
- Las variables se inyectan en **tiempo de build**, no en runtime
- Si agregas la variable después del build, **debes hacer redeploy**

