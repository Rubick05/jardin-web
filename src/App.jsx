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
    badge: 'Tradición Familiar',
    titulo: 'Pampaku de Domingo',
    subtitulo: 'Asado tradicional cocido bajo tierra, servido en abundancia para compartir en familia.',
  },
  {
    tipo: 'imagen',
    imagen_base64: '/promo2.jpg',
    badge: 'Noches de Peña',
    titulo: 'Folklore en Vivo',
    subtitulo: 'Disfruta de la mejor música andina y folklórica con destacados artistas nacionales.',
  },
  {
    tipo: 'imagen',
    imagen_base64: '/promo3.jpg',
    badge: 'Sabor Valluno',
    titulo: 'Chicha de Maíz Cocida',
    subtitulo: 'Prueba la chicha cochabambina elaborada artesanalmente en jarra de barro tradicional.',
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
  { 
    src: '/charque.jpg', 
    nombre: 'Charque', 
    span: 'span-2-col',
    tagline: 'Carne deshidratada crujiente',
    detalles: 'Con mote, huevo y queso criollo.'
  },
  { 
    src: '/pampaku.jpg', 
    nombre: 'Pampaku', 
    span: 'span-1',
    tagline: 'Cocción tradicional bajo tierra',
    detalles: 'Mix de carnes y tubérculos al horno.'
  },
  { 
    src: '/lambreado.jpg', 
    nombre: 'Lambreado', 
    span: 'span-1',
    tagline: 'Conejo criollo apanado',
    detalles: 'Bañado con ahogado de ají colorado.'
  },
  { 
    src: '/escabeche-mixto.jpg', 
    nombre: 'Escabeche Mixto', 
    span: 'span-1',
    tagline: 'Patitas de cerdo marinadas',
    detalles: 'Verduras selectas en conserva.'
  },
  { 
    src: '/fideosuchu.jpg', 
    nombre: 'Fideos Uchu', 
    span: 'span-2-row',
    tagline: 'Fideos picantes tradicionales',
    detalles: 'Con carne de res y papa entera cocida.'
  },
  { 
    src: '/jatun-pampaku.jpg', 
    nombre: 'Jatun Pampaku', 
    span: 'span-1',
    tagline: 'Gran asado bajo tierra',
    detalles: 'Para compartir entre amigos y familia.'
  },
  { 
    src: '/chajchu.jpg', 
    nombre: 'Chajchu', 
    span: 'span-2-col',
    tagline: 'Plato valluno tradicional',
    detalles: 'Carne desmechada, chuño, ají y huevo.'
  },
  { 
    src: '/musica.jpg', 
    nombre: 'Música en Vivo', 
    span: 'span-1',
    tagline: 'Noches de Peña cultural',
    detalles: 'Artistas en vivo todos los fines de semana.'
  },
]

// ─── Datos del Menú (Nuestra Carta) ───────────────────────────────────────────
const MENU_CATEGORIAS = [
  { id: 'principales', nombre: 'Platos Tradicionales' },
  { id: 'entradas', nombre: 'Entradas y Acompañamientos' },
  { id: 'bebidas', nombre: 'Bebidas Tradicionales' }
]

const MENU_ITEMS = {
  principales: [
    {
      nombre: 'Pampaku Tradicional',
      precio: 'Bs. 70',
      descripcion: 'Carnes selectas de res, cordero, cerdo y pollo sazonadas con hierbas aromáticas locales y cocidas bajo tierra con piedras calientes al estilo de los valles.',
      ingredientes: 'Papa, camote, oca, plátano, habas, carnes de res, cordero, cerdo y pollo'
    },
    {
      nombre: 'Charque K\'Full',
      precio: 'Bs. 65',
      descripcion: 'Filetes delgados de carne deshidratada y frita hasta lograr una textura crocante y sabrosa, acompañado de mote de maíz y huevo duro.',
      ingredientes: 'Charque crujiente de res, mote de maíz, huevo duro, queso criollo artesanal'
    },
    {
      nombre: 'Lambreado de Conejo',
      precio: 'Bs. 55',
      descripcion: 'Conejo criollo tierno, apanado y dorado a la perfección, bañado con un delicioso y picante ahogado tradicional de ají colorado.',
      ingredientes: 'Conejo criollo, pan molido especiado, ají colorado, ensalada de la casa'
    },
    {
      nombre: 'Fideos Uchu',
      precio: 'Bs. 50',
      descripcion: 'Plato picante tradicional de fideos con ají colorado de la casa, servido con jugosos trozos de carne y papas enteras.',
      ingredientes: 'Fideo grueso seleccionado, ají colorado valluno, carne de res, papa cocida'
    }
  ],
  entradas: [
    {
      nombre: 'Escabeche Mixto',
      precio: 'Bs. 30',
      descripcion: 'Patitas de cerdo marinadas y verduras en conserva en vinagreta artesanal con pimienta y especias locales.',
      ingredientes: 'Patitas de cerdo, zanahoria, cebolla morada, locoto picante, vinagre de manzana'
    },
    {
      nombre: 'Pastel de Choclo',
      precio: 'Bs. 25',
      descripcion: 'Pastel horneado de maíz tierno molido a mano, relleno de abundante queso criollo derretido con un sutil aroma a canela.',
      ingredientes: 'Choclo tierno del valle, queso criollo, canela molida, huevos de campo'
    }
  ],
  bebidas: [
    {
      nombre: 'Chicha Cochabambina',
      precio: 'Bs. 15',
      descripcion: 'Bebida fermentada tradicional de maíz amarillo cultivado en los valles cochabambinos, servida bien fría en jarra de barro.',
      ingredientes: 'Maíz amarillo fermentado de manera artesanal, agua, azúcar'
    },
    {
      nombre: 'Cerveza Huari Tradicional',
      precio: 'Bs. 25',
      descripcion: 'Cerveza premium nacional elaborada con agua pura de vertiente andina, ideal para maridar con la comida picante.',
      ingredientes: 'Malta seleccionada, agua de vertiente andina, lúpulo'
    }
  ]
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
          Promos
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

function NuestraCarta() {
  const [categoriaActiva, setCategoriaActiva] = useState('principales')

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
          {MENU_ITEMS[categoriaActiva].map((item, index) => (
            <div className="menu-item-card" key={index}>
              <div className="menu-item-header">
                <h3 className="menu-item-name">{item.nombre}</h3>
                <span className="menu-item-price">{item.precio}</span>
              </div>
              <p className="menu-item-desc">{item.descripcion}</p>
              <div className="menu-item-ingredients">
                <span className="menu-item-ingredients-label">Ingredientes:</span>
                <p className="menu-item-ingredients-text">{item.ingredientes}</p>
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
          <a onClick={() => scrollToSection('promociones')}>Promociones</a>
          <a onClick={() => scrollToSection('contacto')}>Contacto</a>
        </div>

        <div className="footer-info">
          <p>Av. Melchor Perez de Olguin, Cochabamba, Bolivia</p>
          <p>Telf: +591 76995052 · Abierto todos los días de 11:00 a 22:00</p>
        </div>

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
      <FloatingNavbar />
      <HeroGallery />
      <GaleriaMosaico />
      <NuestraCarta />
      <AvisosDestacados promosList={promosAPI} loading={loadingPromos} />
      <UbicacionContacto />
      <Footer />
      <WhatsAppFAB />
    </>
  )
}
