-- ══════════════════════════════════════════════════════════════════════════
-- Revertir y Limpiar: Eliminar sistema de login de clientes y tabla clientes
-- Ejecutar en Supabase -> SQL Editor para liberar espacio y recursos
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Eliminar el trigger en auth.users
DROP TRIGGER IF EXISTS tr_crear_cliente_on_auth ON auth.users;

-- 2. Eliminar la función que creaba los perfiles
DROP FUNCTION IF EXISTS public.manejar_nuevo_usuario_cliente();

-- 3. Eliminar la función RPC mis_pedidos
DROP FUNCTION IF EXISTS public.mis_pedidos();

-- 4. Eliminar índices asociados a id_cliente
DROP INDEX IF EXISTS public.idx_pedidos_cliente;
DROP INDEX IF EXISTS public.idx_pedidos_cliente_creado;

-- 5. Eliminar la columna id_cliente de la tabla pedidos (si existe)
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS id_cliente;

-- 6. Eliminar la tabla de clientes por completo
DROP TABLE IF EXISTS public.clientes CASCADE;
