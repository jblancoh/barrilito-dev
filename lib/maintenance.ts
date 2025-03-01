/**
 * Configuración del modo de mantenimiento
 * 
 * Este archivo permite controlar si el sitio está en modo de mantenimiento
 * y qué rutas están exentas de la redirección.
 */

/**
 * Indica si el modo de mantenimiento está activo
 * Cambia a true para activar el modo de mantenimiento
 */
export const MAINTENANCE_MODE = true

/**
 * Rutas que están exentas del modo de mantenimiento
 * Estas rutas seguirán siendo accesibles incluso cuando el modo de mantenimiento esté activo
 */
export const EXEMPT_PATHS = [
  "/maintenance",
  // Agrega aquí cualquier otra ruta que deba ser accesible durante el mantenimiento
  // Por ejemplo, rutas de administración o API endpoints específicos
  // "/admin",
  // "/api/status",
] 