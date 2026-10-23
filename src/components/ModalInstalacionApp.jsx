import React, { useState, useEffect } from 'react'
import { X, Smartphone, Download, CheckCircle2, ShieldCheck, Share2, MoreVertical, PlusSquare, ArrowRight } from 'lucide-react'

export default function ModalInstalacionApp({ isOpen, onClose }) {
  const [tabActiva, setTabActiva] = useState('apk')
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [instalado, setInstalado] = useState(false)

  const APK_DOWNLOAD_URL = 'https://github.com/Rubick05/restaurante-el-jardin/releases/download/latest-apk/El-Jardin-Restaurante.apk'

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const handleAppInstalled = () => {
      setInstalado(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  if (!isOpen) return null

  const instalarPWA = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setInstalado(true)
    }
    setDeferredPrompt(null)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
      <div 
        className="relative w-full max-w-md bg-[#0c140a] border border-[#c8903a]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#ede8dc]"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(180deg, #101c0c 0%, #080d06 100%)',
          border: '1.5px solid rgba(200, 144, 58, 0.4)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(74,124,63,0.2)',
          color: '#ede8dc',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid rgba(200, 144, 58, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(200, 144, 58, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(200,144,58,0.3)' }}>
              <Smartphone size={20} color="#e8af60" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#fff', fontFamily: 'Playfair Display, serif' }}>
                Instalar App Oficial
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#a8b89a' }}>El Jardín — Tradición K'ochala</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Selector de Pestañas */}
        <div style={{ display: 'flex', padding: '6px', margin: '14px 20px 0', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            type="button"
            onClick={() => setTabActiva('apk')}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: 'none',
              borderRadius: '8px',
              background: tabActiva === 'apk' ? 'var(--gold, #c8903a)' : 'transparent',
              color: tabActiva === 'apk' ? '#000' : '#a8b89a',
              fontWeight: 'bold',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Download size={15} /> APK Android
          </button>
          <button
            type="button"
            onClick={() => setTabActiva('pwa')}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: 'none',
              borderRadius: '8px',
              background: tabActiva === 'pwa' ? 'var(--gold, #c8903a)' : 'transparent',
              color: tabActiva === 'pwa' ? '#000' : '#a8b89a',
              fontWeight: 'bold',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Smartphone size={15} /> PWA (Web App)
          </button>
        </div>

        {/* Contenido Pestaña 1: APK */}
        {tabActiva === 'apk' && (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(74, 124, 63, 0.12)', border: '1px solid rgba(74, 124, 63, 0.3)', padding: '12px 14px', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <ShieldCheck size={20} color="#7aba60" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 'bold', color: '#7aba60' }}>
                  Sobreescritura Directa y Segura
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#a8b89a', lineHeight: 1.4 }}>
                  Firmado con la llave criptográfica oficial de producción. Puedes instalar este APK sobre una versión previa y Android lo actualizará de inmediato sin borrar tus datos.
                </p>
              </div>
            </div>

            <a
              href={APK_DOWNLOAD_URL}
              download="El-Jardin-Restaurante.apk"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #c8903a 0%, #e8af60 100%)',
                color: '#080c06',
                fontWeight: 'bold',
                fontSize: '14px',
                borderRadius: '12px',
                textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(200, 144, 58, 0.4)',
                boxSizing: 'border-box'
              }}
            >
              <Download size={18} /> Descargar APK Oficial (v1.0)
            </a>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#c8903a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pasos para instalar en tu teléfono:
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '11.5px', color: '#ccc' }}>
                <span style={{ background: 'rgba(255,255,255,0.1)', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', fontWeight: 'bold' }}>1</span>
                <span>Descarga el archivo <code>El-Jardin-Restaurante.apk</code>.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '11.5px', color: '#ccc' }}>
                <span style={{ background: 'rgba(255,255,255,0.1)', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', fontWeight: 'bold' }}>2</span>
                <span>Ábrelo desde tus notificaciones o gestor de descargas.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '11.5px', color: '#ccc' }}>
                <span style={{ background: 'rgba(255,255,255,0.1)', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', fontWeight: 'bold' }}>3</span>
                <span>Si Android solicita permisos de instalación, selecciona <strong>"Configuración" → "Permitir desde esta fuente"</strong> y pulsa <strong>"Actualizar"</strong> o <strong>"Instalar"</strong>.</span>
              </div>
            </div>
          </div>
        )}

        {/* Contenido Pestaña 2: PWA */}
        {tabActiva === 'pwa' && (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {deferredPrompt && !instalado ? (
              <button
                type="button"
                onClick={instalarPWA}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #4a7c3f 0%, #7aba60 100%)',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(74, 124, 63, 0.4)'
                }}
              >
                <Smartphone size={18} /> Instalar en Pantalla de Inicio
              </button>
            ) : instalado ? (
              <div style={{ padding: '12px', background: 'rgba(34,197,94,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontSize: '12px' }}>
                <CheckCircle2 size={18} /> ¡Aplicación ya instalada correctamente en tu dispositivo!
              </div>
            ) : null}

            {/* Instrucciones Manuales Android & iOS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Android Chrome */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <MoreVertical size={16} color="#e8af60" />
                  <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#fff' }}>En Android (Google Chrome):</span>
                </div>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#aaa', lineHeight: 1.5 }}>
                  Toca el menú de <strong>tres puntos (⋮)</strong> en la esquina superior derecha y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                </p>
              </div>

              {/* iPhone Safari */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Share2 size={16} color="#e8af60" />
                  <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#fff' }}>En iPhone / iPad (Safari):</span>
                </div>
                <p style={{ margin: 0, fontSize: '11.5px', color: '#aaa', lineHeight: 1.5 }}>
                  Toca el botón <strong>Compartir (<Share2 size={12} style={{ display: 'inline' }} />)</strong> en la barra inferior de Safari y elige <strong>"Agregar a inicio" (<PlusSquare size={12} style={{ display: 'inline' }} />)</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer del Modal */}
        <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Cerrar ventana
          </button>
        </div>
      </div>
    </div>
  )
}
