import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('El Jardín ErrorBoundary atrapó un error:', error, errorInfo)
  }

  handleReload = () => {
    try {
      localStorage.removeItem('jardin_reserva_temporal')
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((k) => caches.delete(k))
        })
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          for (let reg of regs) reg.unregister()
        })
      }
    } catch (_) {}
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0a0f07',
          color: '#ede8dc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '440px',
            background: 'rgba(255,255,255,0.04)',
            border: '1.5px solid rgba(200, 144, 58, 0.4)',
            borderRadius: '20px',
            padding: '32px 24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <img 
              src="/logo-el-jardin.jpg" 
              alt="El Jardín" 
              style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 16px', border: '2px solid #c8903a' }} 
            />
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
              El Jardín — Tradición K'ochala
            </h2>
            <p style={{ fontSize: '13px', color: '#a8b89a', lineHeight: 1.5, marginBottom: '24px' }}>
              La aplicación se ha actualizado. Presiona el botón para recargar la versión más reciente.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #c8903a 0%, #e8af60 100%)',
                color: '#080d06',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(200, 144, 58, 0.4)'
              }}
            >
              Recargar Restaurante ↻
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
