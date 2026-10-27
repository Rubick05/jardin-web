-- ══════════════════════════════════════════════════════════════════════════
-- Migración: Sistema de Login de Clientes y Seguimiento de Pedidos
-- Restaurante El Jardín
-- Ejecutar en Supabase -> SQL Editor
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Tabla de Clientes vinculada con Supabase Auth (auth.users)
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT,
    avatar_url TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS en clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad RLS para clientes
CREATE POLICY "Los clientes pueden ver su propio perfil" 
    ON public.clientes FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Los clientes pueden crear su perfil" 
    ON public.clientes FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Los clientes pueden actualizar su propio perfil" 
    ON public.clientes FOR UPDATE 
    USING (auth.uid() = id);

-- 2. Trigger para crear perfil automáticamente al registrarse en Auth (Email o Google OAuth)
CREATE OR REPLACE FUNCTION public.manejar_nuevo_usuario_cliente()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.clientes (id, nombre, email, telefono, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'nombre',
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'telefono', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        nombre = EXCLUDED.nombre,
        telefono = COALESCE(NULLIF(EXCLUDED.telefono, ''), clientes.telefono),
        avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), clientes.avatar_url),
        actualizado_en = NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_crear_cliente_on_auth ON auth.users;
CREATE TRIGGER tr_crear_cliente_on_auth
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.manejar_nuevo_usuario_cliente();

-- 3. Agregar columna id_cliente en tabla pedidos (resiliente si ya existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'pedidos' 
          AND column_name = 'id_cliente'
    ) THEN
        ALTER TABLE public.pedidos ADD COLUMN id_cliente UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Índice para consulta rápida de Mis Pedidos
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON public.pedidos(id_cliente);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_creado ON public.pedidos(id_cliente, creado_en DESC);

-- 5. Función RPC optimizada para consultar "Mis Pedidos"
CREATE OR REPLACE FUNCTION public.mis_pedidos()
RETURNS SETOF public.pedidos
LANGUAGE sql 
STABLE 
SECURITY DEFINER 
SET search_path = public
AS $$
    SELECT * FROM public.pedidos 
    WHERE id_cliente = auth.uid() 
    ORDER BY creado_en DESC 
    LIMIT 50;
$$;
