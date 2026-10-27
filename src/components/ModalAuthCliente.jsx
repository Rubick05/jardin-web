import React, { useState } from 'react';
import { 
  X, Mail, Lock, User, Phone, LogIn, UserPlus, AlertCircle, 
  CheckCircle2, Loader2, ArrowRight
} from 'lucide-react';
import { iniciarSesion, registrarCliente, iniciarConGoogle } from '../lib/auth-cliente';

export default function ModalAuthCliente({ 
  isOpen, 
  onClose, 
  onLoginExitoso, 
  mensajeInicial = null,
  tabInicial = 'login'
}) {
  const [tab, setTab] = useState(tabInicial); // 'login' | 'registro'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoGoogle, setCargandoGoogle] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  if (!isOpen) return null;

  const limpiarForm = () => {
    setError(null);
    setMensajeExito(null);
  };

  const handleCambiarTab = (nuevaTab) => {
    setTab(nuevaTab);
    limpiarForm();
  };

  const traducirError = (err) => {
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
      return 'Correo o contraseña incorrectos. Verifica tus datos.';
    }
    if (msg.includes('user already registered') || msg.includes('already exists')) {
      return 'Este correo ya tiene una cuenta registrada. Por favor inicia sesión.';
    }
    if (msg.includes('password should be at least')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (msg.includes('rate limit')) {
      return 'Demasiados intentos. Espera unos momentos antes de reintentar.';
    }
    return err?.message || 'Ocurrió un error. Por favor intenta de nuevo.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMensajeExito(null);
    setCargando(true);

    try {
      if (tab === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Por favor ingresa tu correo y contraseña.');
        }
        const data = await iniciarSesion(email, password);
        if (data?.user) {
          setMensajeExito('¡Sesión iniciada correctamente!');
          setTimeout(() => {
            if (onLoginExitoso) onLoginExitoso(data.user);
            onClose();
          }, 600);
        }
      } else {
        // Registro
        if (!nombre.trim()) throw new Error('Por favor ingresa tu nombre completo.');
        if (!telefono.trim() || telefono.trim().length < 6) {
          throw new Error('Por favor ingresa un número de teléfono o WhatsApp válido.');
        }
        if (!email.trim()) throw new Error('Por favor ingresa tu correo electrónico.');
        if (!password || password.length < 6) {
          throw new Error('La contraseña debe tener mínimo 6 caracteres.');
        }

        const data = await registrarCliente({
          nombre: nombre.trim(),
          email: email.trim(),
          password,
          telefono: telefono.trim()
        });

        if (data?.session) {
          setMensajeExito('¡Cuenta creada exitosamente! Bienvenido a El Jardín.');
          setTimeout(() => {
            if (onLoginExitoso) onLoginExitoso(data.user);
            onClose();
          }, 800);
        } else {
          // Requiere confirmación por correo si está configurado en Supabase
          setMensajeExito('¡Cuenta registrada! Si configuraste verificación por correo, revisa tu bandeja de entrada.');
          setTimeout(() => {
            setTab('login');
          }, 2000);
        }
      }
    } catch (err) {
      setError(traducirError(err));
    } finally {
      setCargando(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setCargandoGoogle(true);
    try {
      await iniciarConGoogle();
    } catch (err) {
      setError(traducirError(err));
      setCargandoGoogle(false);
    }
  };

  return (
    <div 
      className="cart-drawer-backdrop"
      style={{
        zIndex: 10002,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        position: 'fixed',
        inset: 0,
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !cargando && !cargandoGoogle) onClose();
      }}
    >
      <div 
        style={{
          maxWidth: '440px',
          width: '100%',
          background: 'linear-gradient(180deg, #131d10 0%, #0a1108 100%)',
          border: '1.5px solid var(--gold)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(200, 144, 58, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          animation: 'modalFadeIn 0.25s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div style={{
          padding: '18px 20px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(74, 124, 63, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🌿</span>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: 0, fontFamily: 'serif' }}>
                {tab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </h2>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#a8b89a' }}>
              {tab === 'login' ? 'Accede a tu perfil y da seguimiento a tus pedidos' : 'Regístrate para guardar y monitorear tus pedidos'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={cargando || cargandoGoogle}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Notificación informativa inicial (ej. "Inicia sesión para ver tus pedidos") */}
        {mensajeInicial && (
          <div style={{
            margin: '14px 18px 0',
            padding: '10px 14px',
            background: 'rgba(200, 144, 58, 0.15)',
            border: '1px solid rgba(200, 144, 58, 0.4)',
            borderRadius: '12px',
            fontSize: '12px',
            color: '#ffefc2',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>💡</span>
            <span>{mensajeInicial}</span>
          </div>
        )}

        {/* Pestañas Login / Registro */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          padding: '14px 18px 0'
        }}>
          <button
            type="button"
            onClick={() => handleCambiarTab('login')}
            style={{
              padding: '10px',
              borderRadius: '12px',
              border: tab === 'login' ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
              background: tab === 'login' ? 'rgba(200, 144, 58, 0.2)' : 'rgba(255,255,255,0.02)',
              color: tab === 'login' ? '#fff' : '#a8b89a',
              fontSize: '12.5px',
              fontWeight: tab === 'login' ? 'bold' : 'normal',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <LogIn size={15} color={tab === 'login' ? 'var(--gold)' : '#a8b89a'} />
            <span>Ingresar</span>
          </button>

          <button
            type="button"
            onClick={() => handleCambiarTab('registro')}
            style={{
              padding: '10px',
              borderRadius: '12px',
              border: tab === 'registro' ? '1.5px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
              background: tab === 'registro' ? 'rgba(200, 144, 58, 0.2)' : 'rgba(255,255,255,0.02)',
              color: tab === 'registro' ? '#fff' : '#a8b89a',
              fontSize: '12.5px',
              fontWeight: tab === 'registro' ? 'bold' : 'normal',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={15} color={tab === 'registro' ? 'var(--gold)' : '#a8b89a'} />
            <span>Registrarse</span>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Botón Google OAuth */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={cargando || cargandoGoogle}
            style={{
              width: '100%',
              padding: '11px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: cargandoGoogle ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            {cargandoGoogle ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
            <span>{tab === 'login' ? 'Continuar con Google' : 'Registrarse con Google'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#687864', fontSize: '11px', margin: '2px 0' }}>
            <span style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            o con tu correo electrónico
            <span style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Campo Nombre (solo registro) */}
          {tab === 'registro' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#a8b89a', marginBottom: '4px' }}>
                Nombre Completo *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 34px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(74, 124, 63, 0.3)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <User size={15} color="var(--gold-light)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          )}

          {/* Campo Teléfono (solo registro) */}
          {tab === 'registro' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#a8b89a', marginBottom: '4px' }}>
                Teléfono / WhatsApp * (para asociar tus pedidos)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  required
                  placeholder="Ej. 78418801"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 34px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(74, 124, 63, 0.3)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <Phone size={15} color="var(--gold-light)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>
          )}

          {/* Campo Correo */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#a8b89a', marginBottom: '4px' }}>
              Correo Electrónico *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 34px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(74, 124, 63, 0.3)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <Mail size={15} color="var(--gold-light)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#a8b89a', marginBottom: '4px' }}>
              Contraseña *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                placeholder={tab === 'registro' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 34px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(74, 124, 63, 0.3)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <Lock size={15} color="var(--gold-light)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Mensajes de error o éxito */}
          {error && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '10px',
              color: '#fca5a5',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {mensajeExito && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              borderRadius: '10px',
              color: '#86efac',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{mensajeExito}</span>
            </div>
          )}

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={cargando || cargandoGoogle}
            style={{
              width: '100%',
              padding: '13px',
              background: 'linear-gradient(135deg, #e8af60 0%, #c8903a 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#0f1710',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: cargando ? 'wait' : 'pointer',
              boxShadow: '0 6px 20px rgba(200,144,58,0.35)',
              marginTop: '4px'
            }}
          >
            {cargando ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <ArrowRight size={16} />
            )}
            <span>
              {cargando 
                ? (tab === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...') 
                : (tab === 'login' ? 'Iniciar Sesión' : 'Completar Registro')}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
