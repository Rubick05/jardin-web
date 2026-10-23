/**
 * api-menu.js
 * 
 * Conexión directa y resiliente con la base de datos de Supabase (y fallback al backend)
 * para sincronizar en tiempo real el menú, precios vigentes e imágenes cargadas
 * desde el panel de administración de "El Jardín".
 */

export const SUPABASE_URL = 'https://ucnobrafrlvwdzonbhlc.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjbm9icmFmcmx2d2R6b25iaGxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDYyNDUsImV4cCI6MjA5NzM4MjI0NX0.-rYM2aTmDV3ohzUUg8uI4OSmoetFGJy4wEw_yrnSe04';

export const API_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
  ? import.meta.env.VITE_API_URL.replace('/api', '').replace(/\/$/, '')
  : 'https://restaurante-pelusa.vercel.app';

// ─── Optimizador Universal de Imágenes (Cloudinary WebP + Auto-Format) ─────────
export function optimizarUrlImagen(url, width = 800) {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('data:') || (url.startsWith('/') && !url.startsWith('//'))) return url;

  // Si es Cloudinary, inyectar transformaciones automáticas f_auto, q_auto y resize
  if (url.includes('cloudinary.com') && url.includes('/image/upload/')) {
    if (!url.includes('f_auto') && !url.includes('q_auto')) {
      return url.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width},c_limit/`);
    }
  }

  return url;
}

// ─── Asignación Inteligente de Imágenes a Platos ───────────────────────────────
export function resolverImagenPlato(item, todosLosItems = []) {
  if (item.url_imagen && item.url_imagen.trim()) return optimizarUrlImagen(item.url_imagen, 800);
  if (item.imagen_base64 && item.imagen_base64.trim()) return item.imagen_base64;

  const nombreMin = (item.nombre || '').toLowerCase();
  const nombreBase = nombreMin.replace(/\(.*?\)/g, '').replace(/chillami/g, '').trim();

  // 1. Buscar si hay una variante hermana del mismo plato con imagen en la base de datos
  // (Ej: Charque Medio hereda de Charque Entero; Pique Entero hereda de Pique Media)
  if (Array.isArray(todosLosItems) && todosLosItems.length > 0) {
    const hermanoConFoto = todosLosItems.find(otro => 
      otro.id !== item.id && 
      (otro.url_imagen || otro.imagen_base64) && 
      otro.nombre.toLowerCase().includes(nombreBase)
    );
    if (hermanoConFoto) {
      return optimizarUrlImagen(hermanoConFoto.url_imagen || hermanoConFoto.imagen_base64, 800);
    }
  }

  // 2. Mapeo a fotografías oficiales del restaurante almacenadas localmente
  if (nombreMin.includes('lambreado')) return '/lambreado.jpg';
  if (nombreMin.includes('pampaku')) return '/pampaku.jpg';
  if (nombreMin.includes('charque')) return '/charque.jpg';
  if (nombreMin.includes('uchu') || nombreMin.includes('fideo')) return '/hero-el-jardin.jpg';
  if (nombreMin.includes('planchita')) return '/hero-bg.jpg';
  if (nombreMin.includes('pato')) return '/pampaku.jpg';
  if (nombreMin.includes('lapping')) return '/charque.jpg';

  return null;
}

// ─── 4 Categorías Oficiales de la Carta ────────────────────────────────────────
export const CATEGORIAS_CARTA = [
  { id: 'principales', nombre: 'Platos Tradicionales', icon: '🍲' },
  { id: 'caldos', nombre: 'Caldos y Sopas', icon: '🥣' },
  { id: 'refrescos', nombre: 'Refrescos Caseros', icon: '🥤' },
  { id: 'cervezas', nombre: 'Cervezas & Tradición', icon: '🍻' }
];

export function clasificarCategoriaPlato(categoriaRaw) {
  const cat = (categoriaRaw || '').toLowerCase().trim();
  if (cat === 'cervezas' || cat.includes('cerveza') || cat.includes('chicha') || cat.includes('garapiña') || cat.includes('guarapo') || cat.includes('combo')) {
    return 'cervezas';
  }
  if (cat === 'refrescos' || cat.includes('refresco') || cat.includes('jugo') || cat.includes('agua') || cat.includes('gaseosa') || cat.includes('coca') || cat.includes('fanta')) {
    return 'refrescos';
  }
  if (cat === 'caldos' || cat.includes('caldo') || cat.includes('sopa') || cat.includes('kawi') || cat.includes('paila')) {
    return 'caldos';
  }
  return 'principales'; // Por defecto Platos Fuertes
}

// ─── Consulta del Menú en Tiempo Real (Supabase REST API) ───────────────────────
export async function cargarMenuDesdeSupabase() {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`
  };

  // 1. Intentar directamente desde Supabase REST
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/elementos_menu?select=*&order=categoria.asc,nombre.asc`, {
      headers,
      signal: AbortSignal.timeout(6000)
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        try {
          localStorage.setItem('el_jardin_menu_cache', JSON.stringify({
            fecha: Date.now(),
            items: data
          }));
        } catch { /* storage quota */ }
        return data;
      }
    }
  } catch (err) {
    console.warn('Fallo Supabase directo, intentando endpoint alternativo:', err.message);
  }

  // 2. Intentar fallback a API de la app
  try {
    const res = await fetch(`${API_URL}/api/menu`, {
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Fallo endpoint de respaldo:', err.message);
  }

  // 3. Intentar caché de localStorage
  try {
    const cached = localStorage.getItem('el_jardin_menu_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        return parsed.items;
      }
    }
  } catch { /* parse error */ }

  // 4. Retornar los 43 platos oficiales de respaldo
  return FALLBACK_MENU_ITEMS;
}

// ─── Consulta de Promociones desde Supabase ────────────────────────────────────
export async function cargarPromocionesDesdeSupabase() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/promociones?select=*&order=orden.asc`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch { /* fallback */ }

  return null;
}

// ─── Consulta de Web Config (Hero Slides y Galería Mosaico) ────────────────────
export async function cargarWebConfigDesdeSupabase() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/web_config?select=*`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const config = {};
        data.forEach(fila => {
          if (fila.clave) config[fila.clave] = fila.valor;
        });
        return config;
      }
    }
  } catch { /* fallback */ }

  return null;
}

// ─── Respaldo Completo con los 43 Platos Reales de Supabase ────────────────────
export const FALLBACK_MENU_ITEMS = [
  // PLATOS FUERTES TRADICIONALES
  {
    id: "f80d99b5-c113-4fbe-8ec2-a9ab9385ec89",
    nombre: "Jatun Pampaku",
    categoria: "Plato Fuerte",
    precio_actual: 120,
    disponible: true,
    url_imagen: "https://res.cloudinary.com/dsm8odqo/image/upload/v1783286572/menu/kjewisnxvbgd5v4yvr3g.jpg",
    descripcion: "Especialidad de la casa: carnes mixtas tiernas cocidas bajo tierra con piedras volcánicas (DOMINGOS)."
  },
  {
    id: "a9275367-7bd2-4527-baf5-cff076cbbf99",
    nombre: "Charque (Entero)",
    categoria: "Plato Fuerte",
    precio_actual: 120,
    disponible: true,
    url_imagen: "https://res.cloudinary.com/dsm8odqo/image/upload/v1783286581/menu/qg46vznsnfzytetr1ras.jpg",
    descripcion: "Porción entera para 3 personas. Carne deshidratada crujiente con mote, huevo, papa y queso criollo."
  },
  {
    id: "054c21a0-68d0-4ec4-ab7a-0b9ace99d0a7",
    nombre: "Charque (Medio)",
    categoria: "Plato Fuerte",
    precio_actual: 80,
    disponible: true,
    url_imagen: "https://res.cloudinary.com/dsm8odqo/image/upload/v1783286581/menu/qg46vznsnfzytetr1ras.jpg",
    descripcion: "Media porción para 2 personas. Carne crujiente con mote, huevo y queso."
  },
  {
    id: "d785041e-f48c-4379-8a89-3c6a7b530dcf",
    nombre: "Pique (Entero)",
    categoria: "Plato Fuerte",
    precio_actual: 120,
    disponible: true,
    url_imagen: "https://res.cloudinary.com/dsm8odqo/image/upload/v1783286590/menu/g3wu5fliynwfrbyrvekf.jpg",
    descripcion: "Porción entera para 3 personas: carne de res tierna, salchicha, papas fritas, huevo, queso y locoto."
  },
  {
    id: "ac3c11cf-ce11-4ec9-9033-9c66ff249117",
    nombre: "Pique (Media)",
    categoria: "Plato Fuerte",
    precio_actual: 80,
    disponible: true,
    url_imagen: "https://res.cloudinary.com/dsm8odqo/image/upload/v1783286590/menu/g3wu5fliynwfrbyrvekf.jpg",
    descripcion: "Media porción para 2 personas: carne jugosa, salchichas, papas fritas y locoto fresco."
  },
  {
    id: "4bcf026d-972f-4791-a086-8260e1604d4a",
    nombre: "PIQUE A LA PLANCHA",
    categoria: "Plato Fuerte",
    precio_actual: 130,
    disponible: true,
    url_imagen: "https://res.cloudinary.com/dsm8odqo/image/upload/v1783286590/menu/g3wu5fliynwfrbyrvekf.jpg",
    descripcion: "Porción para 3 personas servido humeante en plancha caliente."
  },
  {
    id: "27fce059-6d66-4389-b4ad-7e8be91ae5d9",
    nombre: "Planchita (Entera)",
    categoria: "Plato Fuerte",
    precio_actual: 120,
    disponible: true,
    url_imagen: "/hero-bg.jpg",
    descripcion: "Porción entera tradicional con cortes de carne, chorizos, tubérculos y huevo a la plancha."
  },
  {
    id: "5af752bf-2029-402a-a77f-499d73af52c1",
    nombre: "Planchita (Media)",
    categoria: "Plato Fuerte",
    precio_actual: 80,
    disponible: true,
    url_imagen: "/hero-bg.jpg",
    descripcion: "Media porción humeante sobre plancha de hierro."
  },
  {
    id: "a38d6c02-333e-41a8-830c-c052e7cd0183",
    nombre: "FIDEOS UCHU - CHILLAMI",
    categoria: "Plato Fuerte",
    precio_actual: 120,
    disponible: true,
    url_imagen: "https://res.cloudinary.com/dsm8odqo/image/upload/v1783286397/menu/uvz8hukofxcfzgjbxhfd.png",
    descripcion: "¡Plato insigne de los Jueves! Servido en tradicional fuente chillami con ajiaco y presa dorada."
  },
  {
    id: "dc79d4d3-cfde-4957-8596-3bceccb4de5e",
    nombre: "CHAJCHU",
    categoria: "Plato Fuerte",
    precio_actual: 35,
    disponible: true,
    url_imagen: "https://res.cloudinary.com/dsm8odqo/image/upload/v1789766459/imagenes/mxwtjfldtldb2hduw2dl.heic",
    descripcion: "Carne tierna cocida con chuño, papas, huevo duro, queso criollo y ajiaco tradicional."
  },
  {
    id: "a048ad6d-b0d2-4c54-96e7-06bfec4fd38b",
    nombre: "Lambreado de Conejo",
    categoria: "Plato Fuerte",
    precio_actual: 80,
    disponible: true,
    url_imagen: "/lambreado.jpg",
    descripcion: "Conejo entero empanizado + ensalada cocida + chuño puti + arroz fideo + papa + ají aparte."
  },
  {
    id: "18d1e18f-a695-4abc-858c-248a67530653",
    nombre: "LAPPING A LA PLANCHA",
    categoria: "Plato Fuerte",
    precio_actual: 130,
    disponible: true,
    url_imagen: "/charque.jpg",
    descripcion: "Para 2 a 3 personas: carne de res marinada a la plancha + habas + papa + choclo + ensalada solterito."
  },
  {
    id: "795fd377-c906-40ec-8b96-61eb7e61bc35",
    nombre: "PATO A LA BRAZA",
    categoria: "Plato Fuerte",
    precio_actual: 120,
    disponible: true,
    url_imagen: "/pampaku.jpg",
    descripcion: "Pato jugoso dorado a las brasas servido con guarniciones tradicionales."
  },
  {
    id: "0312f7f2-82d6-4391-8f31-3d81a67a29e5",
    nombre: "ALITAS A LA BROASTER",
    categoria: "Plato Fuerte",
    precio_actual: 25,
    disponible: true,
    url_imagen: "https://res.cloudinary.com/dsm8odqo/image/upload/v1783286408/menu/wa1dlswfxtvkacp9luyb.jpg",
    descripcion: "4 piezas de alita crocantes con papas fritas, plátano frito y salsas caseras."
  },
  {
    id: "6813d39c-b35e-403a-a736-3b23e90b477c",
    nombre: "FERNET BRANCA",
    categoria: "Plato Fuerte",
    precio_actual: 280,
    disponible: true,
    url_imagen: null,
    descripcion: "Botella de Fernet Branca + refresco de 2L + hielo + limón."
  },
  {
    id: "2c974c85-20e8-4540-9806-297b8babeeed",
    nombre: "LUCHO ORO",
    categoria: "Plato Fuerte",
    precio_actual: 500,
    disponible: true,
    url_imagen: null,
    descripcion: "Botella de trago especial + refresco a elección + hielo + limón."
  },

  // CALDOS Y SOPAS
  {
    id: "7680aa25-7ac2-4de6-9241-4a745cca7f08",
    nombre: "Fideos Uchu (Personal)",
    categoria: "Caldos",
    precio_actual: 60,
    disponible: true,
    url_imagen: "https://res.cloudinary.com/dsm8odqo/image/upload/v1783286399/menu/vmzwccsf20lgst2ithal.jpg",
    descripcion: "Porción personal del auténtico Fideos Uchu de antaño con presa dorada y salsa criolla."
  },
  {
    id: "01ed7a49-2f4b-4cea-9585-c98b7163eea4",
    nombre: "LOMITO A LA PAILA",
    categoria: "Caldos",
    precio_actual: 35,
    disponible: true,
    url_imagen: "https://res.cloudinary.com/dsm8odqo/image/upload/v1783286402/menu/fafmpkaigzlfzhwo2tbx.jpg",
    descripcion: "Lomo tierno servido en caldo caliente a la paila con huevo y tostadas."
  },
  {
    id: "96ecff41-2b19-4e47-9a37-5893b4310b8b",
    nombre: "Kawi",
    categoria: "Caldos",
    precio_actual: 20,
    disponible: true,
    url_imagen: "https://res.cloudinary.com/dsm8odqo/image/upload/v1783286401/menu/jhkqj2bx3b3j51vkuom7.jpg",
    descripcion: "Caldo tradicional revitalizante con carne de pecho seleccionada."
  },

  // REFRESCOS Y BEBIDAS CASERAS
  {
    id: "52210291-5e0d-456d-a964-878971191dc9",
    nombre: "MOCOCHINCHI 3LTR",
    categoria: "Refrescos",
    precio_actual: 20,
    disponible: true,
    url_imagen: null,
    descripcion: "Cántaro de 3 litros de auténtico mocochinchi cochabambino con canela y clavo de olor."
  },
  {
    id: "e8767016-4cc6-45f8-9c57-e09917e0ca50",
    nombre: "TOSTADA 3LTR",
    categoria: "Refrescos",
    precio_actual: 20,
    disponible: true,
    url_imagen: null,
    descripcion: "Cántaro de 3 litros de refresco tradicional de cebada tostada bien fresco."
  },
  {
    id: "8c68da3f-e819-42e2-a2f9-04cdeee7f53b",
    nombre: "Coca Cola 2L",
    categoria: "Refrescos",
    precio_actual: 20,
    disponible: true,
    url_imagen: null,
    descripcion: "Botella no retornable 2 Litros."
  },
  {
    id: "1802a372-9727-4f88-899d-93144aac38e6",
    nombre: "COCA 1LTR",
    categoria: "Refrescos",
    precio_actual: 12,
    disponible: true,
    url_imagen: null,
    descripcion: "Botella de Coca Cola 1 Litro."
  },
  {
    id: "e07bf0eb-c5ec-41ec-b5d9-ca9ab432ae25",
    nombre: "Coca Cola POPULAR",
    categoria: "Refrescos",
    precio_actual: 8,
    disponible: true,
    url_imagen: null,
    descripcion: "Botella personal formato popular."
  },
  {
    id: "79fa12d1-64a7-4d4d-bd2c-01d87398b680",
    nombre: "Fanta 2LTR",
    categoria: "Refrescos",
    precio_actual: 20,
    disponible: true,
    url_imagen: null,
    descripcion: "Botella 2 Litros sabor naranja."
  },
  {
    id: "09e945ab-12e3-4bcd-9617-63e9a7770ffd",
    nombre: "FANTA DE 1 LTR",
    categoria: "Refrescos",
    precio_actual: 12,
    disponible: true,
    url_imagen: null,
    descripcion: "Botella de 1 Litro."
  },
  {
    id: "de48ede3-8aa5-4b8d-bc7b-bc695b8b6931",
    nombre: "FANTA POPULAR",
    categoria: "Refrescos",
    precio_actual: 8,
    disponible: true,
    url_imagen: null,
    descripcion: "Formato popular individual."
  },
  {
    id: "e7450853-86f0-4741-b43b-8a8825c92199",
    nombre: "Agua 2LTR",
    categoria: "Refrescos",
    precio_actual: 10,
    disponible: true,
    url_imagen: null,
    descripcion: "Botella de agua purificada 2 Litros."
  },

  // CERVEZAS, GARAPIÑA Y TRADICIÓN VALLUNA
  {
    id: "fc625821-124f-4831-99ea-eeeec8984491",
    nombre: "COMBO HUARI 5 X 1",
    categoria: "Cervezas",
    precio_actual: 140,
    disponible: true,
    url_imagen: "https://res.cloudinary.com/dsm8odqo/image/upload/v1783286405/menu/qrdde3sn5koruvyyeva5.jpg",
    descripcion: "5 botellas de Cerveza Huari 620cc bien frías para compartir."
  },
  {
    id: "6dab0b21-492e-4042-a2d4-5cf92ed43ae9",
    nombre: "COMBO PACEÑA",
    categoria: "Cervezas",
    precio_actual: 115,
    disponible: true,
    url_imagen: "https://res.cloudinary.com/dsm8odqo/image/upload/v1783286403/menu/z6da0cedc0occo1u1vkt.jpg",
    descripcion: "5 botellas de Cerveza Paceña 710cc bien heladas."
  },
  {
    id: "793c8030-8dc8-4ec9-9ee4-5eb82f56013a",
    nombre: "CERVEZA HUARI",
    categoria: "Cervezas",
    precio_actual: 30,
    disponible: true,
    url_imagen: "https://res.cloudinary.com/dsm8odqo/image/upload/v1783286406/menu/screu3mik0nllwjeyguv.jpg",
    descripcion: "Botella individual de Cerveza Huari tradicional."
  },
  {
    id: "3121466f-c968-42c8-bb19-ca3c59584f66",
    nombre: "GARAPIÑA ENTERA",
    categoria: "Cervezas",
    precio_actual: 35,
    disponible: true,
    url_imagen: null,
    descripcion: "Balde de 5 Litros de auténtica Garapiña valluna con helado de canela y coco."
  },
  {
    id: "294688ca-e2ef-4add-a3fc-4288e6163ea8",
    nombre: "GUARAPO ENTERO",
    categoria: "Cervezas",
    precio_actual: 35,
    disponible: true,
    url_imagen: null,
    descripcion: "Balde de 5 Litros de guarapo de uva artesanal."
  },
  {
    id: "f283bbf7-31bc-4b8b-9e39-974a453f069c",
    nombre: "GUARAPO MEDIO",
    categoria: "Cervezas",
    precio_actual: 25,
    disponible: true,
    url_imagen: null,
    descripcion: "Porción de 2.5 Litros de guarapo de uva."
  },
  {
    id: "f8c4178d-b2f3-4daf-9199-49ae2f41d310",
    nombre: "CHICHA ENTERA",
    categoria: "Cervezas",
    precio_actual: 25,
    disponible: true,
    url_imagen: null,
    descripcion: "Balde de 5 Litros de chicha de maíz fermentada tradicional."
  },
  {
    id: "6692f06e-c1d7-426f-8ade-d37fcf4d168a",
    nombre: "CHICHA MEDIA",
    categoria: "Cervezas",
    precio_actual: 15,
    disponible: true,
    url_imagen: null,
    descripcion: "Jarra de media porción de chicha tradicional."
  },
  {
    id: "82f1beb7-32d7-439d-8596-cf8a7b99bbd5",
    nombre: "BICERVECINA",
    categoria: "Cervezas",
    precio_actual: 25,
    disponible: true,
    url_imagen: null,
    descripcion: "Botella de Bicervecina tradicional."
  },
  {
    id: "e7a43b45-fc70-4934-ab5a-3bd733be0789",
    nombre: "BURGUESA NEGRA",
    categoria: "Cervezas",
    precio_actual: 30,
    disponible: true,
    url_imagen: null,
    descripcion: "Cerveza negra Burguesa."
  },
  {
    id: "15d46f18-24cd-4af5-ac6a-17c2fde899ba",
    nombre: "COMBO BURGUESA NEGRA",
    categoria: "Cervezas",
    precio_actual: 140,
    disponible: true,
    url_imagen: null,
    descripcion: "Combo de cervezas negras Burguesa."
  },
  {
    id: "c18fd5df-3e52-4868-96af-f417a59965ae",
    nombre: "CASA REAL NEGRO COMBO",
    categoria: "Cervezas",
    precio_actual: 250,
    disponible: true,
    url_imagen: null,
    descripcion: "Botella de Singani Casa Real Etiqueta Negra + refresco + hielo + limón."
  },
  {
    id: "9466d574-6c86-4e88-b60c-7a33e6558311",
    nombre: "CASA REAL LUCHO PLATA",
    categoria: "Cervezas",
    precio_actual: 350,
    disponible: true,
    url_imagen: null,
    descripcion: "Botella de Singani + refresco de 2L a elección + hielo + limón."
  },
  {
    id: "4c118daa-6b6a-42aa-a377-c356330c1d65",
    nombre: "BACARDI SOLERA COMBO",
    categoria: "Cervezas",
    precio_actual: 270,
    disponible: true,
    url_imagen: null,
    descripcion: "Botella de Ron Bacardí Solera + refresco de 2L + hielo + limón."
  },
  {
    id: "8c353b1b-c121-4770-ae6c-a81d0be6cb8b",
    nombre: "37 LENGUAS COMBO",
    categoria: "Cervezas",
    precio_actual: 200,
    disponible: true,
    url_imagen: null,
    descripcion: "Combo de trago tradicional 37 Lenguas con acompañamientos."
  }
];

// ─── Registro Directo de Pedidos en Tablero Cocina / Supabase ─────────────────
export async function crearPedidoOnline({
  tipoEntrega,
  nombre,
  telefono,
  direccion,
  zona,
  coords,
  referencia,
  notasAdicionales,
  personas,
  fecha,
  hora,
  itemsSeleccionados,
  totalEstimado,
  deposito,
  imagenPago
}) {
  const pedidoId = 'web-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const saldoPendiente = Math.max(0, (totalEstimado || 0) - (deposito || 0));

  const datosFacturacion = {
    origen: tipoEntrega === 'delivery' ? 'web_delivery' : 'web_reserva',
    tipo_entrega: tipoEntrega || 'local',
    cliente_nombre: (nombre || 'Cliente').trim(),
    cliente_telefono: (telefono || '').trim(),
    direccion: tipoEntrega === 'delivery' ? (direccion || '').trim() : 'Consumo en Salón',
    zona: tipoEntrega === 'delivery' ? (zona || '') : '',
    coordenadas: coords || null,
    google_maps_url: coords?.lat && coords?.lng ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}` : '',
    referencia: referencia || '',
    notas_adicionales: notasAdicionales || '',
    personas: personas || 2,
    fecha_reserva: fecha || null,
    hora_reserva: hora || null,
    total_estimado: Number(totalEstimado || 0),
    monto_anticipo: Number(deposito || 0),
    saldo_pendiente: Number(saldoPendiente),
    pago_confirmado: false,
    comprobante_url: imagenPago || null,
    creado_en: new Date().toISOString()
  };

  const itemsFormatted = (itemsSeleccionados || []).map(it => {
    let cat = 'Plato Fuerte';
    const rawCat = (it.categoria || '').toLowerCase();
    if (rawCat.includes('caldo') || rawCat.includes('sopa')) cat = 'Caldos';
    else if (rawCat.includes('refresco') || rawCat.includes('jugo')) cat = 'Refrescos';
    else if (rawCat.includes('cerveza') || rawCat.includes('trago')) cat = 'Cervezas';

    return {
      id_elemento_menu: it.id || null,
      nombre_item: it.nombre,
      categoria: cat,
      cantidad: it.cantidad || 1,
      precio_unitario: Number(it.precio_actual || it.precio || 0),
      subtotal: Number(it.precio_actual || it.precio || 0) * (it.cantidad || 1),
      estado_item: 'pendiente',
      instrucciones: notasAdicionales || null
    };
  });

  const bodyData = {
    id: pedidoId,
    id_restaurante: 'demo-tenant',
    id_mesero: 'web-online',
    numero_letrero: 0,
    subtotal: Number(totalEstimado || 0),
    total: Number(totalEstimado || 0),
    estado: 'pendiente',
    datos_facturacion: datosFacturacion,
    notas: `[${tipoEntrega === 'delivery' ? '🛵 DELIVERY' : '🪴 RESERVA'}] ${nombre} (${telefono || 'S/N'}). ${tipoEntrega === 'delivery' ? `Dir: ${direccion}, ${zona}` : `${personas} pers.`}. Pagado: Bs. ${deposito}. Falta pagar: Bs. ${saldoPendiente}.`,
    items: itemsFormatted
  };

  // Intento 1: Servidor API
  try {
    const res = await fetch(`${API_URL}/api/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Pedido registrado exitosamente en el servidor:', data);
      return { ok: true, id: pedidoId, pedido: data.pedido };
    }
  } catch (err) {
    console.warn('Servidor no disponible en API_URL, usando inserción directa a Supabase...', err);
  }

  // Intento 2: Supabase REST Directo
  try {
    const resPedido = await fetch(`${SUPABASE_URL}/rest/v1/pedidos`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        id: pedidoId,
        id_restaurante: 'demo-tenant',
        id_mesero: 'web-online',
        numero_ficha: Math.floor(Date.now() / 1000) % 1000,
        numero_letrero: 0,
        estado: 'pendiente',
        subtotal: Number(totalEstimado || 0),
        total: Number(totalEstimado || 0),
        datos_facturacion: datosFacturacion,
        notas: bodyData.notas
      }),
      signal: AbortSignal.timeout(6000)
    });

    if (resPedido.ok) {
      if (itemsFormatted.length > 0) {
        const itemsPayload = itemsFormatted.map(it => ({
          id_pedido: pedidoId,
          id_elemento_menu: it.id_elemento_menu,
          nombre_item: it.nombre_item,
          categoria: it.categoria,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
          subtotal: it.subtotal,
          estado_item: 'pendiente',
          instrucciones: it.instrucciones
        }));

        await fetch(`${SUPABASE_URL}/rest/v1/items_pedido`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(itemsPayload)
        });
      }
      console.log('✅ Pedido insertado directamente en Supabase REST:', pedidoId);
      return { ok: true, id: pedidoId };
    }
  } catch (err2) {
    console.error('Error al insertar pedido en Supabase:', err2);
  }

  return { ok: false, id: pedidoId };
}

/**
 * Consulta el estado actualizado de un pedido en tiempo real (por ID o código)
 */
export async function consultarEstadoPedido(pedidoId) {
  if (!pedidoId) return null;
  const target = String(pedidoId).trim().replace(/^#/, '');

  // 1. Supabase REST Directo (Alta disponibilidad)
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);
    const filter = isUuid
      ? `id=eq.${target}`
      : `or=(id.ilike.*${target}*,numero_ficha.eq.${target})`;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/pedidos?${filter}&select=*,items:items_pedido(*)&limit=1`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const rows = await res.json();
      if (rows && rows.length > 0) {
        return rows[0];
      }
    }
  } catch (e) {
    console.warn('Error consultando estado en Supabase:', e);
  }

  // 2. Fallback a Servidor API
  try {
    const res = await fetch(`${API_URL}/api/pedidos/${target}`, {
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn('Error consultando estado en API Server:', e);
  }

  return null;
}

/**
 * Busca pedidos recientes asociados a un número de teléfono de WhatsApp
 */
export async function buscarPedidosPorTelefono(telefono) {
  if (!telefono) return [];
  const cleanPhone = telefono.replace(/\D/g, '');
  if (cleanPhone.length < 6) return [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pedidos?datos_facturacion->>cliente_telefono=ilike.*${cleanPhone}*&select=*,items:items_pedido(*)&order=creado_en.desc&limit=5`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        signal: AbortSignal.timeout(5000)
      }
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Error buscando pedidos por teléfono:', e);
  }
  return [];
}
