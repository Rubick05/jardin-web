import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Clock, Phone, MessageCircle, X } from 'lucide-react'
import './index.css'

// ─── API URL (backend Railway) ────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'https://restaurante-el-jardin-production-a426.up.railway.app'

// ─── FALLBACK DATA (cuando la API no responde) ────────────────────────────────
const FALLBACK_PROMOS = [
  {
    tipo: 'imagen',
    imagen_base64: '/musica.jpg',
    badge: 'Viernes Folclórico',
    titulo: 'Música en Vivo',
    subtitulo: 'Disfruta de la mejor música andina y folklórica con destacados artistas nacionales.',
  },
  {
    tipo: 'imagen',
    imagen_base64: '/promo2.jpg',
    badge: 'Fin de Semana',
    titulo: 'Gran Pampaku Valluno',
    subtitulo: 'Asado tradicional cocido bajo tierra, servido en abundancia para compartir en familia.',
  }
]

// ─── Imágenes para el Hero Slideshow ──────────────────────────────────────────
const HERO_SLIDES = [
  '/hero-bg.jpg'
]

// ─── Imágenes para la Galería Mosaico ─────────────────────────────────────────
const GALERIA_ITEMS = [
  { 
    src: '/charque.jpg', 
    nombre: 'Charque Tradicional', 
    span: 'span-2-col',
    tagline: 'Carne deshidratada crujiente',
    detalles: 'Con mote, huevo y queso criollo.'
  },
  { 
    src: '/pampaku.jpg', 
    nombre: 'Pampaku Valluno', 
    span: 'span-1',
    tagline: 'Cocción tradicional bajo tierra',
    detalles: 'Mix de carnes y tubérculos.'
  }
]

// ─── Datos del Menú (Nuestra Carta) ───────────────────────────────────────────
const MENU_CATEGORIAS = [
  { id: 'principales', nombre: 'Platos Tradicionales' },
  { id: 'entradas', nombre: 'Entradas y Acompañamientos' },
  { id: 'bebidas', nombre: 'Bebidas y Refrescos' }
]

const MENU_ITEMS = {
  principales: [],
  entradas: [],
  bebidas: []
}

// ─── Icono SVG de WhatsApp reutilizable ───────────────────────────────────────
function WhatsAppIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
//  FLOATING NAVBAR — Premium glassmorphism pill navigation
// ═══════════════════════════════════════════════════════════════════════════════

function FloatingNavbar() {
  const [visible, setVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [activeSection, setActiveSection] = useState('inicio')

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Hide on scroll down, show on scroll up
      if (currentScrollY > 150) {
        if (currentScrollY > lastScrollY) {
          setVisible(false) // scrolling down
        } else {
          setVisible(true) // scrolling up
        }
      } else {
        setVisible(true) // near top
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Track active section on scroll
  useEffect(() => {
    const sections = ['inicio', 'cocina', 'menu', 'promociones', 'contacto']
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }

    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -40% 0px', // Trigger when section is in middle of viewport
      threshold: 0,
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    sections.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      setActiveSection(id)
    }
  }

  return (
    <nav className={`floating-navbar ${!visible ? 'hidden-nav' : ''}`}>
      <div className="floating-navbar-brand" onClick={() => scrollToSection('inicio')} style={{ cursor: 'pointer' }}>
        <div className="floating-navbar-logo">
          <img src="/logo-hoja.png" alt="El Jardín" />
        </div>
        <span className="floating-navbar-text">El Jardín</span>
      </div>
      
      <div className="floating-navbar-menu">
        <a 
          className={`floating-navbar-link ${activeSection === 'inicio' ? 'active' : ''}`}
          onClick={() => scrollToSection('inicio')}
        >
          Inicio
        </a>
        <a 
          className={`floating-navbar-link ${activeSection === 'cocina' ? 'active' : ''}`}
          onClick={() => scrollToSection('cocina')}
        >
          Cocina
        </a>
        <a 
          className={`floating-navbar-link ${activeSection === 'menu' ? 'active' : ''}`}
          onClick={() => scrollToSection('menu')}
        >
          Menú
        </a>
        <a 
          className={`floating-navbar-link ${activeSection === 'promociones' ? 'active' : ''}`}
          onClick={() => scrollToSection('promociones')}
        >
          Eventos
        </a>
        <a 
          className={`floating-navbar-link ${activeSection === 'contacto' ? 'active' : ''}`}
          onClick={() => scrollToSection('contacto')}
        >
          Contacto
        </a>
      </div>
    </nav>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
//  HERO GALLERY — Slideshow fullscreen con Ken Burns
// ═══════════════════════════════════════════════════════════════════════════════

function HeroGallery({ slides }) {
  const [indiceActual, setIndiceActual] = useState(0)
  const [indicePrevio, setIndicePrevio] = useState(null)
  const timerRef = useRef(null)
  const total = slides.length

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
      {slides.map((src, i) => {
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
        
        <div className="hero-gallery-actions">
          <button 
            onClick={() => {
              const el = document.getElementById('menu')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }} 
            className="btn btn-gold"
          >
            Ver el Menú
          </button>
          <button 
            onClick={() => {
              const el = document.getElementById('contacto')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }} 
            className="btn btn-outline"
          >
            Reservar Mesa
          </button>
        </div>
      </div>

      {/* Indicador de scroll */}
      <div className="hero-scroll">
        <div className="hero-scroll-line" />
        <span>Descubrir</span>
      </div>

      {/* Indicadores de slide */}
      <div className="hero-slide-indicators">
        {slides.map((_, i) => (
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

function GaleriaMosaico({ items }) {
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
  }, [items])

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
          {items.map((item, i) => (
            <div
              className={`mosaic-item ${item.span}`}
              key={i}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <img src={item.src} alt={item.nombre} loading="lazy" />
              <div className="mosaic-overlay">
                <div className="mosaic-overlay-content">
                  <span className="mosaic-nombre">{item.nombre}</span>
                  {item.tagline && <span className="mosaic-tagline">{item.tagline}</span>}
                  {item.detalles && <p className="mosaic-detalles">{item.detalles}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  NUESTRA CARTA — Menú Bento con pestañas interactivas
// ═══════════════════════════════════════════════════════════════════════════════

function NuestraCarta({ menu }) {
  const [categoriaActiva, setCategoriaActiva] = useState('principales')
  const platos = menu[categoriaActiva] || []

  return (
    <section className="section section-dark" id="menu">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Nuestra Carta</span>
          <h2 className="section-title">Sabores Tradicionales</h2>
          <p className="section-desc">
            Cada plato es una obra de arte culinaria que honra el legado gastronómico de Cochabamba.
          </p>
        </div>

        {/* Selector de categorías */}
        <div className="menu-tabs">
          {MENU_CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              className={`menu-tab-btn ${categoriaActiva === cat.id ? 'active' : ''}`}
              onClick={() => setCategoriaActiva(cat.id)}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* Grilla de platos */}
        <div className="menu-grid">
          {platos.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted">
              No hay platos disponibles en esta categoría por el momento.
            </div>
          ) : (
            platos.map((item, index) => {
              const imageSrc = item.imagen_base64 || item.url_imagen
              const formattedPrice = typeof item.precio_actual === 'number'
                ? `Bs. ${item.precio_actual}`
                : item.precio || 'Consultar'
              return (
                <div className={`menu-item-card ${imageSrc ? 'has-image' : ''}`} key={index}>
                  {imageSrc && (
                    <div className="menu-item-image">
                      <img src={imageSrc} alt={item.nombre} loading="lazy" />
                    </div>
                  )}
                  <div className="menu-item-content">
                    <div>
                      <div className="menu-item-header">
                        <h3 className="menu-item-name">{item.nombre}</h3>
                        <span className="menu-item-price">{formattedPrice}</span>
                      </div>
                      <p className="menu-item-desc">{item.descripcion || 'Sin descripción'}</p>
                    </div>
                    {item.ingredientes && (
                      <div className="menu-item-ingredients">
                        <span className="menu-item-ingredients-label">Ingredientes:</span>
                        <p className="menu-item-ingredients-text">{item.ingredientes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
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
              href={`https://wa.me/59169420202?text=${encodeURIComponent('Hola El Jardín! Me interesa el evento: ' + (promo.titulo || ''))}`}
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
          <span className="section-tag">Eventos y Novedades</span>
          <h2 className="section-title">Eventos de la Semana</h2>
          <p className="section-desc">
            Anuncios especiales, grupos en vivo y eventos de la semana.
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

function UbicacionContacto({ onOpenReserva }) {
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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3807.0644458861084!2d-66.1884444!3d-17.4086946!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x93e373e23b5150d5%3A0x2f6f6b4ca3b1b7c4!2sRESTAURANT%20EL%20JARD%C3%8DN!5e0!3m2!1ses!2sbo!4v1718739900000!5m2!1ses!2sbo"
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
                <a 
                  href="https://maps.app.goo.gl/S5uYzZB4ZRNTUoV16"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors block text-sm"
                >
                  Final, Av. Melchor Perez de Olguin,<br />Cochabamba, Bolivia
                </a>
                <a 
                  href="https://maps.app.goo.gl/S5uYzZB4ZRNTUoV16"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 bg-primary text-primary-foreground font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-primary/95 transition-colors shadow-md border-none cursor-pointer"
                >
                  <MapPin size={12} />
                  Ver en Google Maps
                </a>
              </div>
            </div>

            <div className="ubicacion-info-item">
              <div className="ubicacion-info-icon">
                <Clock size={22} />
              </div>
              <div>
                <h4>Horario de Atención</h4>
                <p style={{ fontSize: '13px', lineHeight: '1.4' }}>
                  <strong>Jueves:</strong> 11:00 — 23:00 hs<br />
                  <strong>Sábado y Domingo:</strong> 12:00 — 23:00 hs
                </p>
              </div>
            </div>

            <div className="ubicacion-info-item">
              <div className="ubicacion-info-icon">
                <Phone size={22} />
              </div>
              <div>
                <h4>Teléfono</h4>
                <p><a href="tel:+59169420202">+591 69420202</a></p>
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
          <button
            onClick={onOpenReserva}
            className="btn btn-whatsapp-grande"
            style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justify: 'center' }}
          >
            <WhatsAppIcon size={24} />
            Reservar Mesa / Hacer Pedido (Asistente Visual)
          </button>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FOOTER — Minimalista
// ═══════════════════════════════════════════════════════════════════════════════

function Footer({ onOpenReserva }) {
  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo-hoja.png" alt="El Jardín" className="footer-logo-img" />
          <h3 className="footer-title">El Jardín</h3>
          <p className="footer-tagline">Peña · Restaurant · Tradición</p>
        </div>

        <div className="footer-links">
          <a onClick={() => scrollToSection('inicio')}>Inicio</a>
          <a onClick={() => scrollToSection('cocina')}>Nuestra Cocina</a>
          <a onClick={() => scrollToSection('menu')}>Menú</a>
          <a onClick={() => scrollToSection('promociones')}>Eventos de la Semana</a>
          <a onClick={() => scrollToSection('contacto')}>Contacto</a>
        </div>

        <div className="footer-info">
          <p>Av. Melchor Perez de Olguin, Cochabamba, Bolivia</p>
          <p>Telf: +591 69420202 · Jueves: 11:00 a 23:00, Sáb y Dom: 12:00 a 23:00</p>
        </div>

        <div className="footer-social">
          <button
            onClick={onOpenReserva}
            className="footer-whatsapp"
            style={{ border: 'none', cursor: 'pointer', background: 'transparent', color: 'inherit' }}
            aria-label="WhatsApp"
          >
            <WhatsAppIcon size={20} />
          </button>
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

function WhatsAppFAB({ onOpenReserva }) {
  return (
    <button
      onClick={onOpenReserva}
      className="whatsapp-fab"
      style={{ border: 'none', cursor: 'pointer' }}
      aria-label="Pedir por WhatsApp"
    >
      <span className="whatsapp-fab-icon">
        <WhatsAppIcon size={28} />
      </span>
      <span className="whatsapp-fab-label">Asistente Reserva</span>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MODAL INTERACTIVO DE RESERVA Y PEDIDO GUIADO CON IMÁGENES
// ═══════════════════════════════════════════════════════════════════════════════

function ModalReservaInteractiva({ open, onClose, menuItems, prefillData }) {
  const [paso, setPaso] = useState(1)
  const [nombre, setNombre] = useState("")
  const [personas, setPersonas] = useState(2)
  const [fecha, setFecha] = useState("")
  const [hora, setHora] = useState("")
  const [pedido, setPedido] = useState({}) // { item_id: cantidad }
  const [alertaFecha, setAlertaFecha] = useState("")

  useEffect(() => {
    if (open) {
      setNombre(prefillData?.nombre || "")
      setPersonas(prefillData?.personas || 2)
      setFecha(prefillData?.fecha || "")
      setHora(prefillData?.hora || "")
      setPaso(1)

      const nuevoPedido = {}
      if (prefillData?.platos && Array.isArray(prefillData.platos)) {
        prefillData.platos.forEach(p => {
          const item = menuItems.find(mi => 
            mi.nombre.toLowerCase().includes(p.nombre.toLowerCase()) || 
            p.nombre.toLowerCase().includes(mi.nombre.toLowerCase())
          )
          if (item) {
            nuevoPedido[item.id] = p.cantidad
          }
        })
      }
      setPedido(nuevoPedido)

      if (prefillData?.fecha) {
        const diaSemana = new Date(prefillData.fecha + 'T12:00:00').getDay()
        if (diaSemana !== 4 && diaSemana !== 6 && diaSemana !== 0) {
          setAlertaFecha("⚠️ Nota: Solo abrimos Jueves, Sábados y Domingos. Por favor, selecciona uno de estos días para tu reserva.")
        } else {
          setAlertaFecha("")
        }
      } else {
        setAlertaFecha("")
      }
    }
  }, [open, prefillData, menuItems])

  if (!open) return null

  // Validar si la fecha cae en jueves (4), sábado (6) o domingo (0)
  const handleFechaChange = (e) => {
    const seleccionada = e.target.value
    setFecha(seleccionada)
    if (!seleccionada) {
      setAlertaFecha("")
      return
    }
    const diaSemana = new Date(seleccionada + 'T12:00:00').getDay()
    if (diaSemana !== 4 && diaSemana !== 6 && diaSemana !== 0) {
      setAlertaFecha("⚠️ Nota: Solo abrimos Jueves, Sábados y Domingos. Por favor, selecciona uno de estos días para tu reserva.")
    } else {
      setAlertaFecha("")
    }
  }

  const itemsSeleccionados = Object.entries(pedido)
    .map(([id, cant]) => {
      const item = menuItems.find(p => p.id === id)
      return item ? { ...item, cantidad: cant } : null
    })
    .filter(Boolean)

  const totalEstimado = itemsSeleccionados.reduce((acc, curr) => acc + (curr.precio_actual * curr.cantidad), 0)

  const enviarWhatsApp = () => {
    if (!nombre.trim() || !fecha || !hora) {
      alert("Por favor completa los detalles de la reserva (Nombre, Fecha y Hora).")
      return
    }

    const itemStrings = itemsSeleccionados.map(
      item => `- *${item.cantidad}x* ${item.nombre} (Bs. ${(item.precio_actual * item.cantidad).toFixed(0)})`
    )

    const scheduleText = new Date(fecha + 'T12:00:00').toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })

    const mensaje = `*¡Hola El Jardín! Quisiera realizar una reserva/pedido:*

*Detalles de la Reserva:*
- *Nombre:* ${nombre}
- *Personas:* ${personas} personas
- *Fecha:* ${scheduleText}
- *Hora de Llegada:* ${hora} hs

${itemStrings.length > 0 ? `*Pedido Anticipado:*
${itemStrings.join('\n')}

*Total Estimado:* Bs. ${totalEstimado.toFixed(0)}` : '_Sin pedido previo (ordenaremos en mesa)_'}

¡Muchas gracias! Nos vemos pronto.`

    const url = `https://wa.me/59169420202?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
    onClose()
  }

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <div 
        className="lightbox interactive-booking-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <button className="lightbox-close" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h3 className="lightbox-title" style={{ margin: 0, fontSize: '22px', fontFamily: 'Playfair Display, serif', color: '#f59e0b' }}>
            Asistente de Reserva & Pedido
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>
            Paso {paso} de 3 · {paso === 1 ? 'Tus Datos' : paso === 2 ? 'Elige tu Menú (Opcional)' : 'Resumen'}
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {/* PASO 1: DATOS DE LA RESERVA */}
          {paso === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#ddd' }}>Tu Nombre</label>
                <input 
                  type="text" 
                  placeholder="Ej: Alejandra Flores" 
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#ddd' }}>Nº de Personas</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="50"
                    value={personas}
                    onChange={e => setPersonas(parseInt(e.target.value) || 1)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#ddd' }}>Hora de Llegada</label>
                  <input 
                    type="time" 
                    value={hora}
                    onChange={e => setHora(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#ddd' }}>Fecha de Reserva</label>
                <input 
                  type="date" 
                  value={fecha}
                  onChange={handleFechaChange}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
                {alertaFecha && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#f59e0b', fontWeight: '500', lineHeight: '1.4' }}>
                    {alertaFecha}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* PASO 2: ELEGIR PLATOS CON IMÁGENES */}
          {paso === 2 && (
            <div>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#aaa' }}>
                Selecciona los platos que desees pedir de forma anticipada (opcional, puedes avanzar sin elegir platos):
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {menuItems.filter(item => item.disponible !== false).map((item) => {
                  const cant = pedido[item.id] || 0
                  const img = item.imagen_base64 || item.url_imagen
                  return (
                    <div 
                      key={item.id} 
                      style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      {/* Miniatura imagen */}
                      <div style={{ width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', background: '#222', flexShrink: 0 }}>
                        {img ? (
                          <img src={img} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#555' }}>🍽️</div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nombre}</h4>
                        <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold' }}>Bs. {Number(item.precio_actual).toFixed(0)}</span>
                      </div>

                      {/* Cantidad Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '6px' }}>
                        <button 
                          onClick={() => {
                            setPedido(prev => {
                              const next = { ...prev }
                              if (next[item.id] > 1) next[item.id]--
                              else delete next[item.id]
                              return next
                            })
                          }}
                          style={{ width: '26px', height: '26px', border: 'none', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          -
                        </button>
                        <span style={{ minWidth: '18px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>{cant}</span>
                        <button 
                          onClick={() => {
                            setPedido(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))
                          }}
                          style={{ width: '26px', height: '26px', border: 'none', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* PASO 3: RESUMEN Y ENVIAR */}
          {paso === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#f59e0b', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', fontWeight: 'bold' }}>Detalles de la Reserva</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px', fontSize: '13px' }}>
                  <span style={{ color: '#888' }}>Nombre:</span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{nombre || 'No indicado'}</span>
                  <span style={{ color: '#888' }}>Personas:</span>
                  <span style={{ color: '#fff' }}>{personas}</span>
                  <span style={{ color: '#888' }}>Fecha:</span>
                  <span style={{ color: '#fff' }}>{fecha ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' }) : 'No seleccionada'}</span>
                  <span style={{ color: '#888' }}>Hora:</span>
                  <span style={{ color: '#fff' }}>{hora || 'No seleccionada'} hs</span>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#f59e0b', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', fontWeight: 'bold' }}>Pedido Anticipado</h4>
                {itemsSeleccionados.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '13px', color: '#777', fontStyle: 'italic' }}>Sin platos seleccionados (se ordenará en mesa).</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {itemsSeleccionados.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justify: 'space-between', fontSize: '13px' }}>
                        <span><span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{item.cantidad}x</span> {item.nombre}</span>
                        <span style={{ fontWeight: 'bold' }}>Bs. {(item.precio_actual * item.cantidad).toFixed(0)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '4px', display: 'flex', justify: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
                      <span>Total Estimado:</span>
                      <span style={{ color: '#f59e0b' }}>Bs. {totalEstimado.toFixed(0)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{ padding: '16px 24px 24px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
          {paso > 1 ? (
            <button 
              className="btn btn-outline" 
              onClick={() => setPaso(p => p - 1)}
              style={{ padding: '8px 16px', fontSize: '13px', height: 'auto' }}
            >
              Atrás
            </button>
          ) : (
            <div />
          )}

          {paso < 3 ? (
            <button 
              className="btn btn-gold" 
              onClick={() => {
                if (paso === 1 && (!nombre.trim() || !fecha || !hora)) {
                  alert("Por favor completa Nombre, Fecha y Hora de llegada.")
                  return
                }
                setPaso(p => p + 1)
              }}
              style={{ padding: '8px 20px', fontSize: '13px', height: 'auto' }}
            >
              Siguiente
            </button>
          ) : (
            <button 
              className="btn btn-gold" 
              onClick={enviarWhatsApp}
              style={{ padding: '10px 24px', fontSize: '13px', background: '#25D366', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', height: 'auto' }}
            >
              <MessageCircle size={18} />
              Enviar Reserva
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CHATBOT FLOTANTE — Inteligencia Artificial con Gemini
// ═══════════════════════════════════════════════════════════════════════════════

function ChatbotFlotante({ onPreReserva, menuItems }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! 🌿 Bienvenido a El Jardín. Soy tu asistente inteligente. ¿Te gustaría conocer el menú de hoy, saber nuestros horarios o realizar una reserva?'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [ultimaAccion, setUltimaAccion] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sugerencias = [
    "¿Qué platos recomiendas?",
    "¿Qué días y horarios abren?",
    "¿Dónde están ubicados?",
    "Quiero hacer una reserva"
  ]

  const enviarMensaje = async (texto) => {
    const msg = texto || inputValue
    if (!msg.trim() || loading) return

    const nuevosMensajes = [...messages, { role: 'user', content: msg }]
    setMessages(nuevosMensajes)
    setInputValue('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: nuevosMensajes })
      })

      if (!response.ok) throw new Error('Error al procesar mensaje')

      const data = await response.json()
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      
      if (data.action === 'open_reserva') {
        setUltimaAccion(data.reservaData)
      }
    } catch (error) {
      console.error(error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, he tenido un problema de conexión. ¿Podrías volver a intentarlo?' }])
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmarReserva = () => {
    if (ultimaAccion) {
      onPreReserva(ultimaAccion)
      setUltimaAccion(null)
      setIsOpen(false)
    }
  }

  return (
    <div className="chatbot-wrapper">
      <button 
        className={`chatbot-toggle ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir Asistente Virtual"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={26} />}
        {!isOpen && <span className="chatbot-badge-pulse"></span>}
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">🌿</div>
              <div>
                <h4 className="chatbot-title">Asistente El Jardín</h4>
                <span className="chatbot-status">En línea (IA)</span>
              </div>
            </div>
            <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chatbot-bubble-wrapper ${m.role}`}>
                <div className={`chatbot-bubble ${m.role}`}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-bubble-wrapper assistant">
                <div className="chatbot-bubble assistant loading">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}

            {ultimaAccion && !loading && (
              <div className="chatbot-action-card">
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 'bold', color: '#f59e0b' }}>📅 ¡Formulario de reserva listo!</p>
                <div className="chatbot-action-details" style={{ fontSize: '12px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {ultimaAccion.nombre && <div><strong>Nombre:</strong> {ultimaAccion.nombre}</div>}
                  {ultimaAccion.personas && <div><strong>Personas:</strong> {ultimaAccion.personas}</div>}
                  {ultimaAccion.fecha && <div><strong>Fecha:</strong> {ultimaAccion.fecha}</div>}
                  {ultimaAccion.hora && <div><strong>Hora:</strong> {ultimaAccion.hora} hs</div>}
                  {ultimaAccion.platos && Array.isArray(ultimaAccion.platos) && ultimaAccion.platos.length > 0 && (
                    <div>
                      <strong>Pedido:</strong> {ultimaAccion.platos.map(p => `${p.cantidad}x ${p.nombre}`).join(', ')}
                    </div>
                  )}
                </div>
                <button 
                  className="btn btn-gold" 
                  onClick={handleConfirmarReserva} 
                  style={{ width: '100%', padding: '8px', fontSize: '12px', height: 'auto', border: 'none', cursor: 'pointer' }}
                >
                  Confirmar y Completar Formulario
                </button>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="chatbot-suggestions">
              {sugerencias.map((s, i) => (
                <button key={i} className="chatbot-suggestion-btn" onClick={() => enviarMensaje(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <form 
            className="chatbot-input-form" 
            onSubmit={(e) => {
              e.preventDefault();
              enviarMensaje();
            }}
          >
            <input 
              type="text" 
              placeholder="Escribe tu consulta..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
              className="chatbot-input"
            />
            <button 
              type="submit" 
              className="chatbot-send-btn"
              disabled={loading || !inputValue.trim()}
            >
              ➔
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  APP — Componente principal
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  // ── Estados para portadas, mosaico y menú dinámicos ──
  const [heroSlides, setHeroSlides] = useState(HERO_SLIDES)
  const [galeriaItems, setGaleriaItems] = useState(GALERIA_ITEMS)
  const [menu, setMenu] = useState(MENU_ITEMS)
  const [menuItemsFlat, setMenuItemsFlat] = useState([])
  const [promosAPI, setPromosAPI] = useState([])
  const [loadingPromos, setLoadingPromos] = useState(true)
  const [reservaModalAbierto, setReservaModalAbierto] = useState(false)
  const [prefillReserva, setPrefillReserva] = useState(null)

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

  // Cargar CONFIGURACIÓN WEB (Hero Slides y Galería Mosaico) desde el backend
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_URL}/api/web-config`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar config web')
        return res.json()
      })
      .then(data => {
        if (data.hero_slides && Array.isArray(data.hero_slides) && data.hero_slides.length > 0) {
          setHeroSlides(data.hero_slides)
        }
        if (data.galeria_mosaico && Array.isArray(data.galeria_mosaico) && data.galeria_mosaico.length > 0) {
          setGaleriaItems(data.galeria_mosaico)
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.warn('No se pudo cargar la configuración web, usando fallbacks:', err.message)
        }
      })
    return () => controller.abort()
  }, [])

  // Helper para clasificar categorías del menú
  const clasificarCategoria = (categoria) => {
    const cat = (categoria || '').toLowerCase().trim()
    if (cat.includes('refresco') || cat.includes('cerveza') || cat.includes('bebida') || cat.includes('jugo') || cat.includes('agua') || cat.includes('trago') || cat.includes('refrescos') || cat.includes('cervezas')) {
      return 'bebidas'
    }
    if (cat.includes('caldo') || cat.includes('sopa') || cat.includes('entrada') || cat.includes('acompañamiento') || cat.includes('piqueo') || cat.includes('guarnicion') || cat.includes('guarnición') || cat.includes('caldos') || cat.includes('entradas')) {
      return 'entradas'
    }
    return 'principales' // Por defecto
  }

  // Cargar ELEMENTOS DEL MENÚ desde el backend
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_URL}/api/menu`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar menú')
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data)) {
          setMenuItemsFlat(data)
          if (data.length > 0) {
            // Filtrar platos disponibles
            const disponibles = data.filter(item => item.disponible !== false)
            
            const nuevoMenu = {
              principales: [],
              entradas: [],
              bebidas: []
            }

            disponibles.forEach(item => {
              const catClasificada = clasificarCategoria(item.categoria)
              if (nuevoMenu[catClasificada]) {
                nuevoMenu[catClasificada].push({
                  id: item.id,
                  nombre: item.nombre,
                  precio_actual: item.precio_actual,
                  descripcion: item.descripcion,
                  imagen_base64: item.imagen_base64,
                  url_imagen: item.url_imagen,
                  ingredientes: item.ingredientes
                })
              }
            })

            setMenu(nuevoMenu)
          }
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.warn('No se pudo cargar el menú desde la API, usando fallbacks:', err.message)
        }
      })
    return () => controller.abort()
  }, [])

  // Resolver ítems del mosaico vinculados con platos del menú
  const itemsProcesados = galeriaItems.map(item => {
    if (item.id_elemento_menu) {
      const plato = menuItemsFlat.find(p => p.id === item.id_elemento_menu)
      if (plato) {
        return {
          ...item,
          src: plato.imagen_base64 || plato.url_imagen || item.src,
          nombre: plato.nombre || item.nombre,
          tagline: item.tagline || plato.descripcion || '',
          detalles: item.detalles || `Bs. ${plato.precio_actual}`
        }
      }
    }
    return item
  })

  return (
    <>
      <FloatingNavbar />
      <HeroGallery slides={heroSlides} />
      <GaleriaMosaico items={itemsProcesados} />
      <NuestraCarta menu={menu} />
      <AvisosDestacados promosList={promosAPI} loading={loadingPromos} />
      <UbicacionContacto onOpenReserva={() => { setPrefillReserva(null); setReservaModalAbierto(true); }} />
      <Footer onOpenReserva={() => { setPrefillReserva(null); setReservaModalAbierto(true); }} />
      <WhatsAppFAB onOpenReserva={() => { setPrefillReserva(null); setReservaModalAbierto(true); }} />
      <ChatbotFlotante 
        onPreReserva={(data) => {
          setPrefillReserva(data);
          setReservaModalAbierto(true);
        }}
        menuItems={menuItemsFlat}
      />
      <ModalReservaInteractiva 
        open={reservaModalAbierto} 
        onClose={() => {
          setReservaModalAbierto(false);
          setPrefillReserva(null);
        }} 
        menuItems={menuItemsFlat} 
        prefillData={prefillReserva}
      />
    </>
  )
}
