import { supabase } from './supabase.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './api-menu.js';

/**
 * Iniciar sesión con email y contraseña
 */
export async function iniciarSesion(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  });
  if (error) throw error;
  return data;
}

/**
 * Registro de nuevo cliente con nombre, email, password y teléfono
 */
export async function registrarCliente({ nombre, email, password, telefono }) {
  const cleanPhone = (telefono || '').trim();
  const cleanName = (nombre || '').trim();

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        nombre: cleanName,
        telefono: cleanPhone,
        rol: 'cliente'
      }
    }
  });

  if (error) throw error;

  // Si se creó el usuario y tenemos id, intentar guardar en tabla public.clientes (resiliente si la tabla aún no existe)
  if (data?.user?.id) {
    try {
      await guardarPerfilEnTabla(data.user.id, {
        nombre: cleanName,
        email: email.trim(),
        telefono: cleanPhone
      });
    } catch (e) {
      console.warn('Registro en tabla clientes omitido (usa metadata):', e.message);
    }
  }

  return data;
}

/**
 * Iniciar sesión / Registro con Google (OAuth)
 */
export async function iniciarConGoogle() {
  const redirectTo = window.location.origin;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account'
      }
    }
  });
  if (error) throw error;
  return data;
}

/**
 * Cerrar sesión
 */
export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Guarda o actualiza perfil en tabla public.clientes con fallback
 */
async function guardarPerfilEnTabla(userId, { nombre, email, telefono }) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/clientes`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: userId,
        nombre,
        email,
        telefono,
        actualizado_en: new Date().toISOString()
      })
    });
  } catch (e) {
    // Si la tabla no existe en la BD, la información se preserva en auth.users user_metadata
  }
}

/**
 * Obtener perfil completo del cliente actual
 */
export async function obtenerPerfilCliente(user) {
  if (!user) return null;

  let perfilTabla = null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/clientes?id=eq.${user.id}&select=*&limit=1`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (res.ok) {
      const rows = await res.json();
      if (rows && rows[0]) perfilTabla = rows[0];
    }
  } catch {}

  const meta = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email,
    nombre: perfilTabla?.nombre || meta.nombre || meta.full_name || meta.name || user.email?.split('@')[0] || 'Cliente',
    telefono: perfilTabla?.telefono || meta.telefono || '',
    avatar: meta.avatar_url || meta.picture || null,
    creado_en: user.created_at
  };
}

/**
 * Actualizar datos del perfil (nombre y teléfono)
 */
export async function actualizarPerfilCliente(userId, { nombre, telefono }) {
  // 1. Actualizar metadata de Supabase Auth
  const { data, error } = await supabase.auth.updateUser({
    data: {
      nombre: (nombre || '').trim(),
      telefono: (telefono || '').trim()
    }
  });
  if (error) throw error;

  // 2. Intentar actualizar en la tabla public.clientes
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/clientes?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: (nombre || '').trim(),
        telefono: (telefono || '').trim(),
        actualizado_en: new Date().toISOString()
      })
    });
  } catch {}

  return data;
}

/**
 * Normaliza el estado del pedido para el cliente según el requerimiento:
 * "en preparación", "en camino", "ya en puerta", "entregado"
 */
export function normalizarEstadoPedido(estadoRaw, tipoEntrega = 'delivery') {
  const est = (estadoRaw || '').toLowerCase().trim();

  if (est === 'en_puerta' || est === 'puerta') {
    return {
      clave: 'en_puerta',
      label: 'Ya en puerta',
      icono: '🚪',
      color: '#f59e0b',
      descripcion: 'El repartidor ha llegado a tu ubicación y está en puerta.'
    };
  }

  if (est === 'en_camino' || est === 'camino') {
    return {
      clave: 'en_camino',
      label: 'En camino',
      icono: '🛵',
      color: '#3b82f6',
      descripcion: 'Tu pedido salió del restaurante y el repartidor va en camino.'
    };
  }

  if (est === 'en_proceso' || est === 'preparando' || est === 'en_preparacion') {
    return {
      clave: 'en_preparacion',
      label: 'En preparación',
      icono: '🍳',
      color: '#eab308',
      descripcion: 'Nuestros cocineros están preparando tus platos con sazón tradicional.'
    };
  }

  if (est === 'listo') {
    if (tipoEntrega === 'delivery') {
      return {
        clave: 'listo',
        label: 'Listo / Asignando repartidor',
        icono: '📦',
        color: '#6366f1',
        descripcion: 'Tus platos están listos y empaquetados esperando salida.'
      };
    }
    return {
      clave: 'listo',
      label: 'Listo en el local',
      icono: '🪴',
      color: '#10b981',
      descripcion: 'Tus platos están listos para ser disfrutados.'
    };
  }

  if (est === 'entregado' || est === 'pagado') {
    return {
      clave: 'entregado',
      label: 'Entregado',
      icono: '✅',
      color: '#22c55e',
      descripcion: 'Pedido entregado y completado. ¡Buen provecho!'
    };
  }

  if (est === 'cancelado') {
    return {
      clave: 'cancelado',
      label: 'Cancelado',
      icono: '❌',
      color: '#ef4444',
      descripcion: 'Este pedido fue cancelado.'
    };
  }

  // Por defecto: Pendiente / Recibido
  return {
    clave: 'pendiente',
    label: 'Pedido recibido',
    icono: '⏳',
    color: '#94a3b8',
    descripcion: 'Recibimos tu solicitud y estamos confirmando con cocina.'
  };
}

/**
 * Consulta "Mis Pedidos" del cliente por ID de usuario o teléfono vinculado
 */
export async function obtenerMisPedidos(user, perfil) {
  if (!user) return [];

  const pedidosEncontrados = new Map();
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`
  };

  // 1. Buscar por id_cliente en la tabla de pedidos
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pedidos?id_cliente=eq.${user.id}&select=*,items:items_pedido(*)&order=creado_en.desc&limit=30`, {
      headers
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        data.forEach(p => pedidosEncontrados.set(p.id, p));
      }
    }
  } catch {}

  // 2. Buscar por teléfono si el perfil lo tiene configurado
  const telefono = perfil?.telefono || user.user_metadata?.telefono;
  if (telefono) {
    const cleanPhone = telefono.replace(/\D/g, '');
    if (cleanPhone.length >= 6) {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/pedidos?datos_facturacion->>cliente_telefono=ilike.*${cleanPhone}*&select=*,items:items_pedido(*)&order=creado_en.desc&limit=30`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            data.forEach(p => pedidosEncontrados.set(p.id, p));
          }
        }
      } catch {}
    }
  }

  // 3. Incluir el pedido activo de localStorage si existe
  try {
    const local = localStorage.getItem('jardin_pedido_activo');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed?.id && !pedidosEncontrados.has(parsed.id)) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/pedidos?id=eq.${parsed.id}&select=*,items:items_pedido(*)&limit=1`, {
          headers
        });
        if (res.ok) {
          const rows = await res.json();
          if (rows && rows[0]) pedidosEncontrados.set(rows[0].id, rows[0]);
        }
      }
    }
  } catch {}

  // Convertir a array ordenado por fecha descendente
  return Array.from(pedidosEncontrados.values()).sort((a, b) => {
    return new Date(b.creado_en || 0) - new Date(a.creado_en || 0);
  });
}
