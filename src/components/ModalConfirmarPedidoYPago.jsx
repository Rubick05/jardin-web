import React, { useState, useRef } from 'react';
import { 
  ShoppingBag, CheckCircle2, AlertCircle, X, Upload, 
  Bike, Store, DollarSign, ArrowRight, ShieldCheck, Download
} from 'lucide-react';
import { comprimirImagenLocal } from '../lib/utils-imagen';
import { descargarQR } from '../lib/utils-qr';

export default function ModalConfirmarPedidoYPago({
  tipoEntrega,
  nombre,
  telefono,
  direccion,
  zona,
  fecha,
  hora,
  personas,
  referencia,
  notasAdicionales,
  itemsSeleccionados,
  totalEstimado,
  pedido,
  setPedido,
  qrPagoRestaurante,
  imagenPago,
  setImagenPago,
  onConfirmarPedido,
  enviandoPedido,
  onCerrar,
  onSeguirComprando
}) {
  const [metodoPago, setMetodoPago] = useState('qr');
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const fileInputRef = useRef(null);

  const esDelivery = tipoEntrega === 'delivery';

  // Cálculos de Reglas de Negocio
  // Reserva Local: 50% de anticipo obligatorio
  // Delivery: 100% de la orden de platos obligatoria
  const montoAnticipo = esDelivery 
    ? Math.round(totalEstimado) 
    : Math.round(totalEstimado * 0.5);

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

  return (
    <div 
      className="cart-drawer-backdrop"
      style={{ zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', background: 'rgba(0,0,0,0.85)' }}
      onClick={onCerrar}
    >
      <div 
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'linear-gradient(180deg, #131d10 0%, #0c140a 100%)',
          border: '1.5px solid var(--gold)',
          borderRadius: '24px',
          padding: '22px 18px',
          boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 40px rgba(200,144,58,0.25)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: esDelivery ? 'rgba(168,85,247,0.2)' : 'rgba(34,197,94,0.2)',
                color: esDelivery ? '#d8b4fe' : '#86efac',
                border: `1px solid ${esDelivery ? '#a855f7' : '#22c55e'}`,
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {esDelivery ? <Bike size={12} /> : <Store size={12} />}
                {esDelivery ? 'PEDIDO A DOMICILIO' : 'RESERVA EN LOCAL'}
              </span>
            </div>
            <h3 style={{ margin: '6px 0 0', fontSize: '18px', color: '#fff', fontFamily: 'Playfair Display, serif', fontWeight: 'bold' }}>
              Confirmación de Orden & Pago
            </h3>
          </div>

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

        {/* Contenido con scroll */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 1. RESUMEN DE PLATOS SELECCIONADOS */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShoppingBag size={14} color="var(--gold)" />
                Platos Seleccionados ({itemsSeleccionados.length})
              </span>
              <button
                type="button"
                onClick={onSeguirComprando}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--gold-light)',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                + Agregar más platos
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {itemsSeleccionados.map((it) => (
                <div 
                  key={it.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.04)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {it.nombre}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--gold-light)', fontFamily: 'monospace' }}>
                      Bs. {Number(it.precio_actual || it.precio || 0).toFixed(0)} c/u
                    </div>
                  </div>

                  {/* Selector de cantidad táctil */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.5)', padding: '2px 4px', borderRadius: '8px', border: '1px solid var(--gold)' }}>
                    <button
                      type="button"
                      onClick={() => decrementar(it.id)}
                      style={{ width: '26px', height: '26px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      −
                    </button>
                    <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '12.5px', fontWeight: 'bold', color: 'var(--gold)' }}>
                      {it.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => incrementar(it.id)}
                      style={{ width: '26px', height: '26px', border: 'none', background: 'var(--gold)', color: '#000', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => eliminar(it.id)}
                    title="Eliminar plato"
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 2. REGLA DE PAGO SEGÚN TIPO DE ENTREGA */}
          {esDelivery ? (
            /* CASO DELIVERY: 100% PAGO DE PLATOS + COSTO ENVÍO POR WHATSAPP */
            <div style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(200,144,58,0.15) 100%)',
              border: '1.5px solid rgba(168,85,247,0.4)',
              borderRadius: '16px',
              padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d8b4fe', fontWeight: 'bold', fontSize: '13px' }}>
                <Bike size={18} />
                Regla de Pago para Domicilio:
              </div>
              <p style={{ margin: '6px 0 10px', fontSize: '12px', color: '#e9d5ff', lineHeight: 1.45 }}>
                Los pedidos a domicilio se cancelan en su <strong>totalidad (100% de los platos)</strong> para asegurar el despacho inmediato.
              </p>
              
              <div style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px dashed rgba(200,144,58,0.4)',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '11.5px',
                color: '#fef08a',
                lineHeight: 1.4
              }}>
                🛵 <strong>Costo del Envío en Moto:</strong> Se calculará según tu ubicación exacta ({zona || 'tu zona'}) y te lo enviaremos por WhatsApp lo más pronto posible para tu conformidad.
              </div>
            </div>
          ) : (
            /* CASO RESERVA LOCAL: 50% ANTICIPO OBLIGATORIO */
            <div style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(200,144,58,0.15) 100%)',
              border: '1.5px solid rgba(34,197,94,0.4)',
              borderRadius: '16px',
              padding: '14px 16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#86efac', fontWeight: 'bold', fontSize: '13px' }}>
                <Store size={18} />
                Regla de Anticipo para Reserva:
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#dcfce7', lineHeight: 1.45 }}>
                Para asegurar tu mesa y que la cocina prepare tus platos a tiempo para tu llegada, se abona el <strong>50% de anticipo</strong>. El 50% restante lo cancelas cómodamente en el local.
              </p>
            </div>
          )}

          {/* 3. DESGLOSE DEL PAGO */}
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
              <span style={{ color: '#888' }}>Total de Platos Seleccionados:</span>
              <strong style={{ color: '#fff' }}>Bs. {totalEstimado.toFixed(0)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: 'var(--gold-light)', fontWeight: 'bold' }}>
                {esDelivery ? 'Total a Pagar Ahora (100%):' : 'Anticipo Requerido (50%):'}
              </span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--gold)', fontFamily: 'monospace' }}>
                Bs. {montoAnticipo.toFixed(0)}
              </span>
            </div>

            {!esDelivery && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a8b89a', fontSize: '12px' }}>
                <span>Saldo a pagar al llegar al local:</span>
                <span style={{ fontFamily: 'monospace' }}>Bs. {saldoPendiente.toFixed(0)}</span>
              </div>
            )}
          </div>

          {/* 4. PAGO CON QR Y SUBIDA DE COMPROBANTE */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="var(--gold)" />
              Realiza tu Pago con QR / Transferencia
            </h4>

            {qrPagoRestaurante ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ padding: '8px', background: '#fff', borderRadius: '14px', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={qrPagoRestaurante} alt="QR de Pago" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <button
                  type="button"
                  onClick={() => descargarQR(qrPagoRestaurante, 'QR_Pago_El_Jardin.png')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    color: 'var(--gold-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'underline'
                  }}
                >
                  <Download size={13} /> Descargar Imagen QR para tu Banco
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px', color: '#888', fontSize: '12px' }}>
                Escanea el QR oficial o realiza tu transferencia para confirmar.
              </div>
            )}

            {/* Subir comprobante */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#ccc', marginBottom: '6px' }}>
                Adjunta tu Comprobante de Pago:
              </label>
              
              <input 
                type="file" 
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleSubirComprobante}
              />

              {imagenPago ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '10px' }}>
                  <img src={imagenPago} alt="Comprobante" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#4ade80', fontSize: '12px', fontWeight: 'bold' }}>✓ Comprobante adjunto</div>
                    <div style={{ color: '#888', fontSize: '11px' }}>Listo para verificar por cocina</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImagenPago(null)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', padding: '4px' }}
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={procesandoFoto}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(200, 144, 58, 0.1)',
                    border: '1.5px dashed var(--gold)',
                    color: 'var(--gold-light)',
                    fontSize: '12.5px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={16} />
                  {procesandoFoto ? 'Procesando comprobante...' : '📷 Subir Foto del Comprobante'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Botón de Confirmación Principal */}
        <div style={{ paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          <button
            type="button"
            disabled={enviandoPedido}
            onClick={() => onConfirmarPedido(montoAnticipo, saldoPendiente)}
            className="btn btn-gold"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 6px 20px rgba(200,144,58,0.4)',
              cursor: enviandoPedido ? 'wait' : 'pointer'
            }}
          >
            {enviandoPedido ? (
              '⏳ Registrando Pedido en Cocina...'
            ) : (
              <>
                Confirmar y Enviar a Cocina (Bs. {montoAnticipo.toFixed(0)}) ➔
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onSeguirComprando}
            style={{
              width: '100%',
              padding: '8px',
              background: 'transparent',
              border: 'none',
              color: '#888',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Seguir revisando el menú
          </button>
        </div>
      </div>
    </div>
  );
}
