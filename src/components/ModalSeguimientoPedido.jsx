import React, { useState, useEffect } from 'react';
import { 
  Clock, ChefHat, Bike, Store, CheckCircle2, AlertCircle, 
  RefreshCw, X, MessageCircle, MapPin, Phone, ShieldCheck, DollarSign, Search
} from 'lucide-react';
import { consultarEstadoPedido, buscarPedidosPorTelefono } from '../lib/api-menu';

export default function ModalSeguimientoPedido({ pedidoId, pedidoInicial = null, onCerrar }) {
  const [pedido, setPedido] = useState(pedidoInicial);
  const [cargando, setCargando] = useState(Boolean(pedidoId && !pedidoInicial));
  const [error, setError] = useState(null);
  const [actualizando, setActualizando] = useState(false);
  const [codigoBusqueda, setCodigoBusqueda] = useState(pedidoId || '');
  const [modoBusquedaManual, setModoBusquedaManual] = useState(!pedidoId && !pedidoInicial);

  const cargarPedido = async (silencioso = false, idTarget = null) => {
    const targetId = idTarget || pedidoId || pedido?.id;
    if (!targetId) return;
    if (!silencioso) setCargando(true);
    else setActualizando(true);

    try {
      const data = await consultarEstadoPedido(targetId);
      if (data) {
        setPedido(data);
        setError(null);
        setModoBusquedaManual(false);
      } else if (!pedido) {
        setError('No se pudo encontrar el pedido con el código indicado.');
      }
    } catch (e) {
      console.warn('Error al consultar estado:', e);
      if (!pedido) setError('Error de conexión al consultar el estado.');
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  const handleBuscarManual = async (e) => {
    if (e) e.preventDefault();
    const q = codigoBusqueda.trim();
    if (!q) return;
    setCargando(true);
    setError(null);
    try {
      let data = await consultarEstadoPedido(q);
      if (!data && /^\d{7,10}$/.test(q.replace(/\D/g, ''))) {
        const encontrados = await buscarPedidosPorTelefono(q);
        if (encontrados && encontrados.length > 0) {
          data = encontrados[0];
        }
      }
      if (data) {
        setPedido(data);
        setError(null);
        setModoBusquedaManual(false);
      } else {
        setError(`No encontramos ningún pedido activo con "${q}". Verifica tu número de WhatsApp o código.`);
      }
    } catch (err) {
      setError('Error al consultar con el restaurante. Por favor reintenta.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (pedidoId) {
      cargarPedido(false, pedidoId);
      // Polling cada 7 segundos para que el cliente vea cambios en tiempo real
      const timer = setInterval(() => {
        cargarPedido(true, pedidoId);
      }, 7000);
      return () => clearInterval(timer);
    }
  }, [pedidoId]);

  const df = pedido?.datos_facturacion || {};
  const estado = pedido?.estado || 'pendiente';
  const tipoEntrega = df.tipo_entrega || (df.origen === 'web_delivery' ? 'delivery' : 'local');
  const esDelivery = tipoEntrega === 'delivery';

  // Determinar paso activo del stepper (1 a 4)
  let pasoActivo = 1;
  if (estado === 'en_proceso') pasoActivo = 2;
  else if (estado === 'en_camino') pasoActivo = 3;
  else if (estado === 'listo') pasoActivo = 3;
  else if (estado === 'entregado' || estado === 'pagado') pasoActivo = 4;

  const total = Number(pedido?.total ?? df.total_estimado ?? 0);
  const anticipo = Number(df.monto_anticipo ?? 0);
  const saldoPendiente = df.saldo_pendiente !== undefined 
    ? Number(df.saldo_pendiente) 
    : Math.max(0, total - anticipo);

  const codigoDisplay = pedido?.numero_ficha 
    ? `#${pedido.numero_ficha}` 
    : (pedido?.id ? `#${pedido.id.slice(0, 8).toUpperCase()}` : '#PEDIDO');

  const abrirWhatsAppRestaurante = () => {
    const telefonoRestaurante = '59178418801';
    const msg = encodeURIComponent(
      `Hola *El Jardín*, consulto por el estado de mi pedido ${codigoDisplay} a nombre de *${df.cliente_nombre || 'Cliente'}*. ¿Cómo va la preparación?`
    );
    window.open(`https://wa.me/${telefonoRestaurante}?text=${msg}`, '_blank');
  };

  return (
    <div 
      className="cart-drawer-backdrop"
      style={{ zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', background: 'rgba(0,0,0,0.85)' }}
      onClick={onCerrar}
    >
      <div 
        style={{
          maxWidth: '500px',
          width: '100%',
          background: 'linear-gradient(180deg, #121c10 0%, #0c140a 100%)',
          border: '1.5px solid var(--gold)',
          borderRadius: '24px',
          padding: '24px 20px',
          boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 40px rgba(200,144,58,0.2)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'rgba(200,144,58,0.18)',
                color: 'var(--gold-light)',
                border: '1px solid var(--gold)',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 'bold'
              }}>
                {codigoDisplay}
              </span>
              <span style={{ fontSize: '11px', color: '#a8b89a' }}>
                {esDelivery ? '🛵 Envío a Domicilio' : '🪴 Reserva en Local'}
              </span>
            </div>
            <h3 style={{ margin: '6px 0 0', fontSize: '19px', color: '#fff', fontFamily: 'Playfair Display, serif', fontWeight: 'bold' }}>
              Estado de tu Pedido en Vivo
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => cargarPedido(true)}
              disabled={actualizando}
              title="Actualizar estado ahora"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RefreshCw size={14} className={actualizando ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onCerrar}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Contenido con Scroll */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {cargando && !pedido ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#a8b89a' }}>
              <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--gold)' }} />
              <p style={{ fontSize: '14px', margin: 0 }}>Consultando el estado de tu pedido en cocina...</p>
            </div>
          ) : (modoBusquedaManual || !pedido) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '10px 0' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '18px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--gold)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Search size={16} /> Rastrear Pedido sin Iniciar Sesión
                </h4>
                <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#aaa', lineHeight: 1.4 }}>
                  Ingresa el código que te enviamos (ej. <strong>#DEL-104</strong> o los 6 dígitos) o tu número de WhatsApp para ver el estado de preparación y despacho en vivo.
                </p>

                <form onSubmit={handleBuscarManual} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Ej: #DEL-104 o 78418801"
                    value={codigoBusqueda}
                    onChange={e => setCodigoBusqueda(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1.5px solid var(--gold)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={cargando || !codigoBusqueda.trim()}
                    className="btn btn-gold"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {cargando ? 'Buscando en cocina...' : '🔍 Consultar Estado en Vivo'}
                  </button>
                </form>

                {error && (
                  <div style={{ marginTop: '12px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px', color: '#fca5a5', fontSize: '12px', textAlign: 'center' }}>
                    {error}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* ESTADO ACTUAL PRINCIPAL */}
              <div style={{
                background: pasoActivo === 4 
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(14,24,12,0.8) 100%)'
                  : pasoActivo >= 2 
                    ? 'linear-gradient(135deg, rgba(200,144,58,0.2) 0%, rgba(14,24,12,0.8) 100%)'
                    : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${pasoActivo === 4 ? '#22c55e' : 'var(--gold)'}`,
                borderRadius: '18px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: pasoActivo === 4 ? 'rgba(34,197,94,0.25)' : 'rgba(200,144,58,0.25)',
                  border: `2px solid ${pasoActivo === 4 ? '#22c55e' : 'var(--gold)'}`,
                  color: pasoActivo === 4 ? '#4ade80' : 'var(--gold-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {pasoActivo === 1 && <Clock size={24} />}
                  {pasoActivo === 2 && <ChefHat size={24} />}
                  {pasoActivo === 3 && (esDelivery ? <Bike size={24} /> : <Store size={24} />)}
                  {pasoActivo === 4 && <CheckCircle2 size={24} />}
                </div>

                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gold-light)', fontWeight: 'bold' }}>
                    {pasoActivo === 1 && '1. Pedido Recibido'}
                    {pasoActivo === 2 && '2. En Preparación en Cocina'}
                    {pasoActivo === 3 && (esDelivery ? '3. En Camino con Repartidor' : '3. Mesa y Platos Listos')}
                    {pasoActivo === 4 && '4. Pedido Entregado'}
                  </div>
                  <h4 style={{ margin: '3px 0 0', fontSize: '15px', color: '#fff', fontWeight: 'bold' }}>
                    {pasoActivo === 1 && 'Hemos recibido tu orden'}
                    {pasoActivo === 2 && '¡Cocinando tus platos tradicionales!'}
                    {pasoActivo === 3 && (esDelivery ? 'El repartidor va rumbo a tu casa' : 'Tu mesa te espera servida')}
                    {pasoActivo === 4 && '¡Buen provecho! Pedido entregado'}
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: '#a8b89a', lineHeight: 1.35 }}>
                    {pasoActivo === 1 && (df.pago_confirmado ? 'Pago verificado. Entrando a cocina...' : 'Verificando tu comprobante de pago.')}
                    {pasoActivo === 2 && 'Nuestros chefs están preparando tu comida con la receta tradicional.'}
                    {pasoActivo === 3 && (esDelivery ? `En camino a: ${df.direccion || 'tu dirección'}.` : 'Pasa directamente a tu mesa reservada.')}
                    {pasoActivo === 4 && 'Gracias por preferir El Jardín.'}
                  </p>
                </div>
              </div>

              {/* STEPPER / LÍNEA DE TIEMPO VISUAL */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', margin: '4px 6px' }}>
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '20px',
                  right: '20px',
                  height: '3px',
                  background: 'rgba(255,255,255,0.08)',
                  zIndex: 0
                }}>
                  <div style={{
                    height: '100%',
                    background: 'var(--gold)',
                    width: pasoActivo === 1 ? '0%' : pasoActivo === 2 ? '33%' : pasoActivo === 3 ? '66%' : '100%',
                    transition: 'width 0.5s ease'
                  }} />
                </div>

                {[
                  { n: 1, label: 'Recibido', icon: <Clock size={12} /> },
                  { n: 2, label: 'En Cocina', icon: <ChefHat size={12} /> },
                  { n: 3, label: esDelivery ? 'En Camino' : 'Listo', icon: esDelivery ? <Bike size={12} /> : <Store size={12} /> },
                  { n: 4, label: 'Entregado', icon: <CheckCircle2 size={12} /> },
                ].map((st) => {
                  const alcanzado = pasoActivo >= st.n;
                  const esActual = pasoActivo === st.n;

                  return (
                    <div key={st.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: '6px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: alcanzado ? 'var(--gold)' : '#162214',
                        border: `2px solid ${alcanzado ? 'var(--gold-light)' : 'rgba(255,255,255,0.15)'}`,
                        color: alcanzado ? '#000' : '#888',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        boxShadow: esActual ? '0 0 14px rgba(200,144,58,0.6)' : 'none',
                        transition: 'all 0.3s'
                      }}>
                        {st.icon}
                      </div>
                      <span style={{ fontSize: '10.5px', color: alcanzado ? '#fff' : '#666', fontWeight: esActual ? 'bold' : 'normal' }}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* DETALLE DEL CLIENTE Y ENTREGA */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '14px',
                fontSize: '12.5px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#888' }}>Cliente:</span>
                  <strong style={{ color: '#fff' }}>{df.cliente_nombre || 'Cliente'}</strong>
                </div>

                {esDelivery ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ color: '#888' }}>Dirección:</span>
                      <span style={{ color: '#ddd', textAlign: 'right', maxWidth: '65%' }}>
                        {df.direccion || 'S/D'} {df.zona ? `(${df.zona})` : ''}
                      </span>
                    </div>
                    {df.google_maps_url && (
                      <div style={{ textAlign: 'right' }}>
                        <a 
                          href={df.google_maps_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ color: 'var(--gold)', fontSize: '11.5px', textDecoration: 'underline' }}
                        >
                          📍 Ver Ubicación GPS Marcada
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Reserva para:</span>
                    <span style={{ color: '#ddd' }}>
                      {df.fecha_reserva || 'Hoy'} a las {df.hora_reserva || 'Horario pactado'} ({df.personas || 2} personas)
                    </span>
                  </div>
                )}
              </div>

              {/* ESTADO FINANCIERO Y PAGO */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1.5px solid rgba(200,144,58,0.3)',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>Total de Platos:</span>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>Bs. {total.toFixed(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>Anticipo Registrado:</span>
                  <span style={{ color: '#22c55e', fontWeight: 'bold' }}>Bs. {anticipo.toFixed(0)}</span>
                </div>

                {/* Saldo a cobrar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <span style={{ color: saldoPendiente > 0 ? '#f59e0b' : '#22c55e', fontWeight: 'bold' }}>
                    {saldoPendiente > 0 ? 'Falta Pagar en la Entrega:' : 'Estado de Pago:'}
                  </span>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    color: saldoPendiente > 0 ? '#f59e0b' : '#22c55e'
                  }}>
                    {saldoPendiente > 0 ? `Bs. ${saldoPendiente.toFixed(0)}` : '✅ 100% Pagado'}
                  </span>
                </div>

                {esDelivery && (
                  <div style={{
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '11px',
                    color: '#e9d5ff',
                    marginTop: '2px',
                    lineHeight: 1.4
                  }}>
                    🛵 <strong>Costo del Envío:</strong> Te lo enviaremos por WhatsApp lo más pronto posible según la distancia exacta de entrega.
                  </div>
                )}
              </div>

              {/* LISTA DE PLATOS */}
              {pedido?.items && pedido.items.length > 0 && (
                <div>
                  <h5 style={{ margin: '0 0 8px', fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Platos en tu orden:
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {pedido.items.map((it, idx) => (
                      <div 
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          fontSize: '12px'
                        }}
                      >
                        <span style={{ color: '#fff', fontWeight: '500' }}>
                          {it.cantidad}× {it.nombre_item}
                        </span>
                        <span style={{ color: 'var(--gold-light)', fontFamily: 'monospace', fontWeight: 'bold' }}>
                          Bs. {Number(it.subtotal || (it.precio_unitario * it.cantidad) || 0).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Botones Inferiores de Acción */}
        <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={abrirWhatsAppRestaurante}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '12px',
              background: '#25D366',
              border: 'none',
              color: '#000',
              fontWeight: 'bold',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37,211,102,0.3)'
            }}
          >
            <MessageCircle size={18} />
            Coordinar con Restaurante por WhatsApp
          </button>

          <button
            type="button"
            onClick={onCerrar}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#ccc',
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            Cerrar Ventana de Seguimiento
          </button>
        </div>
      </div>
    </div>
  );
}
