/**
 * config-contacto.js
 *
 * Fuente única de verdad para los datos de contacto del restaurante.
 * Cambia el número aquí y se actualiza en toda la app.
 */

export const TELEFONO_LOCAL = '78418801';
export const CODIGO_PAIS = '591';
export const TELEFONO_WHATSAPP = `${CODIGO_PAIS}${TELEFONO_LOCAL}`; // 59178418801
export const TELEFONO_DISPLAY = `+${CODIGO_PAIS} ${TELEFONO_LOCAL}`; // +591 78418801

/** Construye un enlace wa.me con mensaje opcional */
export function linkWhatsApp(mensaje = '') {
  const base = `https://wa.me/${TELEFONO_WHATSAPP}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}
