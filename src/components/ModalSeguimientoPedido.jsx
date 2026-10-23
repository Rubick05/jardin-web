import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, ChefHat, Bike, Store, CheckCircle2, AlertCircle, 
  RefreshCw, X, MessageCircle, MapPin, Phone, ShieldCheck, DollarSign, Search,
  QrCode, Camera, Upload, ArrowLeft
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { consultarEstadoPedido, buscarPedidosPorTelefono } from '../lib/api-menu';
import { extraerIdPedidoDeTexto, escanearImagenQR } from '../lib/utils-qr';

export default function ModalSeguimientoPedido({ pedidoId, pedidoInicial = null, onCerrar }) {
  const [pedido, setPedido] = useState(pedidoInicial);
  const [cargando, setCargando] = useState(Boolean(pedidoId && !pedidoInicial));
  const [error, setError] = useState(null);
  const [actualizando, setActualizando] = useState(false);
  const [codigoBusqueda, setCodigoBusqueda] = useState(pedidoId || '');
  const [modoBusquedaManual, setModoBusquedaManual] = useState(!pedidoId && !pedidoInicial);
  
  // Modos de escaneo QR
  const [modoEscanerCamara, setModoEscanerCamara] = useState(false);
  const [procesandoQR, setProcesandoQR] = useState(false);
  const fileQrInputRef = useRef(null);
  const html5QrCodeRef = useRef(null);

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
        setModoEscanerCamara(false);
        // Guardar como pedido activo en localStorage
        try {
          localStorage.setItem('jardin_pedido_activo', JSON.stringify({
            id: data.id,
            codigo: data.numero_ficha ? `DEL-${data.numero_ficha}` : data.id.slice(0, 8).toUpperCase(),
            fecha: Date.now()
          }));
        } catch {}
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

  // Subir imagen del QR desde galería o archivos
  const handleSubirFotoQR = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setProcesandoQR(true);
      setError(null);
      const codigoExtraido = await escanearImagenQR(file, 'qr-scanner-temp-container');
      if (codigoExtraido) {
        setCodigoBusqueda(codigoExtraido);
        await cargarPedido(false, codigoExtraido);
      } else {
        setError('No se pudo leer el código QR en la imagen. Intenta con una foto más nítida.');
      }
    } catch (err) {
      console.error('Error al decodificar QR:', err);
      setError(err.message || 'Error al procesar la foto del código QR.');
    } finally {
      setProcesandoQR(false);
      if (fileQrInputRef.current) fileQrInputRef.current.value = '';
    }
  };

  // Iniciar escaneo en vivo con cámara
  const iniciarCamara = async () => {
    setError(null);
    setModoEscanerCamara(true);
    
    // Pequeño timeout para asegurar que el DOM del contenedor esté montado
    setTimeout(async () => {
      try {
        const qrContainer = document.getElementById('qr-camera-stream');
        if (!qrContainer) return;

        const qrScanner = new Html5Qrcode('qr-camera-stream');
        html5QrCodeRef.current = qrScanner;

        await qrScanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 }
          },
          async (decodedText) => {
            const idEncontrado = extraerIdPedidoDeTexto(decodedText);
            if (idEncontrado) {
              detenerCamara();
              setCodigoBusqueda(idEncontrado);
              await cargarPedido(false, idEncontrado);
            }
          },
          () => {
            // Error de frame individual, se ignora
          }
        );
      } catch (err) {
        console.warn('Error al iniciar cámara:', err);
        setError('No se pudo acceder a la cámara. Por favor autoriza los permisos o sube una foto del QR.');
        setModoEscanerCamara(false);
      }
    }, 200);
  };

  const detenerCamara = () => {
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current?.clear();
          html5QrCodeRef.current = null;
        }).catch(() => {});
      } catch {}
    }
    setModoEscanerCamara(false);
  };

  // Limpiar cámara al desmontar
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().catch(() => {});
        } catch {}
      }
    };
  }, []);

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
  else if (estado === 'en_camino' || estado === 'listo') pasoActivo = 3;
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
    const telefonoRestaurante = '59169466547';
    const msg = encodeURIComponent(
      `Hola *El Jardín*, consulto por el estado de mi pedido ${codigoDisplay} a nombre de *${df.cliente_nombre || 'Cliente'}*. ¿Cómo va la preparación?`
    );
    window.open(`https://wa.me/${telefonoRestaurante}?text=${msg}`, '_blank');
  };

  return (
    <div 
      className="cart-drawer-backdrop"
      style={{
        zIndex: 11000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px',
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(10px)',
        position: 'fixed',
        inset: 0,
        overflowY: 'auto'
      }}
      onClick={onCerrar}
    >
      <div 
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'linear-gradient(180deg, #121c10 0%, #0c140a 100%)',
          border: '1.5px solid var(--gold)',
          borderRadius: '24px',
          padding: '22px 20px',
          boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 40px rgba(200,144,58,0.25)',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
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
            <h3 style={{ margin: '6px 0 0', fontSize: '18px', color: '#fff', fontFamily: 'serif', fontWeight: 'bold' }}>
              Rastreo de Pedido en Vivo
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {pedido && !modoBusquedaManual && (
              <button
                type="button"
                onClick={() => setModoBusquedaManual(true)}
                title="Buscar o escanear otro pedido"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '100px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  color: 'var(--gold-light)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Search size={12} />
                <span>Cambiar</span>
              </button>
            )}

            {pedido && !modoBusquedaManual && (
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
            )}

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

        {/* Contenido desplazable */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '2px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Mensaje de Error si ocurre */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#fca5a5',
              fontSize: '12.5px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              MODO BÚSQUEDA Y ESCANEO QR (Si no hay pedido o el usuario quiere buscar)
             ════════════════════════════════════════════════════════════════════ */}
          {modoBusquedaManual && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '18px',
              padding: '18px',
              border: '1px solid rgba(74, 124, 63, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', display: 'block' }}>
                  ¿Cómo deseas rastrear tu pedido?
                </span>
                <p style={{ fontSize: '11.5px', color: '#a8b89a', margin: '4px 0 0' }}>
                  Escanea tu QR con la cámara, sube tu foto del QR o escribe tu número.
                </p>
              </div>

              {/* Botones de Escaneo QR */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                
                {/* 1. Botón Escanear con Cámara */}
                <button
                  type="button"
                  onClick={iniciarCamara}
                  style={{
                    padding: '14px 10px',
                    borderRadius: '12px',
                    background: 'rgba(200, 144, 58, 0.16)',
                    border: '1.5px solid var(--gold)',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  <Camera size={22} color="var(--gold-light)" />
                  <span>Escanear QR con Cámara</span>
                </button>

                {/* 2. Botón Subir Foto del QR */}
                <button
                  type="button"
                  disabled={procesandoQR}
                  onClick={() => fileQrInputRef.current?.click()}
                  style={{
                    padding: '14px 10px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={22} color="var(--gold-light)" />
                  <span>{procesandoQR ? 'Analizando...' : 'Subir Foto del QR'}</span>
                </button>

                {/* Input oculto para archivo QR */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileQrInputRef}
                  onChange={handleSubirFotoQR}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Contenedor de la cámara en vivo */}
              {modoEscanerCamara && (
                <div style={{
                  background: '#000',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '2px solid var(--gold)',
                  position: 'relative',
                  padding: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', padding: '0 4px' }}>
                    <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>
                      Enfoca el código QR con tu cámara:
                    </span>
                    <button
                      type="button"
                      onClick={detenerCamara}
                      style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <X size={13} /> Cancelar cámara
                    </button>
                  </div>
                  <div id="qr-camera-stream" style={{ width: '100%', minHeight: '220px', borderRadius: '8px', overflow: 'hidden' }} />
                </div>
              )}

              {/* 3. Búsqueda manual como alternativa */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                <span style={{ display: 'block', fontSize: '11.5px', color: '#a8b89a', marginBottom: '8px', textAlign: 'center' }}>
                  O ingresa tu número de WhatsApp o código:
                </span>
                <form onSubmit={handleBuscarManual} style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={15} color="var(--gold-light)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="Ej. 71234567 o DEL-101"
                      value={codigoBusqueda}
                      onChange={(e) => setCodigoBusqueda(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 10px 10px 34px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(74, 124, 63, 0.3)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={cargando}
                    style={{
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, #e8af60 0%, #c8903a 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#0f1710',
                      fontSize: '12.5px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {cargando ? 'Buscando...' : 'Buscar'}
                  </button>
                </form>
              </div>

              {pedido && (
                <button
                  type="button"
                  onClick={() => setModoBusquedaManual(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--gold-light)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <ArrowLeft size={13} /> Volver a ver mi pedido actual (#{codigoDisplay})
                </button>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              INFORMACIÓN DETALLADA DEL PEDIDO ENCONTRADO
             ════════════════════════════════════════════════════════════════════ */}
          {pedido && !modoBusquedaManual && (
            <>
              {/* TARJETA DESTACADA: ¿DÓNDE ESTÁ TU PEDIDO AHORA? */}
              <div style={{
                background: pasoActivo === 3 && esDelivery 
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(16,28,12,0.9) 100%)' 
                  : (pasoActivo === 2 
                      ? 'linear-gradient(135deg, rgba(200,144,58,0.2) 0%, rgba(16,28,12,0.9) 100%)' 
                      : 'rgba(255,255,255,0.03)'),
                border: pasoActivo === 3 ? '1.5px solid #22c55e' : '1.5px solid var(--gold)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: pasoActivo === 3 ? '#22c55e' : 'var(--gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0f1710',
                  flexShrink: 0,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                }}>
                  {pasoActivo === 1 && <Clock size={22} />}
                  {pasoActivo === 2 && <ChefHat size={22} />}
                  {pasoActivo === 3 && (esDelivery ? <Bike size={24} /> : <Store size={22} />)}
                  {pasoActivo === 4 && <CheckCircle2 size={24} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--gold-light)', fontWeight: 'bold' }}>
                    {esDelivery ? 'Ubicación del Pedido:' : 'Estado de la Reserva:'}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff', margin: '2px 0' }}>
                    {pasoActivo === 1 && '📝 Recibido en Cocina'}
                    {pasoActivo === 2 && '👨‍🍳 Sigue en el Local (En Preparación)'}
                    {pasoActivo === 3 && (esDelivery ? '🛵 ¡Ya Salió! En Camino con el Repartidor' : '🍽️ ¡Mesa Lista en el Restaurante!')}
                    {pasoActivo === 4 && '✅ Entregado al Cliente'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#cddbc5', lineHeight: '1.3' }}>
                    {pasoActivo === 1 && 'El pedido está registrado y en verificación para encender fogones.'}
                    {pasoActivo === 2 && 'Los cocineros de El Jardín están elaborando tus platos en nuestras instalaciones.'}
                    {pasoActivo === 3 && (esDelivery 
                      ? 'El chofer recogió tu comida del local y va en trayecto hacia tu dirección.' 
                      : 'Tu mesa está reservada y la comida lista esperándote en el restaurante.')}
                    {pasoActivo === 4 && '¡Buen provecho! Gracias por preferir el sabor y tradición de El Jardín.'}
                  </div>
                </div>
              </div>

              {/* LÍNEA DE TIEMPO / STEPPER VISUAL */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                {[
                  { paso: 1, label: 'Recibido', icon: Clock },
                  { paso: 2, label: 'En Cocina', icon: ChefHat },
                  { paso: 3, label: esDelivery ? 'En Camino' : 'Mesa Lista', icon: esDelivery ? Bike : Store },
                  { paso: 4, label: 'Entregado', icon: CheckCircle2 }
                ].map((st) => {
                  const Icon = st.icon;
                  const isActive = pasoActivo >= st.paso;
                  const isCurrent = pasoActivo === st.paso;
                  return (
                    <div 
                      key={st.paso} 
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: isActive ? 1 : 0.4
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isCurrent ? 'var(--gold)' : (isActive ? 'rgba(200,144,58,0.3)' : 'rgba(255,255,255,0.05)'),
                        border: isCurrent ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isCurrent ? '#0f1710' : (isActive ? 'var(--gold-light)' : '#888')
                      }}>
                        <Icon size={15} />
                      </div>
                      <span style={{ fontSize: '10.5px', color: isCurrent ? 'var(--gold-light)' : '#a8b89a', fontWeight: isCurrent ? 'bold' : 'normal' }}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* DESGLOSE FINANCIERO Y SALDO PENDIENTE */}
              <div style={{
                background: 'rgba(0,0,0,0.35)',
                borderRadius: '14px',
                padding: '14px',
                border: '1px solid rgba(74, 124, 63, 0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#a8b89a' }}>Total de la Comanda:</span>
                  <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>Bs. {total}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} /> Anticipo Pagado:
                  </span>
                  <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: 'bold' }}>Bs. {anticipo}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  paddingTop: '8px'
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: saldoPendiente > 0 ? '#f59e0b' : '#fff' }}>
                    {saldoPendiente > 0 ? 'Saldo Restante por Pagar:' : 'Estado de Pago:'}
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: saldoPendiente > 0 ? '#f59e0b' : '#22c55e', fontFamily: 'monospace' }}>
                    {saldoPendiente > 0 ? `Bs. ${saldoPendiente}` : 'Totalmente Cancelado'}
                  </span>
                </div>

                {saldoPendiente > 0 && !esDelivery && (
                  <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#a8b89a' }}>
                    * El saldo de Bs. {saldoPendiente} se abona directamente en caja o a tu mesero al finalizar tu atención.
                  </p>
                )}
              </div>

              {/* DATOS DE CONTACTO Y DIRECCIÓN */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '12px',
                color: '#cddbc5',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div><strong>Cliente:</strong> {df.cliente_nombre || 'Cliente'} ({df.cliente_telefono || 'Sin teléfono'})</div>
                {esDelivery && df.direccion && (
                  <div><strong>Entrega en:</strong> {df.direccion} {df.zona ? `(${df.zona})` : ''}</div>
                )}
                {!esDelivery && df.fecha_reserva && (
                  <div><strong>Reserva para:</strong> {df.fecha_reserva} a las {df.hora_reserva || '13:00'} ({df.personas || 2} comensales)</div>
                )}
              </div>

              {/* BOTÓN DE AYUDA DIRECTA POR WHATSAPP */}
              <button
                type="button"
                onClick={abrirWhatsAppRestaurante}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1.5px solid #22c55e',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <MessageCircle size={18} color="#22c55e" />
                <span>¿Consultas sobre tu pedido? Escríbenos por WhatsApp</span>
              </button>
            </>
          )}

          {/* Estado de carga */}
          {cargando && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--gold-light)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', display: 'block' }} />
              <span style={{ fontSize: '13px' }}>Consultando estado con el restaurante...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
