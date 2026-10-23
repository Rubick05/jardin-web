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
 * Descarga una imagen Data URL como archivo PNG en el navegador
 * @param {string} dataUrl - URL base64 de la imagen
 * @param {string} nombreArchivo - Nombre deseado para el archivo descargado
 */
export function descargarQR(dataUrl, nombreArchivo = 'QR-Pedido-ElJardin.png') {
  if (!dataUrl) return;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
