import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingBag, CheckCircle2, AlertCircle, X, Upload, 
  Bike, Store, DollarSign, ArrowRight, ShieldCheck, Download,
  Calendar, Clock, Users, MapPin, Phone, User, QrCode, MessageCircle,
  Plus, Minus, Trash2, Navigation, Link2, ExternalLink, Loader2
} from 'lucide-react';
import { comprimirImagenLocal } from '../lib/utils-imagen';
import { generarQRDataURL, descargarQR } from '../lib/utils-qr';
import { linkWhatsApp } from '../lib/config-contacto';

/**
 * Intenta extraer lat/lng de un enlace de Google Maps o de un texto "lat, lng".
 * Los enlaces cortos (maps.app.goo.gl) no contienen coordenadas: se guardan tal cual.
 */
function extraerCoordsDeLink(texto) {
  if (!texto) return null;
  let t = String(texto).trim();
  try { t = decodeURIComponent(t); } catch { /* texto con % inválido: usar tal cual */ }
  const patrones = [
    /@(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/,                         // .../@-17.38,-66.15,17z
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/,                         // ...!3d-17.38!4d-66.15
    /[?&](?:q|query|ll|destination|center)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/, // ?q=-17.38,-66.15
    /^(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)$/                          // "-17.38, -66.15"
  ];
  for (const re of patrones) {
    const m = t.match(re);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

function esLinkGoogleMaps(texto) {
  return /^(https?:\/\/)?((www\.|maps\.)?google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.[a-z.]+)/i.test(String(texto).trim());
}

/**
 * Prepara el texto formateado para enviar el resumen del pedido directamente por WhatsApp.
 */
function construirResumenPedidoWhatsApp(p) {
  if (!p) return '';
  const tipo = p.tipoEntrega === 'local' 
    ? '🍽️ Reserva en Mesa' 
    : (p.tipoEntrega === 'recoger' ? '🥡 Para Recoger en Local' : '🛵 Delivery a Domicilio');

  let msg = `*RESTAURANTE EL JARDÍN - TRADICIÓN KOCHALA*\n`;
  msg += `Hola! 👋 Acabo de confirmar mi pedido online:\n\n`;
  msg += `🔖 *CÓDIGO DE PEDIDO: #${p.codigo}*\n`;
  msg += `👤 *Cliente:* ${p.nombre}\n`;
  msg += `📱 *Teléfono:* ${p.telefono}\n`;
  msg += `🏷️ *Modalidad:* ${tipo}\n`;

  if (p.tipoEntrega === 'local') {
    if (p.fecha) msg += `📅 *Fecha:* ${p.fecha}\n`;
    if (p.hora) msg += `⏰ *Hora:* ${p.hora}\n`;
    if (p.personas) msg += `👥 *Personas:* ${p.personas}\n`;
  } else if (p.tipoEntrega === 'recoger') {
    if (p.hora) msg += `⏰ *Hora de recojo:* ${p.hora}\n`;
  } else {
    if (p.direccion) msg += `📍 *Dirección:* ${p.direccion}\n`;
    if (p.zona) msg += `🏘️ *Zona:* ${p.zona}\n`;
    if (p.referencia) msg += `ℹ️ *Referencia:* ${p.referencia}\n`;
    if (p.googleMapsUrl) msg += `🗺️ *Ubicación Maps:* ${p.googleMapsUrl}\n`;
  }

  msg += `\n📋 *Detalle del Pedido:*\n`;
  if (Array.isArray(p.itemsSeleccionados) && p.itemsSeleccionados.length > 0) {
    p.itemsSeleccionados.forEach(it => {
      const cant = it.cantidad || 1;
      const sub = (it.precio_actual || 0) * cant;
      msg += `  • ${cant}x ${it.nombre} — Bs. ${sub.toFixed(2)}\n`;
    });
  }

  msg += `\n💰 *Total Estimado:* Bs. ${Number(p.totalEstimado || 0).toFixed(2)}\n`;
  msg += `💳 *Anticipo Abonado:* Bs. ${Number(p.montoAnticipo || 0).toFixed(2)}\n`;
  if (p.saldoPendiente > 0) {
    msg += `⚖️ *Saldo Pendiente:* Bs. ${Number(p.saldoPendiente || 0).toFixed(2)}\n`;
  }
  if (p.notasAdicionales) {
    msg += `💬 *Notas:* ${p.notasAdicionales}\n`;
  }
  msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `Quedo atento(a) a la confirmación de mi pedido por WhatsApp. ¡Muchas gracias!`;

  return msg;
}

export default function ModalCheckoutLanding({
  isOpen,
  onClose,
  pedido,
  setPedido,
  menuItems = [],
  qrPagoRestaurante,
  onConfirmarPedido,
  enviandoPedido,
  onAbrirSeguimiento,
  modalidadInicial = 'delivery',
  usuario = null,
  perfil = null,
  onAbrirLogin = null
}) {
  const [paso, setPaso] = useState(1);
  const [tipoEntrega, setTipoEntrega] = useState(modalidadInicial);
  
  // Datos del cliente
  const [nombre, setNombre] = useState(perfil?.nombre || '');
  const [telefono, setTelefono] = useState(perfil?.telefono || '');

  useEffect(() => {
    if (perfil) {
      if (perfil.nombre && !nombre) setNombre(perfil.nombre);
      if (perfil.telefono && !telefono) setTelefono(perfil.telefono);
    }
  }, [perfil]);
  
  // Domicilio
  const [direccion, setDireccion] = useState('');
  const [zona, setZona] = useState('Norte (Querú Querú / Las Cuadras)');
  const [referencia, setReferencia] = useState('');
  const [linkMaps, setLinkMaps] = useState('');
  const [coords, setCoords] = useState(null);
  const [obteniendoGps, setObteniendoGps] = useState(false);
  const [avisoUbicacion, setAvisoUbicacion] = useState(null); // { tipo: 'ok' | 'error' | 'info', texto }
  
  // Local
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState('13:00');
  const [personas, setPersonas] = useState(2);
  const [notasAdicionales, setNotasAdicionales] = useState('');

  // Pago
  const [imagenPago, setImagenPago] = useState(null);
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState(null);
  const [qrClienteDataUrl, setQrClienteDataUrl] = useState('');
  const fileInputRef = useRef(null);

  // Sincronizar modalidad inicial si cambia
  useEffect(() => {
    if (modalidadInicial) {
      setTipoEntrega(modalidadInicial);
    }
  }, [modalidadInicial]);

  // Si no está abierto, no renderizar
  if (!isOpen) return null;

  // Lista de ítems seleccionados con sus datos
  const itemsSeleccionados = Object.entries(pedido)
    .filter(([_, qty]) => qty > 0)
    .map(([id, cantidad]) => {
      const plato = menuItems.find(p => String(p.id) === String(id)) || {};
      const precio = Number(plato.precio_actual ?? plato.precio ?? 0);
      return {
        id,
        nombre: plato.nombre || 'Plato Tradicional',
        precio,
        cantidad,
        subtotal: precio * cantidad,
        imagen: plato.imagenResuelta || plato.imagen_base64 || plato.url_imagen || '/hero-el-jardin.jpg'
      };
    });

  const totalEstimado = itemsSeleccionados.reduce((acc, it) => acc + it.subtotal, 0);
  const totalCantidad = itemsSeleccionados.reduce((acc, it) => acc + it.cantidad, 0);

  const esDelivery = tipoEntrega === 'delivery';
  const esLocal = tipoEntrega === 'local';
  const esRecoger = tipoEntrega === 'recoger';

  // Reglas de negocio:
  // - Local: 50% anticipo obligatorio (la mitad)
  // - Delivery: 100% productos anticipado + costo envío por WhatsApp
  // - Recoger: 100% productos anticipado
  const montoAnticipo = esLocal 
    ? Math.round(totalEstimado * 0.5) 
    : Math.round(totalEstimado);

  const saldoPendiente = Math.max(0, Math.round(totalEstimado - montoAnticipo));

  const incrementar = (id) => {
    setPedido(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const decrementar = (id) => {
    setPedido(prev => {
      const n = { ...prev };
      if (n[id] > 1) n[id]--;
      else delete n[id];
      return n;
    });
  };

  const eliminar = (id) => {
    setPedido(prev => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  };

  // ─── Ubicación: link de Google Maps / GPS actual ─────────────────────────
  const urlMapsFinal = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : (linkMaps.trim() || '');

  const completarDireccionDesdeCoords = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data?.display_name) {
        const corta = data.display_name.split(',').slice(0, 3).join(',').trim();
        setDireccion(prev => (prev.trim() ? prev : corta));
      }
    } catch (err) {
      console.warn('Reverse geocoding no disponible:', err);
    }
  };

  const handleCambioLinkMaps = (valor) => {
    setLinkMaps(valor);
    const v = valor.trim();
    if (!v) {
      setCoords(null);
      setAvisoUbicacion(null);
      return;
    }
    const c = extraerCoordsDeLink(v);
    if (c) {
      setCoords(c);
      setAvisoUbicacion({ tipo: 'ok', texto: `Ubicación detectada (${c.lat.toFixed(5)}, ${c.lng.toFixed(5)})` });
      completarDireccionDesdeCoords(c.lat, c.lng);
    } else if (esLinkGoogleMaps(v)) {
      setCoords(null);
      setAvisoUbicacion({ tipo: 'info', texto: 'Enlace de Google Maps guardado. El repartidor lo abrirá directamente.' });
    } else {
      setCoords(null);
      setAvisoUbicacion({ tipo: 'error', texto: 'Esto no parece un enlace de Google Maps. Pega el link desde "Compartir" en Google Maps.' });
    }
  };

  const obtenerUbicacionActual = () => {
    if (!navigator.geolocation) {
      setAvisoUbicacion({ tipo: 'error', texto: 'Tu navegador no soporta geolocalización. Pega el link de Google Maps.' });
      return;
    }
    setObteniendoGps(true);
    setAvisoUbicacion({ tipo: 'info', texto: 'Obteniendo tu ubicación…' });

    const exito = (pos) => {
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCoords(c);
      setLinkMaps(`https://www.google.com/maps?q=${c.lat},${c.lng}`);
      setObteniendoGps(false);
      const precision = Math.round(pos.coords.accuracy || 0);
      setAvisoUbicacion({
        tipo: 'ok',
        texto: `Ubicación actual capturada${precision ? ` (precisión ±${precision} m)` : ''}`
      });
      completarDireccionDesdeCoords(c.lat, c.lng);
    };

    const fallo = (err) => {
      setObteniendoGps(false);
      const msg = err?.code === 1
        ? 'Permiso de ubicación denegado. Actívalo en tu navegador o pega el link de Google Maps.'
        : 'No pudimos obtener tu ubicación. Intenta de nuevo o pega el link de Google Maps.';
      setAvisoUbicacion({ tipo: 'error', texto: msg });
    };

    // Alta precisión primero; si expira, reintento con precisión normal (interiores / red móvil)
    navigator.geolocation.getCurrentPosition(
      exito,
      (err) => {
        if (err?.code === 1) return fallo(err);
        navigator.geolocation.getCurrentPosition(exito, fallo, {
          enableHighAccuracy: false, timeout: 10000, maximumAge: 60000
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleSubirComprobante = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida de comprobante.');
      return;
    }

    try {
      setProcesandoFoto(true);
      const comprimida = await comprimirImagenLocal(file, 900, 0.82);
      setImagenPago(comprimida);
    } catch (err) {
      console.error('Error al procesar comprobante:', err);
      alert('No se pudo procesar la imagen del comprobante.');
    } finally {
      setProcesandoFoto(false);
    }
  };

  const handleValidarPaso1 = (e) => {
    e.preventDefault();
    if (itemsSeleccionados.length === 0) {
      alert('Por favor selecciona al menos un plato de la carta antes de continuar.');
      return;
    }
    if (!nombre.trim()) {
      alert('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!telefono.trim() || telefono.trim().length < 6) {
      alert('Por favor ingresa un número de teléfono o WhatsApp válido.');
      return;
    }
    if (esDelivery && !direccion.trim()) {
      alert('Por favor ingresa tu dirección exacta de entrega.');
      return;
    }
    if (esDelivery && linkMaps.trim() && !coords && !esLinkGoogleMaps(linkMaps)) {
      alert('El enlace de ubicación no es válido. Pega un link de Google Maps o usa "Mi ubicación actual".');
      return;
    }
    setPaso(2);
  };

  const handleConfirmarYGenerarQR = async () => {
    if (itemsSeleccionados.length === 0) {
      alert('No hay platos seleccionados.');
      return;
    }

    const payload = {
      tipoEntrega,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      direccion: esDelivery ? direccion.trim() : '',
      zona: esDelivery ? zona : '',
      referencia: esDelivery ? referencia.trim() : '',
      coords: esDelivery ? coords : null,
      googleMapsUrl: esDelivery ? urlMapsFinal : '',
      deposito: montoAnticipo,
      idCliente: usuario?.id || null,
      fecha: esLocal ? fecha : '',
      hora: esLocal ? hora : (esRecoger ? hora : ''),
      personas: esLocal ? personas : 1,
      notasAdicionales: notasAdicionales.trim(),
      itemsSeleccionados,
      totalEstimado,
      montoAnticipo,
      saldoPendiente,
      imagenPago
    };

    const res = await onConfirmarPedido(payload);
    if (res && res.ok) {
      const codigo = res.codigo || res.id?.slice(0, 8).toUpperCase() || 'DEL-101';
      const trackingUrl = `${window.location.origin}/?rastrear=${res.id || codigo}`;
      
      // Generar código QR único para el cliente
      const qrData = await generarQRDataURL(trackingUrl);
      setQrClienteDataUrl(qrData);
      setPedidoCreado({ ...payload, id: res.id, codigo, trackingUrl });
      setPaso(3);
    } else {
      alert('Ocurrió un error al registrar el pedido. Por favor verifica tu conexión y vuelve a intentarlo.');
    }
  };

  return (
    <div 
      className="cart-drawer-backdrop"
      style={{
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        position: 'fixed',
        inset: 0,
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && paso !== 3 && !enviandoPedido) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          maxWidth: '540px',
          width: '100%',
          background: 'linear-gradient(180deg, #131d10 0%, #0c140a 100%)',
          border: '1.5px solid var(--gold)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(200, 144, 58, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
          position: 'relative',
          animation: 'modalFadeIn 0.25s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(74, 124, 63, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🌱</span>
              <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#fff', margin: 0, fontFamily: 'serif' }}>
                {paso === 1 && 'Confirmar Detalles del Pedido'}
                {paso === 2 && 'Confirmación de Pago'}
                {paso === 3 && '¡Pedido Recibido con Éxito!'}
              </h2>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#a8b89a' }}>
              {paso === 1 && 'Paso 1 de 2: Modalidad y datos de contacto'}
              {paso === 2 && 'Paso 2 de 2: Pago según la modalidad y comprobante'}
              {paso === 3 && 'Tu código QR único de seguimiento está listo'}
            </p>
          </div>

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

        {/* Contenido con scroll */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ════════════════════════════════════════════════════════════════════════
              PASO 1: DATOS DEL CLIENTE Y MODALIDAD DE ENTREGA
             ════════════════════════════════════════════════════════════════════════ */}
          {paso === 1 && (
            <form onSubmit={handleValidarPaso1} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Selector de Modalidad */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--gold-light)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ¿Cómo deseas tu pedido?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setTipoEntrega('delivery')}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '12px',
                      border: esDelivery ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                      background: esDelivery ? 'rgba(200,144,58,0.18)' : 'rgba(255,255,255,0.03)',
                      color: esDelivery ? '#fff' : '#a8b89a',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11.5px',
                      fontWeight: esDelivery ? 'bold' : 'normal'
                    }}
                  >
                    <Bike size={20} color={esDelivery ? 'var(--gold)' : '#a8b89a'} />
                    <span>A Domicilio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoEntrega('local')}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '12px',
                      border: esLocal ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                      background: esLocal ? 'rgba(200,144,58,0.18)' : 'rgba(255,255,255,0.03)',
                      color: esLocal ? '#fff' : '#a8b89a',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11.5px',
                      fontWeight: esLocal ? 'bold' : 'normal'
                    }}
                  >
                    <Store size={20} color={esLocal ? 'var(--gold)' : '#a8b89a'} />
                    <span>En el Local</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoEntrega('recoger')}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '12px',
                      border: esRecoger ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
                      background: esRecoger ? 'rgba(200,144,58,0.18)' : 'rgba(255,255,255,0.03)',
                      color: esRecoger ? '#fff' : '#a8b89a',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11.5px',
                      fontWeight: esRecoger ? 'bold' : 'normal'
                    }}
                  >
                    <ShoppingBag size={20} color={esRecoger ? 'var(--gold)' : '#a8b89a'} />
                    <span>Para Recoger</span>
                  </button>
                </div>
              </div>

              {/* Resumen de Platos Seleccionados */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '14px',
                padding: '14px',
                border: '1px solid rgba(74, 124, 63, 0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShoppingBag size={14} color="var(--gold)" /> Platos Seleccionados ({totalCantidad})
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--gold)' }}>
                    Bs. {totalEstimado}
                  </span>
                </div>

                {itemsSeleccionados.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#888', textAlign: 'center', margin: '8px 0' }}>
                    Aún no has agregado platos. Selecciona tus platos en la carta antes de continuar.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {itemsSeleccionados.map((it) => (
                      <div 
                        key={it.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.02)',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                          <img 
                            src={it.imagen} 
                            alt={it.nombre} 
                            style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} 
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {it.nombre}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--gold-light)' }}>
                              Bs. {it.precio} c/u
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '6px', padding: '2px 4px' }}>
                            <button
                              type="button"
                              onClick={() => decrementar(it.id)}
                              style={{ background: 'none', border: 'none', color: '#fff', width: '22px', height: '22px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              −
                            </button>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--gold)', minWidth: '16px', textAlign: 'center' }}>
                              {it.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => incrementar(it.id)}
                              style={{ background: 'none', border: 'none', color: '#fff', width: '22px', height: '22px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => eliminar(it.id)}
                            style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                            title="Eliminar plato"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Indicador de Usuario / Acceso */}
              {usuario ? (
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '10px',
                  fontSize: '11.5px',
                  color: '#86efac',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>✓ Pedido asociado a tu cuenta ({usuario.email})</span>
                  <span style={{ fontSize: '11px', color: 'var(--gold-light)' }}>Mis Pedidos</span>
                </div>
              ) : (
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(200, 144, 58, 0.1)',
                  border: '1px solid rgba(200, 144, 58, 0.25)',
                  borderRadius: '10px',
                  fontSize: '11.5px',
                  color: '#ffefc2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>¿Tienes cuenta en El Jardín?</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onAbrirLogin) onAbrirLogin();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gold)',
                      fontWeight: 'bold',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Iniciar Sesión
                  </button>
                </div>
              )}

              {/* Formulario de Contacto */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#a8b89a', marginBottom: '4px' }}>
                    Teléfono / WhatsApp *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="tel"
                      required
                      placeholder="Ej. 71234567"
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

                {/* Campos condicionales para DELIVERY */}
                {esDelivery && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#a8b89a', marginBottom: '4px' }}>
                        Dirección exacta de entrega *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="text"
                          required
                          placeholder="Calle, número de casa, edificio o condominio"
                          value={direccion}
                          onChange={(e) => setDireccion(e.target.value)}
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
                        <MapPin size={15} color="var(--gold-light)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                    </div>

                    {/* Ubicación exacta: link de Google Maps o GPS actual */}
                    <div style={{
                      background: 'rgba(200,144,58,0.06)',
                      border: '1px solid rgba(200,144,58,0.25)',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <label htmlFor="input-link-maps" style={{ fontSize: '12px', color: 'var(--gold-light)', fontWeight: 'bold' }}>
                        📍 Ubicación exacta para el repartidor
                      </label>

                      <button
                        type="button"
                        id="btn-ubicacion-actual"
                        onClick={obtenerUbicacionActual}
                        disabled={obteniendoGps}
                        style={{
                          width: '100%',
                          padding: '11px',
                          background: obteniendoGps ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, rgba(74,124,63,0.55), rgba(46,82,38,0.7))',
                          border: '1px solid rgba(120,180,100,0.45)',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '12.5px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          cursor: obteniendoGps ? 'wait' : 'pointer',
                          transition: 'transform 0.15s ease, filter 0.15s ease'
                        }}
                        onMouseEnter={(e) => { if (!obteniendoGps) e.currentTarget.style.filter = 'brightness(1.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                      >
                        {obteniendoGps
                          ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                          : <Navigation size={15} />}
                        {obteniendoGps ? 'Buscando tu ubicación…' : 'Usar mi ubicación actual'}
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7d8c72', fontSize: '10.5px' }}>
                        <span style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                        o pega el link de Google Maps
                        <span style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                      </div>

                      <div style={{ position: 'relative' }}>
                        <input
                          id="input-link-maps"
                          type="url"
                          inputMode="url"
                          placeholder="https://maps.app.goo.gl/..."
                          value={linkMaps}
                          onChange={(e) => handleCambioLinkMaps(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px 10px 34px',
                            background: 'rgba(255,255,255,0.04)',
                            border: `1px solid ${avisoUbicacion?.tipo === 'error' ? 'rgba(255,107,107,0.6)' : 'rgba(74, 124, 63, 0.3)'}`,
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '12.5px',
                            outline: 'none'
                          }}
                        />
                        <Link2 size={15} color="var(--gold-light)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>

                      {avisoUbicacion && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          fontSize: '11px',
                          color: avisoUbicacion.tipo === 'ok' ? '#4ade80' : avisoUbicacion.tipo === 'error' ? '#ff8a8a' : '#d4dfce'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {avisoUbicacion.tipo === 'ok' ? <CheckCircle2 size={13} /> : avisoUbicacion.tipo === 'error' ? <AlertCircle size={13} /> : <MapPin size={13} />}
                            {avisoUbicacion.texto}
                          </span>
                          {urlMapsFinal && avisoUbicacion.tipo !== 'error' && (
                            <a
                              href={urlMapsFinal}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap', textDecoration: 'none' }}
                            >
                              Ver <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      )}

                      <p style={{ margin: 0, fontSize: '10.5px', color: '#7d8c72', lineHeight: 1.4 }}>
                        En Google Maps: mantén presionado tu punto → <strong>Compartir</strong> → <strong>Copiar enlace</strong>.
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#a8b89a', marginBottom: '4px' }}>
                          Zona de Cochabamba *
                        </label>
                        <select
                          value={zona}
                          onChange={(e) => setZona(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            background: '#131e11',
                            border: '1px solid rgba(74, 124, 63, 0.3)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '12px',
                            outline: 'none'
                          }}
                        >
                          <option value="Norte (Querú Querú / Las Cuadras)">Norte (Querú Querú / Las Cuadras)</option>
                          <option value="Cala Cala / Sarco">Cala Cala / Sarco</option>
                          <option value="Centro (Plaza Colón / San Martín)">Centro (Plaza Colón / San Martín)</option>
                          <option value="Tupuraya / Recoleta">Tupuraya / Recoleta</option>
                          <option value="Zona Sur">Zona Sur</option>
                          <option value="Sacaba">Sacaba</option>
                          <option value="Quillacollo">Quillacollo</option>
                          <option value="Otra Zona">Otra Zona</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#a8b89a', marginBottom: '4px' }}>
                          Referencia / Portón
                        </label>
                        <input 
                          type="text"
                          placeholder="Portón negro, frente a parque..."
                          value={referencia}
                          onChange={(e) => setReferencia(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(74, 124, 63, 0.3)',
                            borderRadius: '10px',
                            color: '#fff',
                            fontSize: '12px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Campos condicionales para EN EL LOCAL */}
                {esLocal && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: '#a8b89a', marginBottom: '4px' }}>
                        Fecha *
                      </label>
                      <input 
                        type="date"
                        required
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(74, 124, 63, 0.3)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: '#a8b89a', marginBottom: '4px' }}>
                        Hora *
                      </label>
                      <input 
                        type="time"
                        required
                        value={hora}
                        onChange={(e) => setHora(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(74, 124, 63, 0.3)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', color: '#a8b89a', marginBottom: '4px' }}>
                        Personas *
                      </label>
                      <input 
                        type="number"
                        min="1"
                        max="50"
                        required
                        value={personas}
                        onChange={(e) => setPersonas(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(74, 124, 63, 0.3)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Campos condicionales para RECOGER */}
                {esRecoger && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a8b89a', marginBottom: '4px' }}>
                      Hora estimada de recojo en el restaurante *
                    </label>
                    <input 
                      type="time"
                      required
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(74, 124, 63, 0.3)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#a8b89a', marginBottom: '4px' }}>
                    Notas para la cocina o mesero (opcional)
                  </label>
                  <input 
                    type="text"
                    placeholder="Sin picante, llajwa aparte, platos bien calientes..."
                    value={notasAdicionales}
                    onChange={(e) => setNotasAdicionales(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(74, 124, 63, 0.3)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Botón Siguiente */}
              <button
                type="submit"
                disabled={itemsSeleccionados.length === 0}
                style={{
                  marginTop: '6px',
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #e8af60 0%, #c8903a 100%)',
                  border: 'none',
                  borderRadius: '14px',
                  color: '#0f1710',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: itemsSeleccionados.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: itemsSeleccionados.length === 0 ? 0.6 : 1,
                  boxShadow: '0 6px 20px rgba(200,144,58,0.35)'
                }}
              >
                <span>Continuar al Paso 2: Pago</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* ════════════════════════════════════════════════════════════════════════
              PASO 2: PAGO SEGÚN LA NATURALEZA DEL PEDIDO Y SUBIDA DE COMPROBANTE
             ════════════════════════════════════════════════════════════════════════ */}
          {paso === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Desglose de Pago según la naturaleza del pedido */}
              <div style={{
                background: esLocal ? 'rgba(74, 124, 63, 0.15)' : 'rgba(200, 144, 58, 0.12)',
                border: `1.5px solid ${esLocal ? 'var(--gold)' : 'var(--gold)'}`,
                borderRadius: '16px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>
                    {esLocal && 'Anticipo Requerido (50% de la mitad):'}
                    {esDelivery && 'Total a Pagar por Productos (100%):'}
                    {esRecoger && 'Total a Pagar (100%):'}
                  </span>
                  <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--gold-light)', fontFamily: 'monospace' }}>
                    Bs. {montoAnticipo}
                  </span>
                </div>

                {esLocal && (
                  <div style={{ fontSize: '12px', color: '#d4dfce', lineHeight: '1.4' }}>
                    <p style={{ margin: '0 0 6px' }}>
                      🍽️ <strong>Para reserva en local se abona la mitad obligatoria (Bs. {montoAnticipo})</strong> para apartar tu mesa y comenzar la preparación anticipada de los platos en cocina.
                    </p>
                    <p style={{ margin: 0, color: 'var(--gold-light)' }}>
                      Saldo restante: <strong>Bs. {saldoPendiente}</strong> a pagar en el restaurante al momento de ser atendido.
                    </p>
                  </div>
                )}

                {esDelivery && (
                  <div style={{ fontSize: '12px', color: '#fff', lineHeight: '1.4' }}>
                    <p style={{ margin: '0 0 8px' }}>
                      🛵 <strong>Para pedidos a domicilio se debe pagar la totalidad de los productos (Bs. {montoAnticipo})</strong> por adelantado para enviar la comanda directamente a los fogones de cocina.
                    </p>
                    <div style={{
                      background: 'rgba(0,0,0,0.4)',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      borderLeft: '4px solid var(--gold)',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'flex-start'
                    }}>
                      <Bike size={16} color="var(--gold-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '11.5px', color: '#ffefc2' }}>
                        <strong>Costo de Envío:</strong> Se calculará según la distancia de tu zona y te lo mandaremos por WhatsApp lo más pronto posible para que se lo canceles directamente al repartidor en moto.
                      </span>
                    </div>
                  </div>
                )}

                {esRecoger && (
                  <p style={{ margin: 0, fontSize: '12px', color: '#d4dfce' }}>
                    🥡 <strong>Para recoger en el local se abona el 100% (Bs. {montoAnticipo})</strong> para tener tus platos listos y empacados a la hora solicitada.
                  </p>
                )}
              </div>

              {/* QR del Restaurante para Pago */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid rgba(74, 124, 63, 0.25)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#fff', display: 'block', marginBottom: '10px' }}>
                  Escanea el Código QR para realizar la transferencia:
                </span>

                <div style={{
                  display: 'inline-block',
                  background: '#fff',
                  padding: '10px',
                  borderRadius: '14px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
                }}>
                  <img 
                    src={qrPagoRestaurante || '/qr-pago.png'} 
                    alt="QR de Pago El Jardín" 
                    style={{ width: '160px', height: '160px', objectFit: 'contain', display: 'block' }}
                  />
                </div>

                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    id="btn-descargar-qr-pago"
                    onClick={() => descargarQR(qrPagoRestaurante || '/qr-pago.png', 'QR-Pago-ElJardin.png')}
                    style={{
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#fff',
                      fontSize: '11.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      textDecoration: 'none'
                    }}
                  >
                    <Download size={13} /> Descargar QR
                  </button>
                </div>

                <p style={{ fontSize: '11px', color: '#a8b89a', margin: '10px 0 0' }}>
                  Banco Unión / BNB / BCP / Cualquier Banco vía Simple QR
                </p>
              </div>

              {/* Subir Comprobante de Pago */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '16px',
                padding: '14px 16px',
                border: '1px solid rgba(74, 124, 63, 0.25)'
              }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--gold-light)', marginBottom: '8px' }}>
                  Adjunta el Comprobante de Pago o Transferencia:
                </label>

                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleSubirComprobante} 
                  style={{ display: 'none' }} 
                />

                {imagenPago ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '10px' }}>
                    <img 
                      src={imagenPago} 
                      alt="Comprobante" 
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--gold)' }} 
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> Comprobante adjuntado
                      </span>
                      <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>Optimizado para carga rápida</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImagenPago(null)}
                      style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '6px' }}
                      title="Eliminar"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={procesandoFoto}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1.5px dashed rgba(200,144,58,0.5)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12.5px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Upload size={20} color="var(--gold)" />
                    <span>{procesandoFoto ? 'Optimizando foto...' : 'Tocar aquí para subir foto o captura del comprobante'}</span>
                    <span style={{ fontSize: '10.5px', color: '#a8b89a' }}>PNG, JPG o captura de pantalla</span>
                  </button>
                )}
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.08)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Atrás
                </button>

                <button
                  type="button"
                  disabled={enviandoPedido}
                  onClick={handleConfirmarYGenerarQR}
                  style={{
                    flex: 1,
                    padding: '14px',
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
                    cursor: enviandoPedido ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 20px rgba(200,144,58,0.35)'
                  }}
                >
                  <ShieldCheck size={18} />
                  <span>{enviandoPedido ? 'Enviando a cocina...' : 'Confirmar Pedido y Generar mi Código QR'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════
              PASO 3: CONFIRMACIÓN DE PEDIDO Y NOTIFICACIÓN POR WHATSAPP
             ════════════════════════════════════════════════════════════════════════ */}
          {paso === 3 && pedidoCreado && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', alignItems: 'center' }}>
              
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.18)',
                border: '2px solid #22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#22c55e',
                boxShadow: '0 0 24px rgba(34, 197, 94, 0.35)'
              }}>
                <CheckCircle2 size={38} />
              </div>

              <div>
                <h3 style={{ fontSize: '21px', fontWeight: 'bold', color: '#fff', margin: '0 0 6px', fontFamily: 'serif' }}>
                  ¡Pedido Confirmado con Éxito!
                </h3>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(200, 144, 58, 0.18)',
                  border: '1px solid var(--gold)',
                  padding: '4px 14px',
                  borderRadius: '100px',
                  color: 'var(--gold-light)',
                  fontWeight: 'bold',
                  fontSize: '13.5px'
                }}>
                  <span>Código de Pedido:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '15px', color: '#fff' }}>#{pedidoCreado.codigo}</span>
                </div>
              </div>

              {/* Mensaje Informativo: Estado llegará por WhatsApp */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.12) 0%, rgba(18, 140, 126, 0.08) 100%)',
                border: '1.5px solid rgba(37, 211, 102, 0.45)',
                borderRadius: '16px',
                padding: '16px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(37, 211, 102, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#25D366'
                }}>
                  <Phone size={20} />
                </div>
                <h4 style={{ margin: 0, fontSize: '14.5px', color: '#fff', fontWeight: 'bold' }}>
                  Avisos Directos a tu WhatsApp
                </h4>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#d4dfce', lineHeight: '1.45' }}>
                  Te enviaremos las actualizaciones del estado de tu pedido directamente por mensaje de WhatsApp al número que configuraste:
                </p>
                <div style={{
                  background: 'rgba(0,0,0,0.45)',
                  padding: '6px 16px',
                  borderRadius: '100px',
                  border: '1px solid rgba(37, 211, 102, 0.5)',
                  color: '#4ade80',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '2px'
                }}>
                  <span>📲</span>
                  <span>+591 {pedidoCreado.telefono}</span>
                </div>
                <span style={{ fontSize: '11px', color: '#9bb094', marginTop: '2px' }}>
                  Nuestro equipo en cocina y despacho te notificará por mensaje cuando empiece la preparación y cuando esté listo o en camino.
                </span>
              </div>

              {/* Resumen Compacto de Platos */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(74, 124, 63, 0.25)',
                borderRadius: '14px',
                padding: '12px 14px',
                width: '100%',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--gold-light)' }}>Resumen de Platos</span>
                  <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>Total: Bs. {Number(pedidoCreado.totalEstimado || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto' }}>
                  {(pedidoCreado.itemsSeleccionados || []).map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#cddbc5' }}>
                      <span>{it.cantidad || 1}x {it.nombre}</span>
                      <span>Bs. {((it.precio_actual || 0) * (it.cantidad || 1)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón Principal: Mandar Resumen por WhatsApp */}
              <a
                href={linkWhatsApp(construirResumenPedidoWhatsApp(pedidoCreado))}
                target="_blank"
                rel="noreferrer"
                id="btn-enviar-resumen-whatsapp"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  border: 'none',
                  borderRadius: '14px',
                  color: '#ffffff',
                  fontSize: '14.5px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 6px 22px rgba(37, 211, 102, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                <MessageCircle size={19} />
                <span>📲 Enviar Resumen del Pedido por WhatsApp</span>
              </a>

              {/* Botón Más Pequeño: Volver al Inicio */}
              <button
                type="button"
                id="btn-volver-inicio-checkout"
                onClick={() => {
                  if (typeof setPedido === 'function') {
                    setPedido({});
                  }
                  setPaso(1);
                  setPedidoCreado(null);
                  onClose();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                  padding: '9px 22px',
                  color: '#d4dfce',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  marginTop: '4px'
                }}
              >
                Volver al Inicio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
