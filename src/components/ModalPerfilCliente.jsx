import React, { useState, useEffect } from 'react';
import { 
  X, User, Phone, Mail, LogOut, ShoppingBag, Clock, 
  MapPin, RefreshCw, CheckCircle2, ChevronRight, Edit3, 
  Save, AlertCircle, Loader2, Sparkles, Bike, Store, Eye
} from 'lucide-react';
import { 
  cerrarSesion, 
  actualizarPerfilCliente, 
  obtenerMisPedidos, 
  normalizarEstadoPedido 
} from '../lib/auth-cliente';
import { linkWhatsApp } from '../lib/config-contacto';

export default function ModalPerfilCliente({
  isOpen,
  onClose,
  usuario,
  perfil,
  onPerfilActualizado,
  onCerrarSesion,
  onVerSeguimientoPedido
}) {
  const [pedidos, setPedidos] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [nombreEdit, setNombreEdit] = useState('');
  const [telefonoEdit, setTelefonoEdit] = useState('');
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [mensajeEdicion, setMensajeEdicion] = useState(null);

  useEffect(() => {
    if (perfil) {
      setNombreEdit(perfil.nombre || '');
      setTelefonoEdit(perfil.telefono || '');
    }
  }, [perfil]);

  const cargarPedidos = async () => {
    if (!usuario) return;
    setCargandoPedidos(true);
    try {
      const data = await obtenerMisPedidos(usuario, perfil);
      setPedidos(data || []);
    } catch (e) {
      console.warn('Error al cargar pedidos del cliente:', e);
    } finally {
      setCargandoPedidos(false);
    }
  };

  useEffect(() => {
    if (isOpen && usuario) {
      cargarPedidos();
      // Polling suave cada 8 segundos mientras el modal de perfil esté abierto
      const timer = setInterval(() => {
        cargarPedidos();
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [isOpen, usuario]);

  if (!isOpen || !usuario) return null;

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    if (!nombreEdit.trim()) return;
    setGuardandoPerfil(true);
    setMensajeEdicion(null);

    try {
      await actualizarPerfilCliente(usuario.id, {
        nombre: nombreEdit.trim(),
        telefono: telefonoEdit.trim()
      });
      if (onPerfilActualizado) {
        onPerfilActualizado({
          ...perfil,
          nombre: nombreEdit.trim(),
          telefono: telefonoEdit.trim()
        });
      }
      setMensajeEdicion({ tipo: 'ok', texto: 'Perfil actualizado con éxito.' });
      setModoEdicion(false);
      // Recargar pedidos por si se actualizó el teléfono
      cargarPedidos();
    } catch (err) {
      setMensajeEdicion({ tipo: 'error', texto: err.message || 'No se pudo actualizar el perfil.' });
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const handleCerrarSesion = async () => {
    try {
      await cerrarSesion();
      if (onCerrarSesion) onCerrarSesion();
      onClose();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  const iniciales = (perfil?.nombre || usuario.email || 'C')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  return (
    <div 
      className="cart-drawer-backdrop"
      style={{
        zIndex: 10001,
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          maxWidth: '560px',
          width: '100%',
          background: 'linear-gradient(180deg, #131d10 0%, #0a1108 100%)',
          border: '1.5px solid var(--gold)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(200, 144, 58, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          position: 'relative',
          animation: 'modalFadeIn 0.25s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(74, 124, 63, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>👤</span>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', margin: 0, fontFamily: 'serif' }}>
                Mi Perfil y Pedidos
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#a8b89a' }}>
                Monitorea el estado de tus pedidos en tiempo real
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCerrarSesion}
              title="Cerrar Sesión"
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                padding: '6px 10px',
                color: '#fca5a5',
                fontSize: '11.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              <LogOut size={13} />
              <span>Salir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
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
        </div>

        {/* Contenido con scroll */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Tarjeta de Datos del Cliente */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(200, 144, 58, 0.12) 0%, rgba(74, 124, 63, 0.08) 100%)',
            border: '1px solid rgba(200, 144, 58, 0.35)',
            borderRadius: '16px',
            padding: '16px'
          }}>
            {!modoEdicion ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e8af60 0%, #c8903a 100%)',
                    color: '#0f1710',
                    fontSize: '18px',
                    fontWeight: '900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(200,144,58,0.3)',
                    flexShrink: 0
                  }}>
                    {iniciales}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                      {perfil?.nombre || 'Cliente de El Jardín'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11.5px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} color="var(--gold)" /> {usuario.email}
                      </span>
                      {perfil?.telefono && (
                        <span style={{ fontSize: '11.5px', color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} /> {perfil.telefono}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModoEdicion(true)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    color: '#fff',
                    fontSize: '11.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer'
                  }}
                >
                  <Edit3 size={13} />
                  <span>Editar Datos</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleGuardarPerfil} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--gold-light)' }}>
                  Actualizar Datos Personales
                </span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#a8b89a', marginBottom: '3px' }}>
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombreEdit}
                      onChange={(e) => setNombreEdit(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(74,124,63,0.4)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12.5px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#a8b89a', marginBottom: '3px' }}>
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. 78418801"
                      value={telefonoEdit}
                      onChange={(e) => setTelefonoEdit(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(74,124,63,0.4)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12.5px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setModoEdicion(false)}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#fff',
                      fontSize: '11.5px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoPerfil}
                    style={{
                      background: 'var(--gold)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      color: '#0f1710',
                      fontSize: '11.5px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: guardandoPerfil ? 'wait' : 'pointer'
                    }}
                  >
                    {guardandoPerfil ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </form>
            )}

            {mensajeEdicion && (
              <div style={{
                marginTop: '10px',
                fontSize: '11.5px',
                color: mensajeEdicion.tipo === 'ok' ? '#4ade80' : '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                {mensajeEdicion.tipo === 'ok' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                <span>{mensajeEdicion.texto}</span>
              </div>
            )}
          </div>

          {/* Sección "Mis Pedidos" */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={17} color="var(--gold)" />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#fff', fontFamily: 'serif' }}>
                  Mis Pedidos ({pedidos.length})
                </h4>
              </div>

              <button
                type="button"
                onClick={cargarPedidos}
                disabled={cargandoPedidos}
                title="Actualizar estado de mis pedidos"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  color: '#cbd5e1',
                  fontSize: '11.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: cargandoPedidos ? 'wait' : 'pointer'
                }}
              >
                <RefreshCw size={12} style={{ animation: cargandoPedidos ? 'spin 1s linear infinite' : 'none' }} />
                <span>Actualizar</span>
              </button>
            </div>

            {cargandoPedidos && pedidos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#a8b89a', fontSize: '13px' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                <span>Consultando tus pedidos en el restaurante...</span>
              </div>
            ) : pedidos.length === 0 ? (
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(74, 124, 63, 0.3)',
                borderRadius: '16px',
                padding: '30px 20px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🍲</span>
                <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                  Aún no tienes pedidos registrados
                </p>
                <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#889980' }}>
                  Explora nuestra carta tradicional y realiza tu primer pedido a domicilio o reserva de mesa.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'linear-gradient(135deg, #e8af60 0%, #c8903a 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '9px 18px',
                    color: '#0f1710',
                    fontSize: '12.5px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Ver Menú de Hoy
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pedidos.map((ped) => {
                  const df = ped.datos_facturacion || {};
                  const tipo = df.tipo_entrega || (df.origen === 'web_delivery' ? 'delivery' : 'local');
                  const codigo = ped.numero_ficha ? `DEL-${ped.numero_ficha}` : ped.id?.slice(0, 8).toUpperCase();
                  const estadoInfo = normalizarEstadoPedido(ped.estado, tipo);
                  const fechaStr = ped.creado_en 
                    ? new Date(ped.creado_en).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : 'Reciente';

                  const esDelivery = tipo === 'delivery';

                  return (
                    <div
                      key={ped.id}
                      style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.3) 100%)',
                        border: `1.5px solid ${estadoInfo.clave === 'en_puerta' ? '#f59e0b' : (estadoInfo.clave === 'en_camino' ? '#3b82f6' : 'rgba(74, 124, 63, 0.3)')}`,
                        borderRadius: '16px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: estadoInfo.clave === 'en_puerta' ? '0 0 15px rgba(245, 158, 11, 0.25)' : 'none'
                      }}
                    >
                      {/* Fila 1: Código + Fecha + Estado */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--gold-light)' }}>
                              #{codigo}
                            </span>
                            <span style={{
                              fontSize: '10.5px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: esDelivery ? 'rgba(59, 130, 246, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                              color: esDelivery ? '#93c5fd' : '#86efac',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {esDelivery ? <Bike size={11} /> : <Store size={11} />}
                              {esDelivery ? 'A Domicilio' : 'En el Local'}
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: '#7a8a72' }}>
                            {fechaStr}
                          </span>
                        </div>

                        {/* Badge de Estado del Pedido con animación para estados activos */}
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '100px',
                          background: `${estadoInfo.color}22`,
                          border: `1px solid ${estadoInfo.color}66`,
                          color: estadoInfo.color,
                          fontSize: '12px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          animation: (estadoInfo.clave === 'en_puerta' || estadoInfo.clave === 'en_camino' || estadoInfo.clave === 'en_preparacion')
                            ? 'pulse 2s infinite' : 'none'
                        }}>
                          <span>{estadoInfo.icono}</span>
                          <span>{estadoInfo.label}</span>
                        </div>
                      </div>

                      {/* Explicación amigable del estado para el cliente */}
                      <div style={{
                        fontSize: '11.5px',
                        color: '#d4dfce',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '8px 10px',
                        borderRadius: '8px'
                      }}>
                        {estadoInfo.descripcion}
                      </div>

                      {/* Fila 2: Ítems y Total */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '11.5px', color: '#a8b89a', maxWidth: '65%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {Array.isArray(ped.items) && ped.items.length > 0 ? (
                            ped.items.map(it => `${it.cantidad}x ${it.nombre_item}`).join(', ')
                          ) : (
                            <span>{ped.notas?.split('.')[0] || 'Pedido de la carta'}</span>
                          )}
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--gold)' }}>
                            Bs. {Number(ped.total || df.total_estimado || 0).toFixed(0)}
                          </span>
                        </div>
                      </div>

                      {/* Fila 3: Botones de Acción */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (onVerSeguimientoPedido) onVerSeguimientoPedido(ped.id);
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(200, 144, 58, 0.4)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={13} color="var(--gold)" />
                          <span>Ver Detalles y QR</span>
                        </button>

                        <a
                          href={linkWhatsApp(`Hola El Jardín! Consulto por mi pedido #${codigo}. ¿En qué estado se encuentra?`)}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '8px 12px',
                            background: 'rgba(34, 197, 94, 0.15)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: '8px',
                            color: '#86efac',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            textDecoration: 'none'
                          }}
                        >
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
