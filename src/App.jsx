import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MapPin, Clock, Phone, MessageCircle, ChevronUp,
  Utensils, Leaf, Heart, Award, ChevronLeft, ChevronRight,
  Menu as MenuIcon, X, Play, Pause
} from 'lucide-react'
import Papa from 'papaparse'
import './index.css'

// ─── DATA ────────────────────────────────────────────────────────────────────

const MENU_ITEMS = {
  platos: [
    { name: 'Pique (Medio)', price: 'Bs 80', img: null },
    { name: 'Pique (Entero)', price: 'Bs 120', img: null },
    { name: 'Charque (Medio)', price: 'Bs 80', img: '/charque.jpg' },
    { name: 'Charque (Entero)', price: 'Bs 120', img: '/charque.jpg' },
    { name: 'Planchita (Medio)', price: 'Bs 80', img: null },
    { name: 'Planchita (Entero)', price: 'Bs 120', img: null },
    { name: 'Jatun Pampaku', price: 'Bs 110', img: '/jatun-pampaku.jpg' },
    { name: 'Lapping', price: 'Bs 80', img: null },
    { name: 'Lambreado de Conejo', price: 'Bs 80', img: '/lambreado.jpg' },
    { name: 'Alitas', price: 'Bs 25', img: null },
    { name: 'Chillami', price: 'Bs 120', img: null },
    { name: 'Chajchu', price: 'Bs 80', img: '/chajchu.jpg' },
    { name: 'Escabeche Mixto', price: 'Bs 80', img: '/escabeche-mixto.jpg' },
  ],
  caldos: [
    { name: 'Lomito Borracho', price: 'Bs 30', img: null },
    { name: 'Kawi', price: 'Bs 20', img: '/logo-hoja.png' },
    { name: 'Fideosuchu ', price: 'Bs 40', img: '/fideosuchu.jpg' },
  ],
}

/**
 * PROMOS: Ahora se cargan dinámicamente desde el Backend
 */
const FALLBACK_PROMOS = [
  {
    tipo: 'imagen',
    datos_base64: '/promo5.jpg',
    badge: 'Promoción · Marzo 2025',
    titulo: 'Oferta Especial del Mes',
    subtitulo: '¡Por tiempo limitado! Consulta disponibilidad.',
  },
  {
    tipo: 'imagen',
    datos_base64: '/promo2.jpg',
    badge: 'Promoción Exclusiva',
    titulo: 'Combos y Novedades',
    subtitulo: 'Disfruta nuestras mejores combinaciones.',
  },
  {
    tipo: 'imagen',
    datos_base64: '/promo3.jpg',
    badge: 'No te lo pierdas',
    titulo: 'Sabores de Temporada',
    subtitulo: 'Lo mejor de la cocina boliviana en cada plato.',
  }
];

// ─── GOOGLE SHEETS URL (Reemplazar por el link de tu CSV de Google Sheets) ─────
// Te daré las instrucciones de cómo obtener este link exacto en mi siguiente mensaje
const GOOGLE_SHEETS_CSV_URL = import.meta.env.VITE_GOOGLE_SHEETS_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT6xrhLFNwGj-A2IvIevRfWcjCv-PsYI0UQG091hVatjwkRFeR5hHcM8h80fEksaZcOY5cM0kcJYTDl/pub?output=csv';

const MENU_TABS = [
  { key: 'platos', label: 'Platos Fuertes', icon: <Utensils size={16} /> },
  { key: 'caldos', label: 'Caldos', icon: '🍲' },
]

// ─── NAVBAR ──────────────────────────────────────────────────────────────────

function Navbar({ activeSection }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const links = ['inicio', 'nosotros', 'menu', 'promociones', 'contacto']

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNav = (id) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`} id="nav">
        <div className="nav-inner">

          {/* Logo real del restaurante */}
          <a href="#inicio" className="logo" onClick={e => { e.preventDefault(); handleNav('inicio') }}>
            <div className="logo-img-wrap">
              <img src="/logo-hoja.png" alt="El Jardín — Peña Restaurant" className="logo-img" />
            </div>
            <div className="logo-text">
              <span className="logo-name">El Jardín</span>
              <span className="logo-sub">Peña · Restaurant</span>
            </div>
          </a>

          {/* Links */}
          <ul className="nav-links">
            {links.map(id => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={activeSection === id ? 'active' : ''}
                  onClick={e => { e.preventDefault(); handleNav(id) }}
                >
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </a>
              </li>
            ))}
          </ul>

          {/* WhatsApp CTA */}
          <div className="nav-cta">
            <a
              href="https://wa.me/59176995052"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-whatsapp"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
          </div>

          {/* Hamburger */}
          <button
            className="nav-toggle"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Menú"
          >
            {mobileOpen ? <X size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        {links.map(id => (
          <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); handleNav(id) }}>
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </a>
        ))}
        <div className="mobile-menu-footer">
          <a
            href="https://wa.me/59176995052"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-whatsapp-btn"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <MessageCircle size={18} />
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    </>
  )
}

// ─── HERO ────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="hero" id="inicio">
      {/* Portada real de Facebook como fondo */}
      <div className="hero-bg" style={{ backgroundImage: "url('/hero-bg.jpg')" }} />
      <div className="hero-overlay" />
      <div className="hero-content container">
        <p className="hero-tag">Peña · Restaurant · Bolivia</p>
        <h1 className="hero-title">
          Restaurante<br />
          <em>El Jardín</em>
        </h1>
        <p className="hero-desc">
          Sabores que conectan con nuestras raíces — Pique, Charque,
          Caldos, Planchitas, música en vivo y mucho más.
        </p>
        <div className="hero-btns">
          <a href="#menu" className="btn btn-primary">
            <Utensils size={17} /> Ver Menú
          </a>
          <a href="#contacto" className="btn btn-outline">
            <MapPin size={17} /> Nuestra Ubicación
          </a>
        </div>
        <div className="hero-badges">
          <div className="hero-badge">
            <span className="hero-badge-num">100%</span>
            <span className="hero-badge-label">Auténtico</span>
          </div>
          <div className="hero-badge">
            <span className="hero-badge-num">+15</span>
            <span className="hero-badge-label">Platos típicos</span>
          </div>
          <div className="hero-badge">
            <span className="hero-badge-num">Lun–Dom</span>
            <span className="hero-badge-label">Abierto siempre</span>
          </div>
        </div>
      </div>
      <div className="hero-scroll">
        <div className="hero-scroll-line" />
        <span>Descubrir</span>
      </div>
    </section>
  )
}

// ─── NOSOTROS ─────────────────────────────────────────────────────────────────

function Nosotros() {
  const features = [
    {
      icon: <Award size={22} />,
      title: 'Recetas Auténticas',
      desc: 'Preparamos cada plato siguiendo tradiciones culinarias bolivianas heredadas de generación en generación.',
    },
    {
      icon: <Leaf size={22} />,
      title: 'Ingredientes Frescos',
      desc: 'Trabajamos con proveedores locales para garantizar la frescura y calidad en cada preparación.',
    },
    {
      icon: <Heart size={22} />,
      title: 'Peña y Música en Vivo',
      desc: 'Más que un restaurante — somos una peña con grupos en vivo, ambiente cálido y alegría boliviana.',
    },
  ]

  return (
    <section className="section" id="nosotros">
      <div className="container">
        <div className="nosotros-grid">
          {/* Visual */}
          <div className="nosotros-visual">
            <div className="nosotros-img-wrap">
              <img
                src="/musica.jpg"
                alt="El Jardín — Cocina y Peña"
                loading="lazy"
              />
              <div className="nosotros-img-overlay" />
            </div>
            <div className="nosotros-badge">
              <span className="nosotros-badge-num">🎵</span>
              <span className="nosotros-badge-text">Peña Boliviana</span>
            </div>
          </div>

          {/* Content */}
          <div className="nosotros-content">
            <div className="nosotros-text">
              <span className="section-tag">Nuestra Historia</span>
              <h2 className="section-title" style={{ textAlign: 'left', marginTop: '16px' }}>
                Un lugar con sabor<br />a tradición
              </h2>
              <p>
                El Jardín nació como peña y restaurante con la misión de ofrecer la auténtica comida
                boliviana en un ambiente cálido y familiar. Cada plato está preparado con ingredientes
                frescos y recetas que pasan de generación en generación, honrando la riqueza culinaria
                de Bolivia.
              </p>
            </div>
            <div className="nosotros-features">
              {features.map((f, i) => (
                <div className="nosotros-feature" key={i}>
                  <div className="nosotros-feature-icon">{f.icon}</div>
                  <div className="nosotros-feature-text">
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── MENÚ ─────────────────────────────────────────────────────────────────────

function MenuSection() {
  const [activeTab, setActiveTab] = useState('platos')

  return (
    <section className="section section-dark" id="menu">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Nuestra Carta</span>
          <h2 className="section-title">Lo que ofrecemos</h2>
          <p className="section-desc">
            Platos elaborados con ingredientes frescos y recetas de la tradición boliviana.
          </p>
        </div>

        <div className="menu-tabs">
          {MENU_TABS.map(t => (
            <button
              key={t.key}
              className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="menu-grid">
          {MENU_ITEMS[activeTab].map((item, i) => (
            <div className="menu-card" key={i} style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="menu-card-img">
                {item.img
                  ? <img src={item.img} alt={item.name} loading="lazy" />
                  : <div className="menu-card-placeholder">{item.icon}</div>
                }
              </div>
              <div className="menu-card-body">
                <div className="menu-card-name">{item.name}</div>
                <div className="menu-card-price">{item.price}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── SLIDE MEDIA — renderiza imagen o video ───────────────────────────────────

function SlideMedia({ promo, isActive, className }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (!videoRef.current) return
    if (isActive) {
      videoRef.current.play().catch(() => { })
    } else {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [isActive])

  if (promo.tipo === 'video') {
    return (
      <video
        ref={videoRef}
        src={promo.imagen_url || promo.datos_base64}
        className={className}
        controls
        playsInline
        loop
        style={{ background: '#000' }}
      />
    )
  }

  return (
    <img
      src={promo.imagen_url || promo.datos_base64}
      alt={promo.titulo}
      className={className}
      loading="lazy"
      onError={e => {
        e.target.style.display = 'none'
        e.target.parentElement.style.background = 'linear-gradient(135deg, #111a0e, #1e2d18)'
      }}
    />
  )
}

// ─── PROMO MODAL ──────────────────────────────────────────────────────────────

function PromoModal({ promo, onClose }) {
  if (!promo) return null;

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="promo-modal-backdrop" onClick={onClose}>
      <div className="promo-modal" onClick={e => e.stopPropagation()}>
        <button className="promo-modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
        <div className="promo-modal-img-wrap">
          <SlideMedia
            promo={promo}
            isActive={true}
            className="promo-modal-img"
          />
        </div>
        <div className="promo-modal-body">
          <div className="promo-modal-actions" style={{ justifyContent: 'center' }}>
            <a
              href="https://wa.me/59176995052"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold"
              onClick={onClose}
            >
              <MessageCircle size={18} />
              ¡Me interesa!
            </a>
            <button className="btn btn-outline" onClick={onClose}>Ver más tarde</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── PROMOCIONES ──────────────────────────────────────────────────────────────

function Promociones({ promosList, loading }) {
  const [current, setCurrent] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const timerRef = useRef(null)

  const promos = promosList && promosList.length > 0 ? promosList : FALLBACK_PROMOS;
  const total = promos.length;

  const go = useCallback(idx => {
    if (total === 0) return
    setCurrent((idx + total) % total)
  }, [total])

  // Pausa el autoplay cuando el slide activo es un video (el video toma el control)
  const currentIsVideo = promos[current]?.tipo === 'video'

  useEffect(() => {
    if (!autoplay || currentIsVideo || loading) return
    timerRef.current = setInterval(() => go(current + 1), 5500)
    return () => clearInterval(timerRef.current)
  }, [autoplay, current, go, currentIsVideo, loading])

  const pause = () => { setAutoplay(false); clearInterval(timerRef.current) }
  const resume = () => { if (!currentIsVideo) setAutoplay(true) }

  return (
    <section className="section promo-section" id="promociones">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Ofertas y Novedades</span>
          <h2 className="section-title">Promociones del Mes</h2>
          <p className="section-desc">
            Anuncios especiales, grupos en vivo y eventos del restaurante.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#b9a16b', fontSize: '1.2rem', fontFamily: 'Georgia, serif' }}>
            Cargando promociones...
          </div>
        ) : promos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#b9a16b', fontSize: '1.2rem', fontFamily: 'Georgia, serif' }}>
            No hay promociones exclusivas en este momento...
          </div>
        ) : (
          <>
            <div
              className="promo-carousel-outer"
              onMouseEnter={pause}
              onMouseLeave={resume}
            >
              <div className="promo-carousel">
                <div
                  className="promo-track"
                  style={{ transform: `translateX(-${current * 100}%)` }}
                >
                  {promos.map((p, i) => (
                    <div className="promo-slide" key={i}>
                      <div className="promo-slide-frame">
                        <SlideMedia
                          promo={p}
                          isActive={i === current}
                          className="promo-slide-img-full"
                        />
                      </div>
                      <div className="promo-slide-caption-bar">
                        <span className="promo-slide-badge">{p.badge}</span>
                        <span className="promo-slide-bar-title">{p.titulo}</span>
                        {p.tipo === 'video' && (
                          <span className="promo-video-indicator">
                            <Play size={13} style={{ marginRight: 4 }} />
                            Video
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="promo-arrow promo-arrow-prev" onClick={() => { pause(); go(current - 1) }} aria-label="Anterior">
                <ChevronLeft size={22} />
              </button>
              <button className="promo-arrow promo-arrow-next" onClick={() => { pause(); go(current + 1) }} aria-label="Siguiente">
                <ChevronRight size={22} />
              </button>
            </div>

            <div className="promo-dots">
              {promos.map((p, i) => (
                <button
                  key={i}
                  className={`promo-dot ${i === current ? 'active' : ''}`}
                  onClick={() => { pause(); go(i) }}
                  aria-label={`Ir a promoción ${i + 1}`}
                />
              ))}
            </div>

            <div className="promo-thumbs">
              {promos.map((p, i) => (
                <button
                  key={i}
                  className={`promo-thumb ${i === current ? 'active' : ''}`}
                  onClick={() => { pause(); go(i) }}
                  aria-label={`Promoción ${i + 1}`}
                >
                  {p.tipo === 'video'
                    ? <div className="promo-thumb-video"><Play size={16} /></div>
                    : <img src={p.imagen_url || p.datos_base64} alt="" />
                  }
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

// ─── CONTACTO ─────────────────────────────────────────────────────────────────

function Contacto() {
  const cards = [
    {
      icon: <MapPin size={24} />,
      title: 'Dirección',
      content: <>Final, Av. Melchor Perez de Olguin, Cochabamba</>,
    },
    {
      icon: <Clock size={24} />,
      title: 'Horario',
      content: <>Lunes a Domingo<br />11:00 — 22:00 hs</>,
    },
    {
      icon: <Phone size={24} />,
      title: 'Teléfono',
      content: <a href="tel:+59176995052">+591 76995052</a>,
    },
    {
      icon: <MessageCircle size={24} />,
      title: 'WhatsApp',
      content: (
        <a
          href="https://wa.me/59176995052"
          target="_blank"
          rel="noopener noreferrer"
          className="contact-whatsapp-btn"
        >
          <MessageCircle size={16} />
          Enviar mensaje
        </a>
      ),
    },
  ]

  return (
    <section className="section section-dark" id="contacto">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Encuéntranos</span>
          <h2 className="section-title">Visítanos</h2>
          <p className="section-desc">
            Estamos esperándote con la mesa lista y los platos más ricos de Bolivia.
          </p>
        </div>
        <div className="contact-grid">
          {cards.map((c, i) => (
            <div className="contact-card" key={i}>
              <div className="contact-card-icon">{c.icon}</div>
              <h4>{c.title}</h4>
              <p>{c.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <img src="/logo-hoja.png" alt="El Jardín" className="footer-logo-img" />
        <p className="footer-tagline">Peña · Restaurant · Bolivia</p>
        <div className="footer-links">
          <a href="#inicio">Inicio</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#menu">Menú</a>
          <a href="#promociones">Promociones</a>
          <a href="#contacto">Contacto</a>
        </div>
        <p className="footer-copy">
          © {new Date().getFullYear()} Restaurante El Jardín · Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}

// ─── SCROLL TRACKING ──────────────────────────────────────────────────────────

function useActiveSection(sections) {
  const [active, setActive] = useState(sections[0])
  useEffect(() => {
    const refs = sections.map(id => document.getElementById(id))
    const obs = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }) },
      { threshold: 0.35 }
    )
    refs.forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [sections])
  return active
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [showTop, setShowTop] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [promosAPI, setPromosAPI] = useState([])
  const [loadingPromos, setLoadingPromos] = useState(true)

  const sections = ['inicio', 'nosotros', 'menu', 'promociones', 'contacto']
  const activeSection = useActiveSection(sections)

  useEffect(() => {
    if (!GOOGLE_SHEETS_CSV_URL) {
      // Si no hay URL configurada, muestra las variables por defecto tras 1 segundo
      setTimeout(() => setLoadingPromos(false), 1000)
      return
    }

    Papa.parse(GOOGLE_SHEETS_CSV_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;
        if (Array.isArray(data) && data.length > 0) {
          // Las respuestas del formulario vienen de más antigua a más nueva.
          // Tomamos las últimas 5 y las mostramos de más nueva a más antigua.
          const mapped = data
            .filter(row => row['Link de foto o video'] && row['Link de foto o video'].trim() !== '')
            .slice(-5)      // últimas 5 filas
            .reverse()     // la más nueva primero
            .map(row => ({
              tipo: (row['Tipo de archivo'] || 'imagen').toLowerCase().trim() === 'video' ? 'video' : 'imagen',
              imagen_url: (row['Link de foto o video'] || '').trim(),
              badge: (row['Peña etiqueta'] || '').trim() || 'Promoción',
              titulo: (row['Titulo de la Promocion'] || '').trim() || 'Novedad del Mes',
              subtitulo: (row['Subtitulo o Descripcion'] || '').trim(),
            }))
          setPromosAPI(mapped)
        }
        setLoadingPromos(false)
      },
      error: (error) => {
        console.error("Error al leer Google Sheets CSV:", error)
        setLoadingPromos(false)
      }
    })
  }, [])

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setShowModal(true), 1800)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <Navbar activeSection={activeSection} />
      <Hero />
      <Nosotros />
      <MenuSection />
      <Promociones promosList={promosAPI} loading={loadingPromos} />
      <Contacto />
      <Footer />
      <button
        className={`back-to-top ${showTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Volver arriba"
      >
        <ChevronUp size={22} />
      </button>
      {showModal && <PromoModal promo={promosAPI.length > 0 ? promosAPI[0] : FALLBACK_PROMOS[0]} onClose={() => setShowModal(false)} />}
    </>
  )
}
