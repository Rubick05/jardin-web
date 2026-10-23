import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MapPin, Clock, Phone, MessageCircle, X, Search, Mail, Smartphone,
  Download, Sparkles, Eye, Info, Navigation, Compass, AlertTriangle,
  CheckCircle2, ShoppingBag, Trash2, ChevronUp, ChevronDown
} from 'lucide-react'
import './index.css'
import ModalInstalacionApp from './components/ModalInstalacionApp.jsx'

// ─── Verificación en Tiempo Real de Horario de El Jardín ───────────────────────
function obtenerEstadoHorarioRestaurante() {
  const ahora = new Date()
  const horaUtc = ahora.getTime() + (ahora.getTimezoneOffset() * 60000)
  // Bolivia es UTC-4
  const fechaBolivia = new Date(horaUtc - (4 * 3600000))
  
  const dia = fechaBolivia.getDay() // 0 = Domingo, 4 = Jueves, 6 = Sábado
  const hora = fechaBolivia.getHours()
  const minutos = fechaBolivia.getMinutes()
  const horaDecimal = hora + (minutos / 60)

  let abierto = false
  let mensaje = ''

  if (dia === 4) { // Jueves: 11:00 a 23:00
    if (horaDecimal >= 11 && horaDecimal < 23) {
      abierto = true
      mensaje = 'Atendiendo hoy Jueves hasta las 23:00 hs'
    } else if (horaDecimal < 11) {
      mensaje = 'Abre hoy Jueves a las 11:00 AM'
    } else {
      mensaje = 'Cerrado por hoy. Próxima atención: Sábado a las 12:00 PM'
    }
  } else if (dia === 6) { // Sábado: 12:00 a 23:00
    if (horaDecimal >= 12 && horaDecimal < 23) {
      abierto = true
      mensaje = 'Atendiendo hoy Sábado hasta las 23:00 hs (Peña en vivo)'
    } else if (horaDecimal < 12) {
      mensaje = 'Abre hoy Sábado a las 12:00 PM'
    } else {
      mensaje = 'Cerrado por hoy. Abre mañana Domingo a las 12:00 PM'
    }
  } else if (dia === 0) { // Domingo: 12:00 a 23:00
    if (horaDecimal >= 12 && horaDecimal < 23) {
      abierto = true
      mensaje = 'Atendiendo hoy Domingo hasta las 23:00 hs'
    } else if (horaDecimal < 12) {
      mensaje = 'Abre hoy Domingo a las 12:00 PM'
    } else {
      mensaje = 'Cerrado por hoy. Próxima atención: Jueves a las 11:00 AM'
    }
  } else {
    // Lunes, Martes, Miércoles, Viernes
    const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const nombreHoy = nombresDias[dia]
    if (dia < 4) {
      mensaje = `Hoy ${nombreHoy} el restaurante está cerrado. Horario: Jueves (11:00-23:00), Sábados y Domingos (12:00-23:00).`
    } else {
      mensaje = `Hoy Viernes se alista la cocina valluna. Horario de atención: Sábado y Domingo desde las 12:00 PM.`
    }
  }

  return { abierto, mensaje }
}

import {
  cargarMenuDesdeSupabase,
  cargarPromocionesDesdeSupabase,
  cargarWebConfigDesdeSupabase,
  resolverImagenPlato,
  optimizarUrlImagen,
  CATEGORIAS_CARTA,
  clasificarCategoriaPlato,
  FALLBACK_MENU_ITEMS,
  API_URL
} from './lib/api-menu.js'

// ─── FALLBACK DATA (cuando la API no responde) ────────────────────────────────
const FALLBACK_PROMOS = [
  {
    tipo: 'imagen',
    imagen_base64: '/hero-el-jardin.jpg',
    badge: 'Jueves de Tradición',
    titulo: '¡Jueves de Fideos Uchu y Música en Vivo!',
    subtitulo: '¡Ven a probar el mejor Fideos Uchu de Cochabamba! Música folclórica en vivo, platos de antaño y la atención más cálida de nuestra gente.',
  },
  {
    tipo: 'imagen',
    imagen_base64: '/musica.jpg',
    badge: 'Peña Folclórica',
    titulo: 'Viernes y Sábados de Peña en Vivo',
    subtitulo: 'Disfruta de las mejores veladas de música folclórica, cuecas y huayños con destacados artistas en vivo en un ambiente cálido y familiar.',
  },
  {
    tipo: 'imagen',
    imagen_base64: '/pampaku.jpg',
    badge: 'Tradición K\'ochala',
    titulo: 'Gran Pampaku Valluno & Charque Criollo',
    subtitulo: 'Especialistas en comida tradicional cochabambina: carnes tiernas bajo tierra, charque crujiente y abundante para compartir en familia.',
  }
]

// ─── Imágenes para el Hero Slideshow ──────────────────────────────────────────
const HERO_SLIDES = [
  '/hero-el-jardin.jpg',
  '/hero-bg.jpg',
  '/musica.jpg'
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
const MENU_CATEGORIAS = CATEGORIAS_CARTA

const MENU_ITEMS = {
  principales: [],
  caldos: [],
  refrescos: [],
  cervezas: []
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

function FloatingNavbar({ onOpenInstalacion }) {
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
        <div className="floating-navbar-logo" style={{ overflow: 'hidden', borderRadius: '50%', border: '1px solid var(--primary)' }}>
          <img src="/logo-el-jardin.jpg" alt="El Jardín" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <span className="floating-navbar-text" style={{ fontFamily: 'var(--font-brand)', fontSize: '1.3rem', letterSpacing: '0.02em' }}>El Jardín</span>
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
        <button
          type="button"
          onClick={onOpenInstalacion}
          className="floating-navbar-link"
          style={{
            background: 'rgba(200, 144, 58, 0.2)',
            border: '1px solid rgba(200, 144, 58, 0.45)',
            color: 'var(--gold-light)',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            borderRadius: '100px',
            padding: '4px 10px',
            cursor: 'pointer'
          }}
          title="Descargar APK o Instalar PWA"
        >
          <Smartphone size={13} />
          <span>App</span>
        </button>
      </div>
    </nav>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
//  HERO GALLERY — Slideshow fullscreen con Ken Burns
// ═══════════════════════════════════════════════════════════════════════════════

function HeroGallery({ slides, onOpenReserva, onOpenInstalacion }) {
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
              backgroundImage: `url('${optimizarUrlImagen(src, 1400)}')`,
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
        <div className="hero-gallery-logo-wrap" style={{ marginBottom: '16px' }}>
          <img 
            src="/logo-el-jardin.jpg" 
            alt="El Jardín Tradición K'ochala" 
            style={{ 
              width: '92px', 
              height: '92px', 
              borderRadius: '50%', 
              objectFit: 'cover', 
              border: '3px solid var(--primary)', 
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
              margin: '0 auto'
            }} 
          />
        </div>
        <div className="hero-brand-header">
          <span style={{ 
            fontFamily: 'var(--font-tag)', 
            letterSpacing: '0.28em', 
            textTransform: 'uppercase', 
            fontSize: '0.85rem', 
            color: 'var(--primary-light)', 
            display: 'block', 
            marginBottom: '4px',
            fontWeight: 700
          }}>
            Tradición K'ochala
          </span>
          <h1 className="hero-gallery-title brand-title-script" style={{ 
            fontFamily: 'var(--font-brand)', 
            fontSize: 'clamp(3.4rem, 8vw, 6rem)', 
            lineHeight: 1.05, 
            letterSpacing: '0.02em',
            margin: '0 0 6px 0',
            textShadow: '0 4px 30px rgba(0,0,0,0.8)'
          }}>
            El Jardín
          </h1>
          <p className="hero-gallery-sub brand-subtitle-tracked" style={{ 
            fontFamily: 'var(--font-tag)', 
            letterSpacing: '0.35em', 
            fontSize: 'clamp(0.9rem, 1.8vw, 1.2rem)', 
            textTransform: 'uppercase',
            color: '#ffffff',
            fontWeight: 800,
            marginBottom: '10px'
          }}>
            Peña · Restaurant
          </p>
          <p style={{
            fontSize: '0.98rem',
            color: 'rgba(237, 232, 220, 0.9)',
            maxWidth: '560px',
            margin: '0 auto 28px',
            lineHeight: 1.6
          }}>
            Especialistas en comida tradicional cochabambina · Jueves de Fideos Uchu y música folclórica en vivo
          </p>
        </div>
        
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
          <button 
            type="button"
            onClick={onOpenInstalacion} 
            className="btn btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: 'rgba(200, 144, 58, 0.5)',
              color: 'var(--gold-light)'
            }}
          >
            <Smartphone size={16} /> Instalar App / APK
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
              <img src={optimizarUrlImagen(item.src, 900)} alt={item.nombre} loading="lazy" decoding="async" />
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
  const [busqueda, setBusqueda] = useState('')
  const [platoDetalle, setPlatoDetalle] = useState(null)

  // Obtener platos según búsqueda o categoría activa
  const todosLosPlatos = Object.values(menu).flat()
  const platos = busqueda.trim()
    ? todosLosPlatos.filter(item => {
        const q = busqueda.toLowerCase().trim()
        const matchNombre = (item.nombre || '').toLowerCase().includes(q)
        const matchDesc = (item.descripcion || '').toLowerCase().includes(q)
        const matchIng = (item.ingredientes || '').toLowerCase().includes(q)
        return matchNombre || matchDesc || matchIng
      })
    : (menu[categoriaActiva] || [])

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

        {/* Barra de Búsqueda Interactiva del Menú */}
        <div style={{ maxWidth: '480px', margin: '0 auto 28px', position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1.5px solid rgba(74, 124, 63, 0.25)',
            borderRadius: '100px',
            padding: '10px 18px',
            backdropFilter: 'blur(10px)',
            transition: 'border-color 0.3s ease'
          }}>
            <Search size={18} color="var(--gold-light, #e8af60)" />
            <input
              type="text"
              placeholder="Buscar por plato o ingrediente (ej. Charque, Uchu)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '13.5px',
                outline: 'none',
                fontFamily: 'Inter, sans-serif'
              }}
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
          {busqueda && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#a8b89a', marginTop: '8px' }}>
              Encontrados {platos.length} plato(s) con "{busqueda}"
            </p>
          )}
        </div>

        {/* Selector de categorías horizontal */}
        {!busqueda && (
          <div className="menu-tabs">
            {MENU_CATEGORIAS.map((cat) => {
              const cantidad = (menu[cat.id] || []).length
              return (
                <button
                  key={cat.id}
                  className={`menu-tab-btn ${categoriaActiva === cat.id ? 'active' : ''}`}
                  onClick={() => setCategoriaActiva(cat.id)}
                >
                  <span style={{ marginRight: '6px' }}>{cat.icon}</span>
                  {cat.nombre}
                  {cantidad > 0 && (
                    <span style={{
                      marginLeft: '6px',
                      background: categoriaActiva === cat.id ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.08)',
                      padding: '2px 7px',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      {cantidad}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Grilla de platos interactiva */}
        <div className="menu-grid">
          {platos.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted" style={{ gridColumn: '1 / -1', padding: '40px 0', textAlign: 'center', color: '#888' }}>
              <p style={{ fontSize: '15px', marginBottom: '8px' }}>No hay platos disponibles con esta búsqueda.</p>
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="btn btn-gold"
                  style={{ padding: '8px 20px', borderRadius: '100px', fontSize: '12px' }}
                >
                  Ver toda la carta
                </button>
              )}
            </div>
          ) : (
            platos.map((item, index) => {
              const imageSrc = item.imagenResuelta || resolverImagenPlato(item, todosLosPlatos)
              const formattedPrice = typeof item.precio_actual === 'number'
                ? `Bs. ${item.precio_actual}`
                : (item.precio ? `Bs. ${item.precio}` : 'Consultar')
              const cant = pedido[item.id] || 0

              return (
                <div 
                  className={`menu-item-card ${imageSrc ? 'has-image' : ''}`} 
                  key={item.id || index}
                >
                  {imageSrc && (
                    <div 
                      className="menu-item-image"
                      onClick={() => setPlatoDetalle({ ...item, imageSrc, formattedPrice })}
                      style={{ cursor: 'pointer' }}
                      title="Ver foto y detalles completos"
                    >
                      <img src={imageSrc} alt={item.nombre} loading="lazy" decoding="async" />
                      <div className="menu-item-image-overlay" style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'flex-end',
                        padding: '6px'
                      }}>
                        <span style={{ background: 'rgba(0,0,0,0.5)', padding: '3px 6px', borderRadius: '6px', fontSize: '10px', color: '#fff', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Eye size={10} /> Ver
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="menu-item-content">
                    <div>
                      <div className="menu-item-header">
                        <h3 
                          className="menu-item-name" 
                          onClick={() => setPlatoDetalle({ ...item, imageSrc, formattedPrice })}
                          style={{ cursor: 'pointer' }}
                        >
                          {item.nombre}
                        </h3>
                      </div>
                      <p className="menu-item-desc">{item.descripcion || 'Especialidad tradicional de la casa.'}</p>
                    </div>
                    {item.ingredientes && (
                      <div className="menu-item-ingredients" style={{ marginBottom: '8px' }}>
                        <span className="menu-item-ingredients-label">Ingredientes: </span>
                        <span className="menu-item-ingredients-text" style={{ fontSize: '11.5px', color: '#a8b89a' }}>{item.ingredientes}</span>
                      </div>
                    )}
                    
                    {/* Selector de cantidad interactivo en la carta */}
                    <div className="menu-item-action" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(74,124,63,0.12)', paddingTop: '10px' }}>
                      <span className="menu-item-price" style={{ color: 'var(--gold-light)', fontWeight: 'bold', fontSize: '1.05rem', fontFamily: 'monospace' }}>
                        {formattedPrice}
                      </span>
                      
                      {cant > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); decrementar(item.id) }}
                            className="qty-btn"
                            aria-label="Restar uno"
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
                            aria-label="Sumar uno"
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

        {/* Modal de Detalle de Plato en Alta Definición */}
        {platoDetalle && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setPlatoDetalle(null)}
          >
            <div 
              style={{
                width: '100%',
                maxWidth: '480px',
                background: 'linear-gradient(180deg, #121c0e 0%, #080d06 100%)',
                border: '1.5px solid rgba(200, 144, 58, 0.4)',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
                color: '#ede8dc',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button"
                onClick={() => setPlatoDetalle(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 10,
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.2)',
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

              {platoDetalle.imageSrc && (
                <div style={{ width: '100%', height: '240px', overflow: 'hidden', position: 'relative' }}>
                  <img 
                    src={platoDetalle.imageSrc} 
                    alt={platoDetalle.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '20px 16px 10px',
                    background: 'linear-gradient(to top, #121c0e 0%, transparent 100%)'
                  }} />
                </div>
              )}

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>
                      {platoDetalle.categoria || 'Especialidad'}
                    </span>
                    <h3 style={{ margin: '4px 0 0', fontSize: '20px', color: '#fff', fontFamily: 'Playfair Display, serif' }}>
                      {platoDetalle.nombre}
                    </h3>
                  </div>
                  <span style={{ color: 'var(--gold-light)', fontSize: '1.3rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {platoDetalle.formattedPrice}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '13px', color: '#ccc', lineHeight: 1.5 }}>
                  {platoDetalle.descripcion || 'Preparado fresco al momento siguiendo recetas tradicionales de antaño.'}
                </p>

                {platoDetalle.ingredientes && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Info size={14} color="var(--gold)" />
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--gold)' }}>Ingredientes y acompañamientos:</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#a8b89a', lineHeight: 1.4 }}>
                      {platoDetalle.ingredientes}
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>Cantidad en tu pedido:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.5)', padding: '6px 10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <button 
                      type="button"
                      onClick={() => decrementar(platoDetalle.id)}
                      className="qty-btn"
                      style={{ width: '28px', height: '28px', fontSize: '16px' }}
                    >
                      −
                    </button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: 'var(--gold)' }}>
                      {pedido[platoDetalle.id] || 0}
                    </span>
                    <button 
                      type="button"
                      onClick={() => incrementar(platoDetalle.id)}
                      className="qty-btn"
                      style={{ width: '28px', height: '28px', fontSize: '16px' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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

  const mediaSrc = optimizarUrlImagen(promo.imagen_base64 || promo.imagen_url || promo.datos_base64, 1200)

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
            <img src={mediaSrc} alt={promo.titulo || 'Promoción'} className="lightbox-img" decoding="async" />
          )}
        </div>
        <div className="lightbox-body">
          {promo.badge && <span className="lightbox-badge">{promo.badge}</span>}
          {promo.titulo && <h3 className="lightbox-title">{promo.titulo}</h3>}
          {promo.subtitulo && <p className="lightbox-sub">{promo.subtitulo}</p>}
          <div className="lightbox-actions">
            <a
              href={`https://wa.me/59178418801?text=${encodeURIComponent('Hola El Jardín! Me interesa el evento: ' + (promo.titulo || ''))}`}
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
              const mediaSrc = optimizarUrlImagen(p.imagen_base64 || p.imagen_url || p.datos_base64, 900)
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
                      <img src={mediaSrc} alt={p.titulo || 'Promoción'} loading="lazy" decoding="async" />
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
                  Av. Final Melchor Pérez sud 3er puente mano derecha sobre el canal de agua,<br />Cochabamba, Bolivia
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
                  <strong>Jueves de Fideos Uchu:</strong> 11:00 — 23:00 hs<br />
                  <strong>Sábado y Domingo:</strong> 12:00 — 23:00 hs
                </p>
              </div>
            </div>

            <div className="ubicacion-info-item">
              <div className="ubicacion-info-icon">
                <Phone size={22} />
              </div>
              <div>
                <h4>Teléfono / WhatsApp</h4>
                <p><a href="tel:+59178418801">+591 78418801</a></p>
              </div>
            </div>

            <div className="ubicacion-info-item">
              <div className="ubicacion-info-icon whatsapp-icon">
                <MessageCircle size={22} />
              </div>
              <div>
                <h4>Reservas y Pedidos</h4>
                <p><a href="https://wa.me/59178418801" target="_blank" rel="noopener noreferrer">WhatsApp directo (+591 78418801)</a></p>
              </div>
            </div>

            <div className="ubicacion-info-item">
              <div className="ubicacion-info-icon" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
                <Mail size={22} />
              </div>
              <div>
                <h4>Correo Electrónico</h4>
                <p><a href="mailto:eljardintradicionkochala@gmail.com">eljardintradicionkochala@gmail.com</a></p>
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

function Footer({ onOpenReserva, onOpenInstalacion }) {
  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo-el-jardin.jpg" alt="El Jardín Tradición K'ochala" className="footer-logo-img" style={{ borderRadius: '50%', objectFit: 'cover' }} />
          <h3 className="footer-title">El Jardín</h3>
          <p className="footer-tagline">Tradición K'ochala · Peña Restaurant</p>
        </div>

        <div className="footer-links">
          <a onClick={() => scrollToSection('inicio')}>Inicio</a>
          <a onClick={() => scrollToSection('cocina')}>Nuestra Cocina</a>
          <a onClick={() => scrollToSection('menu')}>Menú</a>
          <a onClick={() => scrollToSection('promociones')}>Eventos de la Semana</a>
          <a onClick={() => scrollToSection('contacto')}>Contacto</a>
        </div>

        {/* Información y Dirección del Restaurante */}
        <div className="footer-info">
          <p>Av. Final Melchor Pérez sud 3er puente mano derecha sobre el canal de agua, Cochabamba, Bolivia</p>
          <p>Telf / WhatsApp: +591 78418801 · Correo: eljardintradicionkochala@gmail.com</p>
          <p>Jueves: 11:00 a 23:00 · Sábado y Domingo: 12:00 a 23:00</p>
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
//  PAGINA PEDIDOS Y RESERVAS — Optimizado para Móviles, GPS & Delivery
// ═══════════════════════════════════════════════════════════════════════════════

function PaginaPedidosYReservas({
  menuItems,
  qrPagoRestaurante,
  tipoEntrega,
  setTipoEntrega,
  paso,
  setPaso,
  nombre,
  setNombre,
  telefono,
  setTelefono,
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
  const [alertaFecha, setAlertaFecha] = useState('')
  const [procesandoImagen, setProcesandoImagen] = useState(false)
  const [obteniendoGps, setObteniendoGps] = useState(false)
  const [mostrarModalCanasta, setMostrarModalCanasta] = useState(false)
  const [imagenPreview, setImagenPreview] = useState(null)
  const inputPagoRef = useRef(null)
  const leafletMapRef = useRef(null)
  const leafletMarkerRef = useRef(null)

  // Estado del horario del restaurante
  const estadoRestaurante = obtenerEstadoHorarioRestaurante()

  // Items derivados del pedido
  const itemsSeleccionados = Object.entries(pedido)
    .map(([id, cant]) => {
      const item = menuItems.find(p => p.id === id)
      return item ? { ...item, cantidad: cant } : null
    })
    .filter(Boolean)

  const totalCantidad = itemsSeleccionados.reduce((acc, i) => acc + i.cantidad, 0)

  // Categorías de platos disponibles
  const categoriasDisponibles = ['Todos', 'Platos Tradicionales', 'Caldos y Sopas', 'Refrescos Caseros', 'Cervezas & Tradición']

  const itemsFiltrados = menuItems.filter(item => {
    if (item.disponible === false) return false
    
    if (categoriaActiva !== 'Todos') {
      const catClasif = clasificarCategoriaPlato(item.categoria)
      let nombreCat = 'Platos Tradicionales'
      if (catClasif === 'caldos') nombreCat = 'Caldos y Sopas'
      else if (catClasif === 'refrescos') nombreCat = 'Refrescos Caseros'
      else if (catClasif === 'cervezas') nombreCat = 'Cervezas & Tradición'
      
      if (nombreCat !== categoriaActiva) return false
    }

    if (buscarPlato.trim()) {
      const query = buscarPlato.toLowerCase()
      const matchNombre = (item.nombre || '').toLowerCase().includes(query)
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

  const eliminarPlato = (id) => {
    setPedido(prev => {
      const n = { ...prev }
      delete n[id]
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

  // Reverse geocode para obtener calle y zona aproximada
  const reverseGeocode = async (lat, lng) => {
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
      console.warn('Error reverse geocoding:', e)
    }
  }

  const initLeafletMap = () => {
    const L = window.L
    if (!L) return

    const container = L.DomUtil.get('map-selection')
    if (container) {
      container._leaflet_id = null
    }

    // Configuración para que el mapa no bloquee el scroll vertical en móviles
    const map = L.map('map-selection', {
      scrollWheelZoom: false,
      touchZoom: true,
      dragging: true
    }).setView([coords.lat, coords.lng], 15)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map)

    let marker = L.marker([coords.lat, coords.lng], { draggable: true }).addTo(map)

    leafletMapRef.current = map
    leafletMarkerRef.current = marker

    const updatePosition = async (lat, lng) => {
      setCoords({ lat, lng })
      await reverseGeocode(lat, lng)
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

  // Obtener ubicación GPS actual en 1 toque
  const obtenerUbicacionActual = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador o dispositivo no soporta geolocalización GPS.')
      return
    }

    setObteniendoGps(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setCoords({ lat, lng })
        setObteniendoGps(false)

        if (leafletMapRef.current && leafletMarkerRef.current) {
          leafletMarkerRef.current.setLatLng([lat, lng])
          leafletMapRef.current.setView([lat, lng], 16)
        }
        await reverseGeocode(lat, lng)
      },
      (err) => {
        setObteniendoGps(false)
        console.warn('GPS Error:', err)
        alert('No pudimos acceder a tu ubicación GPS. Por favor activa el GPS de tu celular o selecciona el punto en el mapa.')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  // Abrir ubicación en Google Maps
  const abrirEnGoogleMaps = () => {
    window.open(`https://www.google.com/maps?q=${coords.lat},${coords.lng}`, '_blank')
  }

  useEffect(() => {
    if (tipoEntrega !== 'delivery' || paso !== 1) return
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
  }, [tipoEntrega, paso])

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
    if (!nombre.trim()) { alert('Por favor ingresa tu nombre completo.'); return }
    
    if (tipoEntrega === 'local') {
      if (!fecha) { alert('Por favor selecciona la fecha de reserva.'); return }
      if (!hora) { alert('Por favor selecciona la hora de llegada.'); return }
    }
    
    if (tipoEntrega === 'delivery') {
      if (!direccion.trim()) { alert('Por favor ingresa la dirección de entrega.'); return }
      if (!zona) { alert('Por favor selecciona tu zona o barrio.'); return }
    }

    const itemStrings = itemsSeleccionados.map(
      item => `- *${item.cantidad}x* ${item.nombre} (Bs. ${(item.precio_actual * item.cantidad).toFixed(0)})`
    )

    let mensaje
    if (tipoEntrega === 'delivery') {
      mensaje = `*🛵 PEDIDO A DOMICILIO — Restaurante El Jardín*

*👤 Datos del Cliente:*
- *Nombre:* ${nombre}
${telefono ? `- *Teléfono / WhatsApp:* ${telefono}` : ''}
${!estadoRestaurante.abierto ? `_⚠️ Nota: Pedido enviado en horario de cierre (${estadoRestaurante.mensaje}). Favor coordinar entrega._` : ''}

*📍 Dirección de Entrega:*
- *Dirección:* ${direccion}
- *Zona / Barrio:* ${zona}
- *Ubicación GPS (Google Maps):* https://www.google.com/maps?q=${coords.lat},${coords.lng}
- *Referencia:* ${referencia || 'Sin referencia adicional'}
${notasAdicionales ? `- *Notas:* ${notasAdicionales}` : ''}

*🍽️ Platos Solicitados:*
${itemStrings.length > 0 ? itemStrings.join('\n') : '_Sin platos seleccionados_'}

${totalEstimado > 0 ? `*💰 Total Estimado:* Bs. ${totalEstimado.toFixed(0)} _(más costo de envío según zona)_` : ''}

*💳 Pago Completo enviado:* Bs. ${deposito.toFixed(0)} vía Tigo Money al +591 78418801
${imagenPago ? '✅ Comprobante de pago adjunto en esta conversación' : '⏳ Favor enviar comprobante de pago para comenzar a preparar el pedido'}

¡Muchas gracias! Esperamos su confirmación.`
    } else {
      const fechaText = fecha ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' }) : ''
      mensaje = `*🪴 RESERVA DE MESA — El Jardín Tradición K'ochala*

*👤 Detalles de la Reserva:*
- *Nombre:* ${nombre}
- *Personas:* ${personas} personas
- *Fecha:* ${fechaText}
- *Hora de Llegada:* ${hora} hs
${telefono ? `- *Teléfono:* ${telefono}` : ''}

${itemStrings.length > 0 ? `*🍽️ Pedido Anticipado:*
${itemStrings.join('\n')}

*💰 Total Estimado:* Bs. ${totalEstimado.toFixed(0)}` : '_Sin pedido previo (ordenaremos en mesa)_'}

*💳 Pago Anticipado enviado:* Bs. ${deposito.toFixed(0)} vía Tigo Money al +591 78418801
${imagenPago ? '✅ Comprobante de pago adjunto en esta conversación' : '⏳ Favor enviar comprobante de pago para confirmar la reserva de mesa'}

¡Muchas gracias! Nos vemos en El Jardín. 🌿`
    }

    resetFormulario()

    const url = `https://wa.me/59178418801?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
    onVolver()
  }

  const irSiguientePaso = () => {
    if (paso === 1) {
      if (!nombre.trim()) { alert('Por favor ingresa tu nombre completo.'); return }
      if (tipoEntrega === 'local') {
        if (!fecha) { alert('Por favor selecciona la fecha de reserva.'); return }
        if (!hora) { alert('Por favor selecciona la hora de llegada.'); return }
      }
      if (tipoEntrega === 'delivery') {
        if (!direccion.trim()) { alert('Por favor ingresa la dirección de entrega.'); return }
        if (!zona) { alert('Por favor selecciona tu zona o barrio.'); return }
      }
    } else if (paso === 2) {
      if (tipoEntrega === 'delivery' && itemsSeleccionados.length === 0) {
        alert('Por favor agrega al menos un plato a tu pedido de delivery.');
        return
      }
    }
    setPaso(paso + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const irPasoAnterior = () => {
    setPaso(paso - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="pedidos-layout">
      {/* HEADER CON PROGRESO POR PASOS */}
      <header className="pedidos-header">
        <div className="pedidos-header-inner">
          <div className="pedidos-header-top-row">
            <button className="pedidos-back-btn" onClick={paso > 1 ? irPasoAnterior : onVolver}>
              ← {paso > 1 ? 'Atrás' : 'Volver al Inicio'}
            </button>
            
            <div className="pedidos-brand">
              <img src="/logo-el-jardin.jpg" alt="El Jardín" style={{ borderRadius: '50%', objectFit: 'cover' }} />
              <h2>El Jardín</h2>
            </div>

            {/* Acceso rápido a canasta si hay platos */}
            {paso === 2 && totalCantidad > 0 && (
              <button
                type="button"
                onClick={() => setMostrarModalCanasta(true)}
                className="pedidos-cart-quick-btn"
                style={{
                  background: 'rgba(200, 144, 58, 0.2)',
                  border: '1px solid var(--gold)',
                  color: 'var(--gold-light)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <ShoppingBag size={14} />
                <span>{totalCantidad}</span>
              </button>
            )}
          </div>

          {/* Stepper horizontal */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '500px', margin: '8px auto 0', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%', background: paso >= 1 ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                color: paso >= 1 ? '#000' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold'
              }}>1</span>
              <span style={{ fontSize: '12px', color: paso === 1 ? 'var(--gold)' : '#888', fontWeight: paso === 1 ? 'bold' : 'normal' }}>
                {tipoEntrega === 'delivery' ? 'Datos Envío' : 'Datos Reserva'}
              </span>
            </div>
            <div style={{ flex: 1, height: '1.5px', background: paso >= 2 ? 'var(--gold)' : 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%', background: paso >= 2 ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                color: paso >= 2 ? '#000' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold'
              }}>2</span>
              <span style={{ fontSize: '12px', color: paso === 2 ? 'var(--gold)' : '#888', fontWeight: paso === 2 ? 'bold' : 'normal' }}>Menú</span>
            </div>
            <div style={{ flex: 1, height: '1.5px', background: paso >= 3 ? 'var(--gold)' : 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%', background: paso >= 3 ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
                color: paso >= 3 ? '#000' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold'
              }}>3</span>
              <span style={{ fontSize: '12px', color: paso === 3 ? 'var(--gold)' : '#888', fontWeight: paso === 3 ? 'bold' : 'normal' }}>Pago</span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL POR PASOS */}
      <main className="pedidos-container" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto', padding: '20px 16px', paddingBottom: (paso === 2 && totalCantidad > 0) ? '100px' : '30px' }}>
        
        {/* PASO 1: DATOS Y CONFIGURACIÓN DEL PEDIDO */}
        {paso === 1 && (
          <div className="pedidos-step-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-mid)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '20px' }}>
            
            {/* Banner de Estado del Restaurante (Abierto o Cerrado con Horario) */}
            {estadoRestaurante.abierto ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '12px', padding: '12px 16px', color: '#4ade80', fontSize: '12.5px'
              }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#fff' }}>🟢 Cocina Abierta Ahora:</strong> Recibiendo pedidos en vivo ({estadoRestaurante.mensaje}).
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '12px', padding: '14px 16px', color: '#fca5a5', fontSize: '12.5px'
              }}>
                <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#fff', fontSize: '13.5px' }}>Restaurante Actualmente Cerrado</strong>
                  <p style={{ margin: '4px 0 0', color: '#fca5a5', fontSize: '12px', lineHeight: 1.4 }}>
                    {estadoRestaurante.mensaje}
                  </p>
                  <p style={{ margin: '4px 0 0', color: '#fcd34d', fontSize: '11.5px', fontStyle: 'italic' }}>
                    Puedes enviar tu pedido ahora para asegurar tus platos y coordinar la entrega en cuanto abramos.
                  </p>
                </div>
              </div>
            )}

            {/* Selector de Modalidad */}
            <div>
              <label className="booking-label" style={{ marginBottom: '8px', display: 'block' }}>¿Cómo deseas disfrutar tu pedido?</label>
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  type="button"
                  onClick={() => setTipoEntrega('delivery')}
                  style={{
                    flex: 1, border: 'none', background: tipoEntrega === 'delivery' ? 'var(--gold)' : 'transparent',
                    color: tipoEntrega === 'delivery' ? '#000' : 'var(--text-secondary)', padding: '12px',
                    fontSize: '13.5px', fontWeight: 'bold', borderRadius: '9px', cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  🛵 Envío a Domicilio
                </button>
                <button
                  type="button"
                  onClick={() => setTipoEntrega('local')}
                  style={{
                    flex: 1, border: 'none', background: tipoEntrega === 'local' ? 'var(--gold)' : 'transparent',
                    color: tipoEntrega === 'local' ? '#000' : 'var(--text-secondary)', padding: '12px',
                    fontSize: '13.5px', fontWeight: 'bold', borderRadius: '9px', cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  🪴 Mesa en Local
                </button>
              </div>
            </div>

            {/* CAMPOS PARA DELIVERY A DOMICILIO (Sin Fecha, Sin Hora, Sin Personas) */}
            {tipoEntrega === 'delivery' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="booking-label">Tu Nombre Completo <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="booking-input"
                  />
                </div>

                <div>
                  <label className="booking-label">Teléfono / WhatsApp de Contacto</label>
                  <input
                    type="tel"
                    placeholder="Ej: 78418801 (para avisarte al llegar)"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    className="booking-input"
                  />
                </div>

                {/* Mapa y Geolocalización GPS */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="booking-label" style={{ margin: 0 }}>
                      📍 Ubicación GPS de Entrega <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                  </div>

                  {/* Botones de acción GPS y Google Maps */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <button
                      type="button"
                      onClick={obtenerUbicacionActual}
                      disabled={obteniendoGps}
                      style={{
                        padding: '11px 12px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(200, 144, 58, 0.25), rgba(74, 124, 63, 0.35))',
                        border: '1.5px solid var(--gold)',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Navigation size={15} color="var(--gold-light)" />
                      {obteniendoGps ? 'Detectando GPS...' : '📍 Mi Ubicación GPS'}
                    </button>

                    <button
                      type="button"
                      onClick={abrirEnGoogleMaps}
                      style={{
                        padding: '11px 12px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ddd',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      🗺️ Abrir Google Maps
                    </button>
                  </div>

                  {/* Mapa Interactivo de Leaflet */}
                  <div
                    id="map-selection"
                    style={{
                      height: '220px',
                      width: '100%',
                      borderRadius: '14px',
                      background: 'rgba(0,0,0,0.4)',
                      overflow: 'hidden',
                      border: '1px solid rgba(200, 144, 58, 0.3)'
                    }}
                  />
                  <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: '#a8b89a', lineHeight: 1.4 }}>
                    👆 Pulsa <strong>"Mi Ubicación GPS"</strong> para marcar tu casa al instante o arrastra el marcador rojo al punto exacto.
                  </p>
                </div>

                <div>
                  <label className="booking-label">Dirección Completa (Calle y Nº) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="Ej: Calle Colombia #450, entre Baptista y Ayacucho"
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    className="booking-input"
                  />
                </div>

                <div>
                  <label className="booking-label">Zona / Barrio en Cochabamba <span style={{ color: '#ef4444' }}>*</span></label>
                  <select
                    value={zona}
                    onChange={e => setZona(e.target.value)}
                    className="booking-input"
                    style={{ appearance: 'auto' }}
                  >
                    <option value="">-- Selecciona tu zona --</option>
                    {ZONAS_COCHABAMBA.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>

                <div>
                  <label className="booking-label">Referencia del lugar (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: Portón negro con rejas, frente a la farmacia..."
                    value={referencia}
                    onChange={e => setReferencia(e.target.value)}
                    className="booking-input"
                  />
                </div>

                <div>
                  <label className="booking-label">Notas para la cocina o repartidor (opcional)</label>
                  <textarea
                    placeholder="Ej: Enviar cubiertos, salsa de llajwa extra, tocar timbre..."
                    value={notasAdicionales}
                    onChange={e => setNotasAdicionales(e.target.value)}
                    rows={2}
                    className="booking-input"
                    style={{ resize: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
            ) : (
              /* CAMPOS PARA RESERVA DE MESA EN LOCAL */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="booking-label">Tu Nombre Completo <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="Ej: María González"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="booking-input"
                  />
                </div>

                <div>
                  <label className="booking-label">Teléfono / WhatsApp de Contacto</label>
                  <input
                    type="tel"
                    placeholder="Ej: 78418801"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    className="booking-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="booking-label">Nº de Personas <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={personas}
                      onChange={e => setPersonas(parseInt(e.target.value) || 1)}
                      className="booking-input"
                    />
                  </div>
                  <div>
                    <label className="booking-label">Hora de Llegada <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="time"
                      value={hora}
                      onChange={e => setHora(e.target.value)}
                      className="booking-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="booking-label">Fecha de Reserva <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={handleFechaChange}
                    className="booking-input"
                  />
                  {alertaFecha && (
                    <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#f59e0b', fontWeight: 500, lineHeight: 1.4 }}>
                      {alertaFecha}
                    </p>
                  )}
                </div>

                <div>
                  <label className="booking-label">Notas Especiales (opcional)</label>
                  <textarea
                    placeholder="Ej: Mesa cerca del escenario, celebración de cumpleaños..."
                    value={notasAdicionales}
                    onChange={e => setNotasAdicionales(e.target.value)}
                    rows={2}
                    className="booking-input"
                    style={{ resize: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={irSiguientePaso}
              className="btn btn-gold"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                marginTop: '10px',
                boxShadow: '0 4px 16px rgba(200, 144, 58, 0.3)'
              }}
            >
              Continuar a la Selección de Platos ➔
            </button>
          </div>
        )}

        {/* PASO 2: SELECCIÓN DE PLATOS (MENÚ INTERACTIVO) */}
        {paso === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Header informativo del Paso 2 */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--bg-mid)', padding: '12px 16px', borderRadius: '14px',
              border: '1px solid var(--border-light)'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#888' }}>
                  {tipoEntrega === 'delivery' ? '🛵 Envío a domicilio para:' : '🪴 Reserva de mesa para:'}
                </span>
                <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--gold)' }}>
                  {nombre || 'Cliente'} {tipoEntrega === 'delivery' ? `(${zona || 'Delivery'})` : `(${personas} pers.)`}
                </h4>
              </div>
              <button
                type="button"
                onClick={irPasoAnterior}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#ccc',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '11.5px',
                  cursor: 'pointer'
                }}
              >
                ✏️ Editar Datos
              </button>
            </div>

            {/* Explorador de Platos */}
            <section className="pedidos-browser">
              {/* Barra de Búsqueda */}
              <div className="pedidos-search-bar">
                <Search className="pedidos-search-icon" size={18} />
                <input
                  type="text"
                  placeholder="Buscar plato por nombre o ingrediente..."
                  value={buscarPlato}
                  onChange={e => setBuscarPlato(e.target.value)}
                  className="pedidos-search-input"
                />
                {buscarPlato && (
                  <button
                    type="button"
                    onClick={() => setBuscarPlato('')}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                      width: '20px', height: '20px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Categorías con Scroll Horizontal Fluido */}
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

              {/* Grilla de Platos Responsiva Móvil */}
              <div className="pedidos-dishes-grid">
                {itemsFiltrados.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#888', fontSize: '14px', background: 'var(--bg-mid)', borderRadius: '14px' }}>
                    No se encontraron platos con "{buscarPlato}".
                  </div>
                ) : (
                  itemsFiltrados.map((item) => {
                    const imageSrc = item.imagenResuelta || resolverImagenPlato(item, menuItems)
                    const formattedPrice = typeof item.precio_actual === 'number'
                      ? `Bs. ${item.precio_actual}`
                      : (item.precio ? `Bs. ${item.precio}` : 'Consultar')
                    const cant = pedido[item.id] || 0

                    return (
                      <div className="pedidos-dish-card" key={item.id}>
                        {imageSrc && (
                          <div
                            className="pedidos-dish-img-container"
                            onClick={() => setImagenPreview({ src: imageSrc, nombre: item.nombre, desc: item.descripcion, precio: item.precio_actual })}
                            title="Tocar para ver foto en grande"
                          >
                            <img src={imageSrc} alt={item.nombre} loading="lazy" decoding="async" />
                          </div>
                        )}
                        <div className="pedidos-dish-info">
                          <div className="pedidos-dish-details">
                            <h4
                              className="pedidos-dish-name"
                              onClick={() => imageSrc && setImagenPreview({ src: imageSrc, nombre: item.nombre, desc: item.descripcion, precio: item.precio_actual })}
                            >
                              {item.nombre}
                            </h4>
                            <p className="pedidos-dish-desc">{item.descripcion || 'Especialidad tradicional de la casa.'}</p>
                          </div>
                          
                          <div className="pedidos-dish-action">
                            <span className="pedidos-dish-price">{formattedPrice}</span>
                            {cant > 0 ? (
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: 'rgba(0,0,0,0.5)', padding: '3px 6px',
                                borderRadius: '8px', border: '1px solid rgba(200, 144, 58, 0.4)'
                              }}>
                                <button
                                  type="button"
                                  onClick={() => decrementar(item.id)}
                                  className="qty-btn"
                                  aria-label="Restar uno"
                                >
                                  −
                                </button>
                                <span style={{ minWidth: '18px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: 'var(--gold)' }}>
                                  {cant}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => incrementar(item.id)}
                                  className="qty-btn"
                                  aria-label="Sumar uno"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => incrementar(item.id)}
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
            </section>

            {/* Botones inferiores estándar al final del menú */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={irPasoAnterior}
                className="btn"
                style={{ flex: 1, padding: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', fontSize: '13px' }}
              >
                ← Volver a Datos
              </button>
              <button
                type="button"
                onClick={irSiguientePaso}
                className="btn btn-gold"
                style={{ flex: 2, padding: '13px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13.5px' }}
              >
                Confirmar y Pagar (Bs. {totalEstimado.toFixed(0)}) ➔
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: RECAPITULACIÓN Y PAGO (QR) */}
        {paso === 3 && (
          <div className="pedidos-step-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-mid)', border: '1px solid var(--border-light)', borderRadius: '18px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: 'var(--gold)', fontFamily: 'Playfair Display, serif' }}>
              💳 Resumen y Confirmación de Pago
            </h3>

            {/* Recapitulación de Datos de Entrega o Reserva */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--gold)', fontWeight: 'bold' }}>
                {tipoEntrega === 'delivery' ? '🛵 Datos para el Repartidor:' : '👤 Datos de la Reserva:'}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px', lineHeight: 1.4 }}>
                <span style={{ color: '#888' }}>Cliente:</span><span style={{ fontWeight: 'bold' }}>{nombre}</span>
                {telefono && (<><span style={{ color: '#888' }}>Teléfono:</span><span>{telefono}</span></>)}
                
                {tipoEntrega === 'delivery' ? (
                  <>
                    <span style={{ color: '#888' }}>Dirección:</span><span>{direccion}</span>
                    <span style={{ color: '#888' }}>Zona / Barrio:</span><span>{zona}</span>
                    <span style={{ color: '#888' }}>Ubicación GPS:</span>
                    <span>
                      <a href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`} target="_blank" rel="noreferrer" style={{ color: 'var(--gold-light)', textDecoration: 'underline' }}>
                        Ver punto en Google Maps ↗
                      </a>
                    </span>
                    {referencia && (<><span style={{ color: '#888' }}>Referencia:</span><span>{referencia}</span></>)}
                    {notasAdicionales && (<><span style={{ color: '#888' }}>Notas:</span><span>{notasAdicionales}</span></>)}
                  </>
                ) : (
                  <>
                    <span style={{ color: '#888' }}>Personas:</span><span>{personas} comensales</span>
                    <span style={{ color: '#888' }}>Fecha y Hora:</span>
                    <span>{fecha ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' }) : ''} a las {hora} hs</span>
                    {notasAdicionales && (<><span style={{ color: '#888' }}>Notas:</span><span>{notasAdicionales}</span></>)}
                  </>
                )}
              </div>
            </div>

            {/* Recapitulación de platos */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--gold)', fontWeight: 'bold' }}>
                  🛒 Platos seleccionados ({totalCantidad})
                </h4>
                <button
                  type="button"
                  onClick={() => setPaso(2)}
                  style={{ background: 'none', border: 'none', color: 'var(--gold-light)', fontSize: '11.5px', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Modificar
                </button>
              </div>

              {itemsSeleccionados.length === 0 ? (
                <p style={{ margin: 0, fontSize: '12.5px', color: '#888', fontStyle: 'italic' }}>No has seleccionado ningún plato en el paso anterior.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {itemsSeleccionados.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                      <span><span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{item.cantidad}×</span> {item.nombre}</span>
                      <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>Bs. {(item.precio_actual * item.cantidad).toFixed(0)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', fontWeight: 'bold', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '4px' }}>
                    <span>Total Estimado:</span>
                    <span style={{ color: 'var(--gold-light)', fontFamily: 'monospace' }}>Bs. {totalEstimado.toFixed(0)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* QR de Pago */}
            <div style={{ background: 'rgba(34,197,94,0.04)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(34,197,94,0.18)', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#22c55e', fontWeight: 'bold' }}>
                {tipoEntrega === 'delivery' ? '💳 Pago completo en su totalidad' : '💳 Pago anticipado requerido (50%)'}
              </h4>
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#aaa', lineHeight: 1.4 }}>
                Monto a transferir: <strong style={{ color: 'var(--gold-light)', fontFamily: 'monospace', fontSize: '16px' }}>Bs. {deposito.toFixed(0)}</strong>
              </p>
              
              <div style={{ background: '#fff', padding: '8px', borderRadius: '10px', display: 'inline-block', marginBottom: '10px' }}>
                <img src={qrPagoRestaurante || qrUrl} alt="QR El Jardín" width={160} height={160} style={{ display: 'block', borderRadius: '4px' }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={descargarQR}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px', padding: '6px 14px', color: 'var(--gold-light)',
                    fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  📥 Descargar QR
                </button>
              </div>

              <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#888' }}>
                Transfiere vía Tigo Money al +591 78418801 y adjunta tu comprobante.
              </p>

              {/* Subir comprobante */}
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
                  width: '100%', padding: '11px', fontSize: '12.5px', border: '1.5px dashed rgba(255,255,255,0.15)',
                  background: imagenPago ? 'rgba(34,197,94,0.12)' : 'transparent', color: imagenPago ? '#22c55e' : '#ccc',
                  borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500'
                }}
              >
                {procesandoImagen ? '⏳ Procesando...' : imagenPago ? '✅ Comprobante Adjunto (Clic para cambiar)' : '📸 Subir Comprobante de Pago'}
              </button>
            </div>

            {/* Botones de acción del paso 3 */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={irPasoAnterior}
                className="btn"
                style={{ flex: 1, padding: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px', fontSize: '13px' }}
              >
                ← Volver al Menú
              </button>
              <button
                type="button"
                onClick={enviarWhatsApp}
                className="btn btn-gold"
                style={{ flex: 2, padding: '13px', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '13px' }}
              >
                Pedir por WhatsApp ➔
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ── BARRA FLOTANTE FIJA INFERIOR (Sticky Bottom Cart Bar) EN EL PASO 2 ── */}
      {paso === 2 && totalCantidad > 0 && (
        <div className="pedidos-sticky-cart-bar">
          <div
            className="pedidos-sticky-cart-info"
            onClick={() => setMostrarModalCanasta(true)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'rgba(200, 144, 58, 0.2)', border: '1px solid var(--gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-light)'
              }}>
                <ShoppingBag size={18} />
              </div>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{totalCantidad} platos</span>
                  <span style={{ fontSize: '11px', color: 'var(--gold-light)' }}>▲ Ver</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--gold-light)', fontFamily: 'monospace' }}>
                  Bs. {totalEstimado.toFixed(0)}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-gold pedidos-sticky-confirm-btn"
            onClick={irSiguientePaso}
          >
            Confirmar y Pagar ➔
          </button>
        </div>
      )}

      {/* ── DRAWER / MODAL DE CANASTA INTERACTIVA ── */}
      {mostrarModalCanasta && (
        <div
          className="cart-drawer-backdrop"
          onClick={() => setMostrarModalCanasta(false)}
        >
          <div
            className="cart-drawer-content"
            onClick={e => e.stopPropagation()}
          >
            {/* Header Drawer */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} color="var(--gold-light)" />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 'bold' }}>
                  Tu Pedido ({totalCantidad} {totalCantidad === 1 ? 'plato' : 'platos'})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalCanasta(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
                  width: '28px', height: '28px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Lista de Platos en Canasta */}
            <div style={{ padding: '16px 20px', maxHeight: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {itemsSeleccionados.map((item) => {
                const img = item.imagenResuelta || resolverImagenPlato(item, menuItems)
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                      background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    {img && (
                      <img
                        src={img}
                        alt={item.nombre}
                        style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.nombre}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--gold-light)', fontFamily: 'monospace' }}>
                        Bs. {(item.precio_actual * item.cantidad).toFixed(0)} <span style={{ color: '#777', fontSize: '10.5px' }}>(Bs. {item.precio_actual} c/u)</span>
                      </div>
                    </div>

                    {/* Controles + / - / eliminar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => decrementar(item.id)}
                        className="qty-btn"
                        style={{ width: '26px', height: '26px' }}
                      >
                        −
                      </button>
                      <span style={{ minWidth: '16px', textAlign: 'center', fontSize: '12.5px', fontWeight: 'bold', color: 'var(--gold)' }}>
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => incrementar(item.id)}
                        className="qty-btn"
                        style={{ width: '26px', height: '26px' }}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarPlato(item.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444',
                          width: '26px', height: '26px', borderRadius: '6px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '4px'
                        }}
                        title="Eliminar plato"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer Drawer con Total y Botón de Pago */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', color: '#888' }}>Total de tu orden:</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--gold-light)', fontFamily: 'monospace' }}>
                  Bs. {totalEstimado.toFixed(0)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setMostrarModalCanasta(false)}
                  style={{
                    flex: 1, padding: '12px', background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)', color: '#ccc', borderRadius: '10px',
                    fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  Seguir agregando
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalCanasta(false)
                    irSiguientePaso()
                  }}
                  className="btn btn-gold"
                  style={{ flex: 2, padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px' }}
                >
                  Continuar al Pago ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <span style={{ fontSize: '16px', color: '#f59e0b', fontWeight: 'bold' }}>Bs. {Number(imagenPreview.precio).toFixed(0)}</span>
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
  const [telefono, setTelefono] = useState('')
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
  const [modalInstalacionAbierto, setModalInstalacionAbierto] = useState(false)

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
    setTelefono('')
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
    if (nombre || Object.keys(pedido).length > 0 || direccion || telefono) {
      const datos = {
        nombre, telefono, personas, fecha, hora, tipoEntrega, direccion, zona, referencia, notasAdicionales, pedido, coords
      }
      localStorage.setItem('jardin_reserva_temporal', JSON.stringify(datos))
    }
  }, [nombre, telefono, personas, fecha, hora, tipoEntrega, direccion, zona, referencia, notasAdicionales, pedido, coords])

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

  // Cargar PROMOCIONES desde Supabase / API
  useEffect(() => {
    let activo = true
    cargarPromocionesDesdeSupabase().then(data => {
      if (activo && Array.isArray(data) && data.length > 0) {
        setPromosAPI(data)
      }
      setLoadingPromos(false)
    }).catch(() => {
      if (activo) setLoadingPromos(false)
    })
    return () => { activo = false }
  }, [])

  // Cargar CONFIGURACIÓN WEB (Hero Slides, Galería y QR) desde Supabase / API
  useEffect(() => {
    let activo = true
    cargarWebConfigDesdeSupabase().then(data => {
      if (!activo || !data) return
      if (data.hero_slides && Array.isArray(data.hero_slides) && data.hero_slides.length > 0) {
        setHeroSlides(data.hero_slides)
      }
      if (data.galeria_mosaico && Array.isArray(data.galeria_mosaico) && data.galeria_mosaico.length > 0) {
        setGaleriaItems(data.galeria_mosaico)
      }
      if (data.qr_pago && data.qr_pago.imagen) {
        setQrPago(data.qr_pago.imagen)
      }
    }).catch(console.warn)
    return () => { activo = false }
  }, [])

  // Cargar ELEMENTOS DEL MENÚ en tiempo real desde Supabase (actualizados por el restaurante)
  useEffect(() => {
    let activo = true

    const procesarItemsMenu = (data) => {
      if (!Array.isArray(data) || data.length === 0) return
      setMenuItemsFlat(data)

      const disponibles = data.filter(item => item.disponible !== false)
      const nuevoMenu = {
        principales: [],
        caldos: [],
        refrescos: [],
        cervezas: []
      }

      disponibles.forEach(item => {
        const cat = clasificarCategoriaPlato(item.categoria)
        const img = resolverImagenPlato(item, data)
        nuevoMenu[cat].push({
          ...item,
          imagenResuelta: img
        })
      })

      setMenu(nuevoMenu)
    }

    // Inicializar de inmediato con el catálogo de 43 platos de respaldo
    procesarItemsMenu(FALLBACK_MENU_ITEMS)

    // Sincronizar en vivo con Supabase / API
    cargarMenuDesdeSupabase().then(data => {
      if (activo && Array.isArray(data) && data.length > 0) {
        procesarItemsMenu(data)
      }
    }).catch(console.warn)

    return () => { activo = false }
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
        telefono={telefono}
        setTelefono={setTelefono}
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
      <FloatingNavbar onOpenInstalacion={() => setModalInstalacionAbierto(true)} />
      <HeroGallery 
        slides={heroSlides} 
        onOpenReserva={() => { setPrefillReserva(null); setVistaActiva('pedidos'); }} 
        onOpenInstalacion={() => setModalInstalacionAbierto(true)}
      />
      <GaleriaMosaico items={itemsProcesados} />
      <NuestraCarta menu={menu} pedido={pedido} setPedido={setPedido} />
      <AvisosDestacados promosList={promosAPI} loading={loadingPromos} />
      <UbicacionContacto onOpenReserva={() => { setPrefillReserva(null); setVistaActiva('pedidos'); }} />
      <Footer 
        onOpenReserva={() => { setPrefillReserva(null); setVistaActiva('pedidos'); }}
        onOpenInstalacion={() => setModalInstalacionAbierto(true)}
      />
      <ModalInstalacionApp 
        isOpen={modalInstalacionAbierto} 
        onClose={() => setModalInstalacionAbierto(false)} 
      />
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
