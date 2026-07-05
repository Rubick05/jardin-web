import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Clock, Phone, MessageCircle, X, Search } from 'lucide-react'
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

function HeroGallery({ slides, onOpenReserva }) {
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
            onClick={onOpenReserva} 
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

function NuestraCarta({ menu, pedido, setPedido }) {
  const [categoriaActiva, setCategoriaActiva] = useState('principales')
  const platos = menu[categoriaActiva] || []

  const incrementar = (id) => {
    setPedido(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }

  const decrementar = (id) => {
    setPedido(prev => {
      const n = { ...prev }
      if (n[id] > 1) n[id]--
      else delete n[id]
      return n
    })
  }

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
              const cant = pedido[item.id] || 0

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
                      </div>
                      <p className="menu-item-desc">{item.descripcion || 'Sin descripción'}</p>
                    </div>
                    {item.ingredientes && (
                      <div className="menu-item-ingredients" style={{ marginBottom: '10px' }}>
                        <span className="menu-item-ingredients-label">Ingredientes:</span>
                        <p className="menu-item-ingredients-text">{item.ingredientes}</p>
                      </div>
                    )}
                    
                    {/* Selector de cantidad interactivo en la carta */}
                    <div className="menu-item-action" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(74,124,63,0.12)', paddingTop: '12px' }}>
                      <span className="menu-item-price" style={{ color: 'var(--gold-light)', fontWeight: 'bold', fontSize: '1.05rem', fontFamily: 'monospace' }}>{formattedPrice}</span>
                      
                      {cant > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); decrementar(item.id) }}
                            className="qty-btn"
                          >
                            −
                          </button>
                          <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: 'var(--gold)' }}>
                            {cant}
                          </span>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); incrementar(item.id) }}
                            className="qty-btn"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); incrementar(item.id) }}
                          className="btn btn-gold add-to-cart-btn"
                        >
                          + Agregar
                        </button>
                      )}
                    </div>
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

function WhatsAppFAB({ onOpenReserva, className }) {
  return (
    <button
      onClick={onOpenReserva}
      className={`whatsapp-fab ${className || ''}`}
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
//  PAGINA PEDIDOS Y RESERVAS
// ═══════════════════════════════════════════════════════════════════════════════

function PaginaPedidosYReservas({
  menuItems,
  qrPagoRestaurante,
  tipoEntrega,
  setTipoEntrega,
  nombre,
  setNombre,
  personas,
  setPersonas,
  fecha,
  setFecha,
  hora,
  setHora,
  direccion,
  setDireccion,
  zona,
  setZona,
  referencia,
  setReferencia,
  notasAdicionales,
  setNotasAdicionales,
  pedido,
  setPedido,
  coords,
  setCoords,
  imagenPago,
  setImagenPago,
  totalEstimado,
  deposito,
  qrUrl,
  resetFormulario,
  onVolver
}) {
  const [buscarPlato, setBuscarPlato] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('Todos')
  const [mostrarCheckoutMobile, setMostrarCheckoutMobile] = useState(false)
  const [alertaFecha, setAlertaFecha] = useState('')
  const [procesandoImagen, setProcesandoImagen] = useState(false)
  const inputPagoRef = useRef(null)
  const [imagenPreview, setImagenPreview] = useState(null)

  // Derived variables
  const itemsSeleccionados = Object.entries(pedido)
    .map(([id, cant]) => {
      const item = menuItems.find(p => p.id === id)
      return item ? { ...item, cantidad: cant } : null
    })
    .filter(Boolean)

  const totalCantidad = itemsSeleccionados.reduce((acc, i) => acc + i.cantidad, 0)

  // Categorías de platos disponibles
  const categoriasDisponibles = ['Todos', ...new Set(menuItems.filter(item => item.disponible !== false).map(item => {
    const cat = item.categoria || 'principales'
    if (cat.toLowerCase().includes('refresco') || cat.toLowerCase().includes('bebida')) return 'Bebidas'
    if (cat.toLowerCase().includes('caldo') || cat.toLowerCase().includes('sopa')) return 'Caldos'
    return 'Platos Fuertes'
  }))]

  const itemsFiltrados = menuItems.filter(item => {
    if (item.disponible === false) return false
    
    // Filtro por categoría
    if (categoriaActiva !== 'Todos') {
      const cat = (item.categoria || '').toLowerCase()
      let normalizada = 'Platos Fuertes'
      if (cat.includes('refresco') || cat.includes('bebida')) normalizada = 'Bebidas'
      else if (cat.includes('caldo') || cat.includes('sopa')) normalizada = 'Caldos'
      
      if (normalizada !== categoriaActiva) return false
    }

    // Filtro por búsqueda de texto
    if (buscarPlato.trim()) {
      const query = buscarPlato.toLowerCase()
      const matchNombre = item.nombre.toLowerCase().includes(query)
      const matchDesc = (item.descripcion || '').toLowerCase().includes(query)
      return matchNombre || matchDesc
    }

    return true
  })

  const incrementar = (id) => {
    setPedido(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }

  const decrementar = (id) => {
    setPedido(prev => {
      const n = { ...prev }
      if (n[id] > 1) n[id]--
      else delete n[id]
      return n
    })
  }

  const handleFechaChange = (e) => {
    const dateStr = e.target.value
    setFecha(dateStr)
    if (!dateStr) { setAlertaFecha(''); return }
    const dateObj = new Date(dateStr + 'T00:00:00')
    const day = dateObj.getDay()
    if (day !== 0 && day !== 4 && day !== 6) {
      setAlertaFecha('⚠️ El restaurante atiende únicamente los Jueves, Sábados y Domingos.')
    } else {
      setAlertaFecha('')
    }
  }

  const initLeafletMap = () => {
    const L = window.L
    if (!L) return

    const container = L.DomUtil.get('map-selection')
    if (container) {
      container._leaflet_id = null
    }

    const map = L.map('map-selection').setView([coords.lat, coords.lng], 14)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map)

    let marker = L.marker([coords.lat, coords.lng], { draggable: true }).addTo(map)

    const updatePosition = async (lat, lng) => {
      setCoords({ lat, lng })
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
        if (res.ok) {
          const data = await res.json()
          if (data.display_name) {
            const parts = data.display_name.split(',')
            const addressStr = parts.slice(0, 3).join(',').trim()
            setDireccion(addressStr)

            const lowerAddr = addressStr.toLowerCase()
            const matchingZona = ZONAS_COCHABAMBA.find(z => {
              const cleaned = z.split('(')[0].toLowerCase().trim()
              return lowerAddr.includes(cleaned)
            })
            if (matchingZona) setZona(matchingZona)
          }
        }
      } catch (e) {
        console.error('Error reverse geocoding:', e)
      }
    }

    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng()
      updatePosition(lat, lng)
    })

    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      marker.setLatLng([lat, lng])
      updatePosition(lat, lng)
    })
  }

  useEffect(() => {
    if (tipoEntrega !== 'delivery') return
    const mapElement = document.getElementById('map-selection')
    if (!mapElement) return

    let isMounted = true

    let link = document.getElementById('leaflet-css')
    if (!link) {
      link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    let script = document.getElementById('leaflet-js')
    if (!script) {
      script = document.createElement('script')
      script.id = 'leaflet-js'
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.async = true
      document.body.appendChild(script)
    }

    const checkAndInit = () => {
      if (window.L && document.getElementById('map-selection')) {
        if (isMounted) initLeafletMap()
      } else {
        setTimeout(checkAndInit, 100)
      }
    }

    checkAndInit()

    return () => {
      isMounted = false
    }
  }, [tipoEntrega, mostrarCheckoutMobile])

  const descargarQR = async () => {
    if (qrPagoRestaurante) {
      const a = document.createElement('a')
      a.href = qrPagoRestaurante
      a.download = `Pago_El_Jardin_${nombre || 'Cliente'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      return
    }
    try {
      const res = await fetch(qrUrl)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Pago_El_Jardin_${nombre || 'Cliente'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      window.open(qrUrl, '_blank')
    }
  }

  const enviarWhatsApp = () => {
    if (!nombre.trim()) { alert('Por favor ingresa tu nombre.'); return }
    if (!fecha) { alert('Por favor selecciona la fecha.'); return }
    if (!hora) { alert('Por favor selecciona la hora.'); return }
    
    if (tipoEntrega === 'delivery') {
      if (!direccion.trim()) { alert('Por favor ingresa la dirección de entrega.'); return }
      if (!zona) { alert('Por favor selecciona tu zona/barrio.'); return }
    }

    const itemStrings = itemsSeleccionados.map(
      item => `- *${item.cantidad}x* ${item.nombre} (Bs. ${(item.precio_actual * item.cantidad).toFixed(0)})`
    )
    const fechaText = new Date(fecha + 'T12:00:00').toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })

    let mensaje
    if (tipoEntrega === 'delivery') {
      mensaje = `*🛵 PEDIDO A DOMICILIO — Restaurante El Jardín*

*👤 Datos del Cliente:*
- *Nombre:* ${nombre}
- *Personas:* ${personas}
- *Fecha:* ${fechaText}
- *Hora estimada de entrega:* ${hora} hs

*📍 Dirección de Entrega:*
- *Dirección:* ${direccion}
- *Zona / Barrio:* ${zona}
- *Ubicación GPS (Google Maps):* https://www.google.com/maps?q=${coords.lat},${coords.lng}
- *Referencia:* ${referencia || 'Sin referencia adicional'}
${notasAdicionales ? `- *Notas:* ${notasAdicionales}` : ''}

*🍽️ Pedido:*
${itemStrings.length > 0 ? itemStrings.join('\n') : '_Sin platos pre-seleccionados_'}

${totalEstimado > 0 ? `*💰 Total Estimado:* Bs. ${totalEstimado.toFixed(0)} _(más costo de delivery según zona)_` : ''}

*💳 Pago Completo enviado:* Bs. ${deposito.toFixed(0)} vía Tigo Money al +591 69420202
${imagenPago ? '✅ Comprobante de pago adjunto' : '⏳ Favor enviar comprobante de pago para confirmar el pedido'}

¡Muchas gracias! Esperamos su confirmación.`
    } else {
      mensaje = `*🪴 RESERVA DE MESA — Restaurante El Jardín*

*👤 Detalles de la Reserva:*
- *Nombre:* ${nombre}
- *Personas:* ${personas} personas
- *Fecha:* ${fechaText}
- *Hora de Llegada:* ${hora} hs

${itemStrings.length > 0 ? `*🍽️ Pedido Anticipado:*
${itemStrings.join('\n')}

*💰 Total Estimado:* Bs. ${totalEstimado.toFixed(0)}` : '_Sin pedido previo (ordenaremos en mesa)_'}

*💳 Pago Anticipado enviado:* Bs. ${deposito.toFixed(0)} vía Tigo Money al +591 69420202
${imagenPago ? '✅ Comprobante de pago adjunto' : '⏳ Favor enviar comprobante de pago para confirmar la reserva'}

¡Muchas gracias! Nos vemos pronto. 🌿`
    }

    resetFormulario()
    setMostrarCheckoutMobile(false)

    const url = `https://wa.me/59169420202?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
    onVolver()
  }

  const renderCheckoutForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div>
        <label className="booking-label">Tu Nombre Completo</label>
        <input type="text" placeholder="Ej: María González" value={nombre} onChange={e => setNombre(e.target.value)} className="booking-input" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label className="booking-label">Nº de Personas</label>
          <input type="number" min="1" max="50" value={personas} onChange={e => setPersonas(parseInt(e.target.value) || 1)} className="booking-input" />
        </div>
        <div>
          <label className="booking-label">Hora de Llegada</label>
          <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="booking-input" />
        </div>
      </div>

      <div>
        <label className="booking-label">Fecha</label>
        <input type="date" value={fecha} onChange={handleFechaChange} className="booking-input" />
        {alertaFecha && <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#f59e0b', fontWeight: 500, lineHeight: 1.4 }}>{alertaFecha}</p>}
        <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#666' }}>Atención: Jueves 11–23h · Sábado y Domingo 12–23h</p>
      </div>

      {tipoEntrega === 'delivery' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label className="booking-label">Ubicación en el mapa <span style={{ color: '#ef4444' }}>*</span></label>
            <div id="map-selection" style={{ height: '180px', width: '100%', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.4)', overflow: 'hidden' }} />
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#888', fontStyle: 'italic' }}>📍 Arrastra el marcador rojo para fijar tu dirección.</p>
          </div>

          <div>
            <label className="booking-label">Dirección Completa <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="text" placeholder="Calle, Nº de puerta, edificio..." value={direccion} onChange={e => setDireccion(e.target.value)} className="booking-input" />
          </div>

          <div>
            <label className="booking-label">Zona / Barrio <span style={{ color: '#ef4444' }}>*</span></label>
            <select value={zona} onChange={e => setZona(e.target.value)} className="booking-input" style={{ appearance: 'auto' }}>
              <option value="">-- Selecciona tu zona --</option>
              {ZONAS_COCHABAMBA.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          <div>
            <label className="booking-label">Referencia del lugar</label>
            <input type="text" placeholder="Ej: Edificio azul, frente al parque..." value={referencia} onChange={e => setReferencia(e.target.value)} className="booking-input" />
          </div>

          <div>
            <label className="booking-label">Notas adicionales (opcional)</label>
            <textarea placeholder="Ej: Tocar timbre..." value={notasAdicionales} onChange={e => setNotasAdicionales(e.target.value)} rows={2} className="booking-input" style={{ resize: 'none', fontFamily: 'inherit' }} />
          </div>
        </div>
      )}

      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--gold)', fontWeight: 'bold' }}>🛒 Resumen del Pedido</h4>
        {itemsSeleccionados.length === 0 ? (
          <p style={{ margin: 0, fontSize: '12.5px', color: '#888', fontStyle: 'italic' }}>No has agregado platos aún.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {itemsSeleccionados.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span><span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{item.cantidad}×</span> {item.nombre}</span>
                <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>Bs. {(item.precio_actual * item.cantidad).toFixed(0)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '4px' }}>
              <span>Total Estimado:</span>
              <span style={{ color: 'var(--gold-light)', fontFamily: 'monospace' }}>Bs. {totalEstimado.toFixed(0)}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(34,197,94,0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.15)', textAlign: 'center' }}>
        <h4 style={{ margin: '0 0 4px', fontSize: '13px', color: '#22c55e', fontWeight: 'bold' }}>
          {tipoEntrega === 'delivery' ? '💳 Pago completo en su totalidad' : '💳 Pago anticipado requerido'}
        </h4>
        <p style={{ margin: '0 0 12px', fontSize: '12.5px', color: '#aaa', lineHeight: 1.4 }}>
          Monto a transferir: <strong style={{ color: 'var(--gold-light)', fontFamily: 'monospace', fontSize: '14px' }}>Bs. {deposito.toFixed(0)}</strong>
        </p>
        
        <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', display: 'inline-block', marginBottom: '10px' }}>
          <img src={qrPagoRestaurante || qrUrl} alt="QR El Jardín" width={150} height={150} style={{ display: 'block', borderRadius: '4px' }} />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <button type="button" onClick={descargarQR} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 12px', color: 'var(--gold-light)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
            📥 Descargar QR
          </button>
        </div>

        <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#888' }}>Escanea el QR y sube tu comprobante.</p>

        <input
          ref={inputPagoRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            setProcesandoImagen(true)
            try {
              const b64 = await comprimirImagenLocal(file, 800, 0.8)
              setImagenPago(b64)
            } catch { alert('Error al cargar imagen') }
            finally { setProcesandoImagen(false); e.target.value = '' }
          }}
        />

        <button
          type="button"
          disabled={procesandoImagen}
          onClick={() => inputPagoRef.current?.click()}
          style={{
            width: '100%', padding: '10px', fontSize: '12px', border: '1.5px dashed rgba(255,255,255,0.15)',
            background: imagenPago ? 'rgba(34,197,94,0.1)' : 'transparent', color: imagenPago ? '#22c55e' : '#ccc',
            borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500'
          }}
        >
          {procesandoImagen ? '⏳ Procesando...' : imagenPago ? '✅ Comprobante Adjunto' : '📸 Subir Comprobante de Pago'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="pedidos-layout">
      {/* HEADER */}
      <header className="pedidos-header">
        <div className="pedidos-header-inner">
          <button className="pedidos-back-btn" onClick={onVolver}>
            ← Volver al Inicio
          </button>
          
          <div className="pedidos-brand">
            <img src="/logo-hoja.png" alt="El Jardín" />
            <h2>El Jardín</h2>
          </div>

          <div className="pedidos-type-toggle">
            <button type="button" className={`pedidos-toggle-btn ${tipoEntrega === 'local' ? 'active' : ''}`} onClick={() => setTipoEntrega('local')}>
              Mesa
            </button>
            <button type="button" className={`pedidos-toggle-btn ${tipoEntrega === 'delivery' ? 'active' : ''}`} onClick={() => setTipoEntrega('delivery')}>
              Delivery
            </button>
          </div>
        </div>
      </header>

      {/* CONTAINER */}
      <main className="pedidos-container">
        {/* EXPLORADOR DE PLATOS */}
        <section className="pedidos-browser">
          {/* Barra de Búsqueda */}
          <div className="pedidos-search-bar">
            <Search className="pedidos-search-icon" size={20} />
            <input
              type="text"
              placeholder="¿Qué te gustaría comer hoy? Busca tu plato..."
              value={buscarPlato}
              onChange={e => setBuscarPlato(e.target.value)}
              className="pedidos-search-input"
            />
          </div>

          {/* Categorías (Píldoras) */}
          <div className="pedidos-categories-scroll">
            {categoriasDisponibles.map(cat => (
              <button
                key={cat}
                type="button"
                className={`pedidos-category-pill ${categoriaActiva === cat ? 'active' : ''}`}
                onClick={() => setCategoriaActiva(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grilla de Platos */}
          <div className="pedidos-dishes-grid">
            {itemsFiltrados.length === 0 ? (
              <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px 0', color: '#666', fontSize: '14px' }}>
                No se encontraron platos que coincidan con tu búsqueda.
              </div>
            ) : (
              itemsFiltrados.map((item) => {
                const imageSrc = item.imagen_base64 || item.url_imagen
                const formattedPrice = typeof item.precio_actual === 'number'
                  ? `Bs. ${item.precio_actual}`
                  : item.precio || 'Consultar'
                const cant = pedido[item.id] || 0

                return (
                  <div className="pedidos-dish-card" key={item.id}>
                    {imageSrc && (
                      <div className="pedidos-dish-img-container" onClick={() => setImagenPreview({ src: imageSrc, nombre: item.nombre, desc: item.descripcion, precio: item.precio_actual })}>
                        <img src={imageSrc} alt={item.nombre} loading="lazy" />
                      </div>
                    )}
                    <div className="pedidos-dish-info">
                      <div className="pedidos-dish-details">
                        <h4 className="pedidos-dish-name" onClick={() => imageSrc && setImagenPreview({ src: imageSrc, nombre: item.nombre, desc: item.descripcion, precio: item.precio_actual })} style={{ cursor: imageSrc ? 'pointer' : 'default' }}>{item.nombre}</h4>
                        <p className="pedidos-dish-desc">{item.descripcion || 'Sin descripción'}</p>
                      </div>
                      <div className="pedidos-dish-action">
                        <span className="pedidos-dish-price">{formattedPrice}</span>
                        {cant > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <button type="button" onClick={() => decrementar(item.id)} className="qty-btn">−</button>
                            <span style={{ minWidth: '18px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: 'var(--gold)' }}>{cant}</span>
                            <button type="button" onClick={() => incrementar(item.id)} className="qty-btn">+</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => incrementar(item.id)} className="btn btn-gold add-to-cart-btn">
                            + Agregar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* SIDEBAR DE CHECKOUT Y CARRITO (Escritorio) */}
        <aside className="pedidos-checkout-sidebar">
          <div className="pedidos-sidebar-header">
            <h3>🛒 Confirmación del Pedido</h3>
          </div>
          <div className="pedidos-sidebar-scroll">
            {renderCheckoutForm()}
          </div>
        </aside>

        {/* SIDEBAR DE CHECKOUT Y CARRITO (Móvil) */}
        <div className={`pedidos-checkout-sidebar ${mostrarCheckoutMobile ? 'open-mobile' : ''}`}>
          <div className="pedidos-sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3>🛒 Confirmar Reserva / Pedido</h3>
            <button
              type="button"
              onClick={() => setMostrarCheckoutMobile(false)}
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Cerrar ✕
            </button>
          </div>
          <div className="pedidos-sidebar-scroll">
            {renderCheckoutForm()}
          </div>
        </div>

        {/* Barra flotante móvil para ver el carrito */}
        {totalCantidad > 0 && (
          <div className="pedidos-mobile-cart-strip">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', color: '#888' }}>Total de tu orden</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--gold-light)', fontFamily: 'monospace' }}>Bs. ${totalEstimado.toFixed(0)}</span>
            </div>
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => setMostrarCheckoutMobile(true)}
              style={{ padding: '10px 20px', borderRadius: '30px', fontSize: '13px', height: 'auto' }}
            >
              Ver Carrito (${totalCantidad}) ➔
            </button>
          </div>
        )}
      </main>

      {/* Lightbox zoom de imagen */}
      {imagenPreview && (
        <div className="lightbox-backdrop" style={{ zIndex: 1200, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }} onClick={() => setImagenPreview(null)}>
          <div className="lightbox" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', width: '90%', padding: '18px', borderRadius: '16px', background: 'var(--bg-mid)', textAlign: 'center', position: 'relative' }}>
            <button 
              onClick={() => setImagenPreview(null)}
              style={{
                position: 'absolute', top: '12px', right: '12px', border: 'none', background: 'rgba(255,255,255,0.06)', borderRadius: '50%', width: '28px', height: '28px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              ✕
            </button>
            <div style={{ width: '100%', height: '250px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', background: '#000' }}>
              <img src={imagenPreview.src} alt={imagenPreview.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontFamily: 'Playfair Display, serif', fontSize: '18px' }}>{imagenPreview.nombre}</h3>
            {imagenPreview.desc && (
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#aaa', lineHeight: '1.4' }}>{imagenPreview.desc}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#888' }}>Precio:</span>
              <span style={{ fontSize: '16px', color: '#f59e0b', fontWeight: 'bold' }}>Bs. ${Number(imagenPreview.precio).toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper: comprimirImagen en jardin-web (canvas-based, inline)
function comprimirImagenLocal(file, maxWidth = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onerror = reject
      reader.onload = e => resolve(e.target.result)
      reader.readAsDataURL(file)
      return
    }
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = e => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth) { height = Math.round(height * maxWidth / width); width = maxWidth }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas no disponible'))
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

const ZONAS_COCHABAMBA = [
  'Centro (Av. Heroínas / Plaza Principal)',
  'Norte (Queru Queru / Las Cuadras)',
  'Sur (Cala Cala / Colcapirhua)',
  'Este (Sacaba / Av. Blanco Galindo)',
  'Oeste (Quillacollo / Vinto)',
  'Condebamba / Tupuraya',
  'Av. América / Av. Potosí',
  'Otro (indicar referencia)'
]


const FALLBACK_MENU_ITEMS = [
  {
    id: 'pampaku-id',
    nombre: 'Jatun Pampaku',
    precio_actual: 110,
    categoria: 'principales',
    disponible: true,
    url_imagen: '/pampaku.jpg',
    descripcion: 'Especialidad de la casa: carnes mixtas cocidas bajo tierra con piedras volcánicas.'
  },
  {
    id: 'pique-id',
    nombre: 'Pique Macho (Entero)',
    precio_actual: 120,
    categoria: 'principales',
    disponible: true,
    url_imagen: '/charque.jpg',
    descripcion: 'Carne de res jugosa, salchichas, papas fritas, huevo, queso y locoto.'
  },
  {
    id: 'charque-id',
    nombre: 'Charque Criollo (Entero)',
    precio_actual: 120,
    categoria: 'principales',
    disponible: true,
    url_imagen: '/charque.jpg',
    descripcion: 'Carne deshidratada desmenuzada y frita crujiente, con mote, huevo y queso.'
  },
  {
    id: 'planchita-id',
    nombre: 'Planchita (Entera)',
    precio_actual: 120,
    categoria: 'principales',
    disponible: true,
    url_imagen: '/pampaku.jpg',
    descripcion: 'Carnes, chorizos y tubérculos calientes sobre plancha.'
  },
  {
    id: 'uchu-id',
    nombre: 'Fideos Uchu (Personal)',
    precio_actual: 40,
    categoria: 'entradas',
    disponible: true,
    descripcion: 'Delicioso ají de fideos tradicional cochabambino.'
  },
  {
    id: 'coca-id',
    nombre: 'Coca Cola 2L',
    precio_actual: 15,
    categoria: 'bebidas',
    disponible: true,
    descripcion: 'Gaseosa familiar.'
  }
]

// Función para renderizar el texto del Chatbot formateando negritas (**texto**) y viñetas
function renderizarMensaje(texto) {
  if (!texto) return ''
  
  // Sanitizar caracteres HTML básicos
  let html = texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // Convertir **bold** a <strong>bold</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // Convertir viñetas markdown (* o -) a viñetas HTML
  html = html.replace(/^\s*[-*]\s+(.+)/gm, '• $1')

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: html }} 
      style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} 
    />
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
    "¿Qué platos tienen disponibles hoy?",
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
      const response = await fetch(`${API_URL}/api/chat`, {
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
                  {renderizarMensaje(m.content)}
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
  const [menuItemsFlat, setMenuItemsFlat] = useState(FALLBACK_MENU_ITEMS)
  const [promosAPI, setPromosAPI] = useState([])
  const [loadingPromos, setLoadingPromos] = useState(true)
  const [vistaActiva, setVistaActiva] = useState('inicio')
  const [prefillReserva, setPrefillReserva] = useState(null)
  const [qrPago, setQrPago] = useState(null)

  // ── Estados de la Reserva y Pedido Levantados al Componente Principal ──
  const [tipoEntrega, setTipoEntrega] = useState('local')
  const [paso, setPaso] = useState(1)
  const [nombre, setNombre] = useState('')
  const [personas, setPersonas] = useState(2)
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [direccion, setDireccion] = useState('')
  const [zona, setZona] = useState('')
  const [referencia, setReferencia] = useState('')
  const [notasAdicionales, setNotasAdicionales] = useState('')
  const [pedido, setPedido] = useState({})
  const [coords, setCoords] = useState({ lat: -17.3895, lng: -66.1568 })
  const [imagenPago, setImagenPago] = useState(null)

  const steps = tipoEntrega === 'delivery'
    ? ['datos', 'tipo', 'ubicacion', 'menu', 'pago']
    : ['datos', 'tipo', 'menu', 'pago']

  const stepLabels = tipoEntrega === 'delivery'
    ? ['Tus Datos', 'Tipo de Pedido', 'Dirección de Envío', 'Elige tu Menú', 'Resumen y Pago']
    : ['Tus Datos', 'Tipo de Pedido', 'Elige tu Menú', 'Resumen y Pago']

  const currentStep = steps[paso - 1]

  const itemsSeleccionados = Object.entries(pedido)
    .map(([id, cant]) => { const item = menuItemsFlat.find(p => p.id === id); return item ? { ...item, cantidad: cant } : null })
    .filter(Boolean)
  const totalEstimado = itemsSeleccionados.reduce((acc, curr) => acc + (curr.precio_actual * curr.cantidad), 0)

  // Pago completo para delivery (100%), Pago Anticipado para mesa (50%, mínimo Bs 50 si es sin menú)
  const deposito = tipoEntrega === 'delivery'
    ? totalEstimado
    : (totalEstimado > 0 ? (totalEstimado / 2) : 50)

  const qrTexto = tipoEntrega === 'delivery'
    ? `Pago Total El Jardin\nMonto: Bs. ${deposito.toFixed(0)}\nCliente: ${nombre || 'Cliente'}`
    : `Pago Anticipado El Jardin\nMonto: Bs. ${deposito.toFixed(0)}\nCliente: ${nombre || 'Cliente'}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=png&qzone=1&data=${encodeURIComponent(qrTexto)}`

  const resetFormulario = () => {
    localStorage.removeItem('jardin_reserva_temporal')
    setNombre('')
    setPersonas(2)
    setFecha('')
    setHora('')
    setTipoEntrega('local')
    setDireccion('')
    setZona('')
    setReferencia('')
    setNotasAdicionales('')
    setPedido({})
    setCoords({ lat: -17.3895, lng: -66.1568 })
    setImagenPago(null)
    setPaso(1)
  }

  // Guardar borrador al cambiar cualquier dato relevante
  useEffect(() => {
    if (nombre || Object.keys(pedido).length > 0 || direccion) {
      const datos = {
        nombre, personas, fecha, hora, tipoEntrega, direccion, zona, referencia, notasAdicionales, pedido, coords
      }
      localStorage.setItem('jardin_reserva_temporal', JSON.stringify(datos))
    }
  }, [nombre, personas, fecha, hora, tipoEntrega, direccion, zona, referencia, notasAdicionales, pedido, coords])

  // Sincronizar el estado de la vista de pedidos con la historia del navegador (evita salir al presionar atrás en móviles)
  useEffect(() => {
    const handlePopState = (e) => {
      if (vistaActiva === 'pedidos') {
        setVistaActiva('inicio')
        setPrefillReserva(null)
      }
    }

    if (vistaActiva === 'pedidos') {
      window.history.pushState({ vista: 'pedidos' }, '')
      window.addEventListener('popstate', handlePopState)
    }

    return () => {
      window.removeEventListener('popstate', handlePopState)
      if (vistaActiva !== 'pedidos' && window.history.state?.vista === 'pedidos') {
        window.history.back()
      }
    }
  }, [vistaActiva])

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
        if (data.qr_pago && data.qr_pago.imagen) {
          setQrPago(data.qr_pago.imagen)
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
        // POPULAR CON FALLBACK_MENU_ITEMS EN CASO DE FALLA
        setMenuItemsFlat(FALLBACK_MENU_ITEMS)
        const nuevoMenu = {
          principales: [],
          entradas: [],
          bebidas: []
        }
        FALLBACK_MENU_ITEMS.forEach(item => {
          const catClasificada = clasificarCategoria(item.categoria)
          if (nuevoMenu[catClasificada]) {
            nuevoMenu[catClasificada].push(item)
          }
        })
        setMenu(nuevoMenu)
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

  if (vistaActiva === 'pedidos') {
    return (
      <PaginaPedidosYReservas
        menuItems={menuItemsFlat}
        qrPagoRestaurante={qrPago}
        tipoEntrega={tipoEntrega}
        setTipoEntrega={setTipoEntrega}
        paso={paso}
        setPaso={setPaso}
        nombre={nombre}
        setNombre={setNombre}
        personas={personas}
        setPersonas={setPersonas}
        fecha={fecha}
        setFecha={setFecha}
        hora={hora}
        setHora={setHora}
        direccion={direccion}
        setDireccion={setDireccion}
        zona={zona}
        setZona={setZona}
        referencia={referencia}
        setReferencia={setReferencia}
        notasAdicionales={notasAdicionales}
        setNotasAdicionales={setNotasAdicionales}
        pedido={pedido}
        setPedido={setPedido}
        coords={coords}
        setCoords={setCoords}
        imagenPago={imagenPago}
        setImagenPago={setImagenPago}
        totalEstimado={totalEstimado}
        deposito={deposito}
        qrUrl={qrUrl}
        resetFormulario={resetFormulario}
        onVolver={() => setVistaActiva('inicio')}
      />
    )
  }

  return (
    <>
      <FloatingNavbar />
      <HeroGallery slides={heroSlides} onOpenReserva={() => { setPrefillReserva(null); setVistaActiva('pedidos'); }} />
      <GaleriaMosaico items={itemsProcesados} />
      <NuestraCarta menu={menu} pedido={pedido} setPedido={setPedido} />
      <AvisosDestacados promosList={promosAPI} loading={loadingPromos} />
      <UbicacionContacto onOpenReserva={() => { setPrefillReserva(null); setVistaActiva('pedidos'); }} />
      <Footer onOpenReserva={() => { setPrefillReserva(null); setVistaActiva('pedidos'); }} />
      <WhatsAppFAB 
        onOpenReserva={() => { setPrefillReserva(null); setVistaActiva('pedidos'); }} 
        className={totalEstimado > 0 ? 'cart-active' : ''}
      />
      <ChatbotFlotante 
        onPreReserva={(data) => {
          setPrefillReserva(data);
          setVistaActiva('pedidos');
        }}
        menuItems={menuItemsFlat}
      />


      {totalEstimado > 0 && vistaActiva !== 'pedidos' && (
        <div className="floating-cart-bar">
          <div className="floating-cart-info">
            <span className="floating-cart-count">🛒 {itemsSeleccionados.reduce((acc, i) => acc + i.cantidad, 0)} platos</span>
            <span className="floating-cart-divider">|</span>
            <span className="floating-cart-total">Bs {totalEstimado.toFixed(0)}</span>
          </div>
          <button
            type="button"
            className="btn btn-gold floating-cart-btn"
            onClick={() => {
              setPrefillReserva(null);
              setVistaActiva('pedidos');
            }}
          >
            Confirmar Pedido ➔
          </button>
        </div>
      )}
    </>
  )
}
