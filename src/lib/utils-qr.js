import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Genera un Data URL en formato base64 PNG para un texto o URL de pedido
 * @param {string} texto - URL de seguimiento o ID único del pedido
 * @returns {Promise<string>} Data URL del código QR generado
 */
export async function generarQRDataURL(texto) {
  if (!texto) return '';
  try {
    return await QRCode.toDataURL(texto, {
      width: 340,
      margin: 2,
      color: {
        dark: '#0f1710',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.error('Error generando código QR:', err);
    return '';
  }
}

/**
 * Descarga una imagen (Data URL, ruta local o URL remota) como archivo,
 * SIN abrir una pestaña nueva.
 *
 * El atributo `download` es ignorado por los navegadores cuando el href es de
 * otro dominio (Cloudinary, api.qrserver.com...), y en ese caso abren la imagen
 * en otra pestaña. Para evitarlo convertimos siempre la imagen a Blob y
 * descargamos un object URL del mismo origen.
 *
 * @param {string} src - Data URL, ruta local o URL remota de la imagen
 * @param {string} nombreArchivo - Nombre deseado para el archivo descargado
 * @returns {Promise<boolean>} true si la descarga se disparó correctamente
 */
export async function descargarQR(src, nombreArchivo = 'QR-Pedido-ElJardin.png') {
  if (!src) return false;

  const dispararDescarga = (href) => {
    const link = document.createElement('a');
    link.href = href;
    link.download = nombreArchivo;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const descargarBlob = (blob) => {
    const objectUrl = URL.createObjectURL(blob);
    dispararDescarga(objectUrl);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
  };

  // 1. Data URL → Blob directo (sin red)
  if (src.startsWith('data:')) {
    try {
      const blob = await (await fetch(src)).blob();
      descargarBlob(blob);
    } catch {
      dispararDescarga(src);
    }
    return true;
  }

  // 2. URL remota o local → fetch a Blob
  try {
    const res = await fetch(src, { mode: 'cors', cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    descargarBlob(await res.blob());
    return true;
  } catch (err) {
    console.warn('Fetch directo del QR falló, intentando vía canvas:', err);
  }

  // 3. Fallback: dibujar en canvas (requiere CORS habilitado en la imagen)
  try {
    const blob = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas vacío'))), 'image/png');
      };
      img.onerror = reject;
      img.src = src;
    });
    descargarBlob(blob);
    return true;
  } catch (err) {
    console.warn('Fallback canvas falló:', err);
  }

  // 4. Último recurso para Cloudinary: forzar cabecera de descarga (attachment)
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    dispararDescarga(src.replace('/upload/', '/upload/fl_attachment/'));
    return true;
  }

  alert('No se pudo descargar el QR automáticamente. Mantén presionada la imagen y elige "Guardar imagen".');
  return false;
}

/**
 * Extrae el código o UUID de pedido a partir de un texto o URL decodificada del QR
 * @param {string} texto - Texto o URL decodificada (ej. https://.../?rastrear=DEL-101)
 * @returns {string} Código de pedido limpio
 */
export function extraerIdPedidoDeTexto(texto) {
  if (!texto) return '';
  const limpio = String(texto).trim();

  // Si es una URL completa
  if (limpio.startsWith('http://') || limpio.startsWith('https://')) {
    try {
      const url = new URL(limpio);
      const paramRastrear = url.searchParams.get('rastrear') || url.searchParams.get('pedido') || url.searchParams.get('id');
      if (paramRastrear) {
        return paramRastrear.trim().replace(/^#/, '');
      }
    } catch {
      // Ignorar error de parsing de URL
    }
  }

  // Si viene con prefijo # o directo
  return limpio.replace(/^#/, '').trim();
}

/**
 * Decodifica un código QR a partir de un archivo de imagen (File object de input file)
 * @param {File} archivo - Archivo de imagen seleccionado por el usuario
 * @param {string} contenedorId - ID del elemento DOM donde Html5Qrcode puede inicializarse temporalmente
 * @returns {Promise<string>} Texto decodificado del código QR
 */
export async function escanearImagenQR(archivo, contenedorId = 'qr-file-scanner-temp') {
  if (!archivo) throw new Error('No se ha proporcionado ningún archivo');

  // Asegurar que el contenedor DOM exista
  let container = document.getElementById(contenedorId);
  if (!container) {
    container = document.createElement('div');
    container.id = contenedorId;
    container.style.display = 'none';
    document.body.appendChild(container);
  }

  const html5QrCode = new Html5Qrcode(contenedorId);
  try {
    const decodedText = await html5QrCode.scanFile(archivo, true);
    return extraerIdPedidoDeTexto(decodedText);
  } catch (err) {
    console.warn('No se detectó QR en la imagen:', err);
    throw new Error('No pudimos detectar ningún código QR en la imagen seleccionada. Por favor asegúrate de que la foto sea clara o tómale otra captura.');
  } finally {
    try {
      html5QrCode.clear();
    } catch {
      // Ignorar error al limpiar
    }
  }
}
