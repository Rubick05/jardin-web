import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Clock, Phone, MessageCircle, X } from 'lucide-react'
import './index.css'

// ─── API URL (backend Railway) ────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'https://restaurante-pelusa-production.up.railway.app'

// ─── FALLBACK DATA (cuando la API no responde) ────────────────────────────────
const FALLBACK_PROMOS = [
  {
    tipo: 'imagen',
    imagen_base64: '/promo5.jpg',
    badge: 'Promoción Especial',
    titulo: 'Oferta del Mes',
    subtitulo: '¡Por tiempo limitado!',
  },
  {
    tipo: 'imagen',
    imagen_base64: '/promo2.jpg',
    badge: 'Novedad',
    titulo: 'Combos y Novedades',
    subtitulo: 'Disfruta nuestras mejores combinaciones.',
  },
  {
    tipo: 'imagen',
    imagen_base64: '/promo3.jpg',
    badge: 'No te lo pierdas',
    titulo: 'Sabores de Temporada',
    subtitulo: 'Lo mejor de la cocina boliviana.',
  }
]

// ─── Imágenes para el Hero Slideshow ──────────────────────────────────────────
const HERO_SLIDES = [
  '/hero-bg.jpg',
  '/musica.jpg',
  '/pampaku.jpg',
  '/lambreado.jpg',
  '/escabeche-mixto.jpg',
  '/charque.jpg',
  '/chajchu.jpg',
]

// ─── Imágenes para la Galería Mosaico ─────────────────────────────────────────
const GALERIA_ITEMS = [
  { src: '/charque.jpg', nombre: 'Charque', span: 'span-2-col' },
  { src: '/pampaku.jpg', nombre: 'Pampaku', span: 'span-1' },
  { src: '/lambreado.jpg', nombre: 'Lambreado', span: 'span-1' },
  { src: '/escabeche-mixto.jpg', nombre: 'Escabeche Mixto', span: 'span-1' },
  { src: '/fideosuchu.jpg', nombre: 'Fideos Uchu', span: 'span-2-row' },
  { src: '/jatun-pampaku.jpg', nombre: 'Jatun Pampaku', span: 'span-1' },
  { src: '/chajchu.jpg', nombre: 'Chajchu', span: 'span-2-col' },
  { src: '/musica.jpg', nombre: 'Música en Vivo', span: 'span-1' },
]

// ─── Icono SVG de WhatsApp reutilizable ───────────────────────────────────────
function WhatsAppIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
//  FLOATING BRAND — Logo flotante glassmorphism (reemplaza Navbar)
// ═══════════════════════════════════════════════════════════════════════════════

function FloatingBrand() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 100)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={`floating-brand ${visible ? 'visible' : ''}`}>
      <div className="floating-brand-logo">
        <img src="/logo-hoja.png" alt="El Jardín" />
      </div>
      <span className="floating-brand-text">El Jardín</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  HERO GALLERY — Slideshow fullscreen con Ken Burns
// ═══════════════════════════════════════════════════════════════════════════════

function HeroGallery() {
  const [indiceActual, setIndiceActual] = useState(0)
  const [indicePrevio, setIndicePrevio] = useState(null)
  const timerRef = useRef(null)
  const total = HERO_SLIDES.length

  // Ciclo automático: 6s por slide, 1.5s de crossfade
  const avanzarSlide = useCallback(() => {
    setIndicePrevio(indiceActual)
    const siguiente = (indiceActual + 1) % total
    setTimeout(() => {
      setIndicePrevio(null)
    }, 1500)
    setIndiceActual(siguiente)
  }, [indiceActual, total])

  useEffect(() => {
    timerRef.current = setInterval(avanzarSlide, 6000)
    return () => clearInterval(timerRef.current)
  }, [avanzarSlide])

  return (
    <section className="hero-gallery" id="inicio">
      {/* Slides */}
      {HERO_SLIDES.map((src, i) => {
        const esActual = i === indiceActual
        const esPrevio = i === indicePrevio
        const esVisible = esActual || esPrevio
        return (
          <div
            key={i}
            className={`hero-slide ${esActual ? 'active' : ''} ${esPrevio ? 'prev' : ''}`}
            style={{
              backgroundImage: `url('${src}')`,
              opacity: esVisible ? 1 : 0,
              zIndex: esActual ? 2 : esPrevio ? 1 : 0,
            }}
          />
        )
      })}

      {/* Overlay oscuro gradiente */}
      <div className="hero-gallery-overlay" />

      {/* Contenido mínimo superpuesto */}
      <div className="hero-gallery-content">
        <div className="hero-gallery-logo">
          <img src="/logo-hoja.png" alt="El Jardín" />
        </div>
        <h1 className="hero-gallery-title">
          Restaurante<br />
          <em>El Jardín</em>
        </h1>
        <p className="hero-gallery-sub">Peña · Restaurant · Cochabamba, Bolivia</p>
      </div>

      {/* Indicador de scroll */}
      <div className="hero-scroll">
        <div className="hero-scroll-line" />
        <span>Descubrir</span>
      </div>

      {/* Indicadores de slide */}
      <div className="hero-slide-indicators">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            className={`hero-indicator ${i === indiceActual ? 'active' : ''}`}
            onClick={() => {
              clearInterval(timerRef.current)
              setIndicePrevio(indiceActual)
              setIndiceActual(i)
              setTimeout(() => setIndicePrevio(null), 1500)
              timerRef.current = setInterval(avanzarSlide, 6000)
            }}
            aria-label={`Ir a foto ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GALERÍA MOSAICO — Grid de fotos con hover reveal y stagger
// ═══════════════════════════════════════════════════════════════════════════════

function GaleriaMosaico() {
  const gridRef = useRef(null)

  useEffect(() => {
    const nodos = gridRef.current?.querySelectorAll('.mosaic-item')
    if (!nodos || nodos.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )

    nodos.forEach((nodo) => observer.observe(nodo))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="section" id="cocina">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Galería</span>
          <h2 className="section-title">Nuestra Cocina</h2>
          <p className="section-desc">
            Platos preparados con amor, recetas ancestrales y los mejores ingredientes de Bolivia.
          </p>
        </div>

        <div className="mosaic-grid" ref={gridRef}>
          {GALERIA_ITEMS.map((item, i) => (
            <div
              className={`mosaic-item ${item.span}`}
              key={i}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <img src={item.src} alt={item.nombre} loading="lazy" />
              <div className="mosaic-overlay">
                <span className="mosaic-nombre">{item.nombre}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LIGHTBOX — Modal para ver promociones ampliadas
// ═══════════════════════════════════════════════════════════════════════════════

function Lightbox({ promo, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!promo) return null

  const mediaSrc = promo.imagen_base64 || promo.imagen_url || promo.datos_base64

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <div className="lightbox" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
        <div className="lightbox-media">
          {promo.tipo === 'video' ? (
            <video src={mediaSrc} controls autoPlay playsInline loop className="lightbox-img" />
          ) : (
            <img src={mediaSrc} alt={promo.titulo || 'Promoción'} className="lightbox-img" />
          )}
        </div>
        <div className="lightbox-body">
          {promo.badge && <span className="lightbox-badge">{promo.badge}</span>}
          {promo.titulo && <h3 className="lightbox-title">{promo.titulo}</h3>}
          {promo.subtitulo && <p className="lightbox-sub">{promo.subtitulo}</p>}
          <div className="lightbox-actions">
            <a
              href="https://wa.me/59176995052"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold"
            >
              <MessageCircle size={18} />
              ¡Me interesa!
            </a>
            <button className="btn btn-outline" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AVISOS DESTACADOS — Masonry cards con glow badges (reemplaza Promociones)
// ═══════════════════════════════════════════════════════════════════════════════

function AvisosDestacados({ promosList, loading }) {
  const [lightboxPromo, setLightboxPromo] = useState(null)
  const gridRef = useRef(null)

  const promos = promosList && promosList.length > 0 ? promosList : FALLBACK_PROMOS

  // IntersectionObserver para animación de entrada
  useEffect(() => {
    const nodos = gridRef.current?.querySelectorAll('.aviso-card')
    if (!nodos || nodos.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    nodos.forEach((nodo) => observer.observe(nodo))
    return () => observer.disconnect()
  }, [promos])

  return (
    <section className="section section-dark" id="promociones">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Ofertas y Novedades</span>
          <h2 className="section-title">Promociones del Mes</h2>
          <p className="section-desc">
            Anuncios especiales, grupos en vivo y eventos del restaurante.
          </p>
        </div>

        {loading ? (
          <div className="avisos-loading">
            <div className="avisos-spinner" />
            <p>Cargando promociones...</p>
          </div>
        ) : (
          <div className="avisos-grid" ref={gridRef}>
            {promos.map((p, i) => {
              const mediaSrc = p.imagen_base64 || p.imagen_url || p.datos_base64
              return (
                <div
                  className="aviso-card"
                  key={i}
                  style={{ transitionDelay: `${i * 0.1}s` }}
                  onClick={() => setLightboxPromo(p)}
                >
                  <div className="aviso-card-bg">
                    {p.tipo === 'video' ? (
                      <video src={mediaSrc} muted loop playsInline />
                    ) : (
                      <img src={mediaSrc} alt={p.titulo || 'Promoción'} loading="lazy" />
                    )}
                  </div>
                  <div className="aviso-card-overlay">
                    {p.badge && <span className="aviso-badge">{p.badge}</span>}
                    <h3 className="aviso-title">{p.titulo || 'Promoción'}</h3>
                    {p.subtitulo && <p className="aviso-sub">{p.subtitulo}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {lightboxPromo && (
        <Lightbox promo={lightboxPromo} onClose={() => setLightboxPromo(null)} />
      )}
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  UBICACIÓN & CONTACTO — Mapa + info + WhatsApp CTA
// ═══════════════════════════════════════════════════════════════════════════════

function UbicacionContacto() {
  return (
    <section className="section ubicacion-section" id="contacto">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Encuéntranos</span>
          <h2 className="section-title">Visítanos</h2>
          <p className="section-desc">
            Estamos esperándote con la mesa lista y los platos más ricos de Bolivia.
          </p>
        </div>

        <div className="ubicacion-grid">
          {/* Mapa embebido */}
          <div className="ubicacion-mapa">
            <iframe
              title="Ubicación Restaurante El Jardín"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-66.17%2C-17.40%2C-66.14%2C-17.385&layer=mapnik&marker=-17.3942,-66.1568"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
            />
          </div>

          {/* Panel de información */}
          <div className="ubicacion-info">
            <div className="ubicacion-info-item">
              <div className="ubicacion-info-icon">
                <MapPin size={22} />
              </div>
              <div>
                <h4>Dirección</h4>
                <p>Final, Av. Melchor Perez de Olguin,<br />Cochabamba, Bolivia</p>
              </div>
            </div>

            <div className="ubicacion-info-item">
              <div className="ubicacion-info-icon">
                <Clock size={22} />
              </div>
              <div>
                <h4>Horario</h4>
                <p>Lunes a Domingo<br />11:00 — 22:00 hs</p>
              </div>
            </div>

            <div className="ubicacion-info-item">
              <div className="ubicacion-info-icon">
                <Phone size={22} />
              </div>
              <div>
                <h4>Teléfono</h4>
                <p><a href="tel:+59176995052">+591 76995052</a></p>
              </div>
            </div>

            <div className="ubicacion-info-item">
              <div className="ubicacion-info-icon whatsapp-icon">
                <MessageCircle size={22} />
              </div>
              <div>
                <h4>WhatsApp</h4>
                <p>Escríbenos para reservas y pedidos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gran botón WhatsApp CTA */}
        <div className="ubicacion-cta">
          <a
            href="https://wa.me/59176995052"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp-grande"
          >
            <WhatsAppIcon size={24} />
            Pedir por WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FOOTER — Minimalista
// ═══════════════════════════════════════════════════════════════════════════════

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <img src="/logo-hoja.png" alt="El Jardín" className="footer-logo-img" />
        <p className="footer-tagline">Peña · Restaurant · Bolivia</p>
        <div className="footer-social">
          <a
            href="https://wa.me/59176995052"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-whatsapp"
            aria-label="WhatsApp"
          >
            <WhatsAppIcon size={20} />
          </a>
        </div>
        <p className="footer-copy">
          © {new Date().getFullYear()} Restaurante El Jardín · Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  WHATSAPP FAB — Botón flotante con bounce + pulse
// ═══════════════════════════════════════════════════════════════════════════════

function WhatsAppFAB() {
  return (
    <a
      href="https://wa.me/59176995052"
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-fab"
      aria-label="Pedir por WhatsApp"
    >
      <span className="whatsapp-fab-icon">
        <WhatsAppIcon size={28} />
      </span>
      <span className="whatsapp-fab-label">¡Haz tu pedido!</span>
    </a>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  APP — Componente principal
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  // ── Promociones desde la API del backend ──
  const [promosAPI, setPromosAPI] = useState([])
  const [loadingPromos, setLoadingPromos] = useState(true)

  // Cargar PROMOCIONES desde el backend
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_URL}/api/promociones`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar promociones')
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPromosAPI(data)
        }
        setLoadingPromos(false)
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.warn('No se pudo cargar promociones desde la API, usando fallback:', err.message)
        }
        setLoadingPromos(false)
      })
    return () => controller.abort()
  }, [])

  return (
    <>
      <FloatingBrand />
      <HeroGallery />
      <GaleriaMosaico />
      <AvisosDestacados promosList={promosAPI} loading={loadingPromos} />
      <UbicacionContacto />
      <Footer />
      <WhatsAppFAB />
    </>
  )
}
