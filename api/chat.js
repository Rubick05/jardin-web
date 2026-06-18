// Función serverless para el Chatbot de Restaurante El Jardín
// Corre en Vercel (Node.js runtime) y protege el API Key de Gemini.

export default async function handler(req, res) {
  // Configurar cabeceras CORS básicas
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Falta la variable de entorno GEMINI_API_KEY.');
    return res.status(500).json({ error: 'Configuración del servidor incompleta. Falta API Key.' });
  }

  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'El cuerpo de la petición debe contener un array de mensajes.' });
    }

    // Convertir el formato del chat al formato esperado por Gemini API ({ role: 'user'|'model', parts: [{ text: '...' }] })
    const formattedContents = messages.map(m => {
      // Normalizar roles
      const role = m.role === 'assistant' ? 'model' : 'user';
      return {
        role,
        parts: [{ text: m.content || '' }]
      };
    });

    const systemPrompt = `
Eres el Asistente Inteligente de "Restaurante El Jardín", un restaurante tradicional y peña folclórica ubicado en Cochabamba, Bolivia.
Tu objetivo es ayudar de manera cálida, amable y servicial a los usuarios del sitio web con sus dudas y guiarlos en el proceso de reserva de mesa o pedidos anticipados.

INFORMACIÓN CLAVE DEL RESTAURANTE:
- Nombre: Restaurante El Jardín.
- Concepto: Peña-Restaurant tradicional, famoso por revivir los sabores típicos de los valles cochabambinos, con música folclórica en vivo los fines de semana, ambiente familiar al aire libre y decoración rústica.
- Ubicación: Final de la Av. Melchor Pérez de Olguín, Cochabamba, Bolivia. El mapa interactivo está disponible en la sección de contacto o directamente en Google Maps: https://maps.app.goo.gl/S5uYzZB4ZRNTUoV16.
- Horarios de Atención al Público:
  * Jueves: 11:00 AM — 11:00 PM (23:00) hs
  * Sábado: 12:00 PM — 11:00 PM (23:00) hs
  * Domingo: 12:00 PM — 11:00 PM (23:00) hs
  * NOTA IMPORTANTE: Lunes, Martes, Miércoles y Viernes el restaurante permanece CERRADO. (Si el usuario te pregunta por estos días, recuérdale con tacto que solo abrimos los Jueves, Sábados y Domingos).
- Teléfono/WhatsApp: +591 69420202.

MENÚ Y ESPECIALIDADES (Sabores Tradicionales):
1. Jatun Pampaku: Nuestra gran especialidad de la casa (Bs. 110). Es un asado tradicional de carnes mixtas cocido lentamente bajo tierra al calor de piedras volcánicas, acompañado de papas, camote, oca y ensalada.
2. Pique Macho: Plato emblemático cochabambino con carne de res jugosa, salchichas premium, papas fritas crujientes, huevo, queso criollo, tomate, cebolla y locotos.
   - Pique Entero (familiar): Bs. 120
   - Pique Medio: Bs. 80
3. Charque Criollo: Carne de res deshidratada al sol, machacada y frita hasta quedar crujiente, servida con abundante mote, huevo y queso criollo.
   - Charque Entero: Bs. 120
   - Charque Medio: Bs. 80
4. Planchita: Mezcla de carne, chorizo y tubérculos servidos sobre una plancha caliente.
   - Planchita Entera: Bs. 120
   - Planchita Media: Bs. 80
5. Caldos Tradicionales:
   - Lomito Borracho (caldo reconstituyente con carne y huevo): Bs. 30
   - Kawi (caldo tradicional de pecho de res): Bs. 20
   - Fideos Uchu (delicioso ají de fideos tradicional): Familiar Bs. 60 / Personal Bs. 40
6. Acompañamientos y Extras:
   - Lambreado de Conejo: Bs. 80
   - Alitas de Pollo (porción): Bs. 25
   - Escabeche de Pollo: Bs. 50
7. Bebidas:
   - Refrescos: Coca Cola 2L (Bs. 15), Coca Cola Personal (Bs. 8), Fanta/Sprite (Bs. 8), Agua mineral (Bs. 5).
   - Cervezas frías: Huari (Bs. 20), Paceña (Bs. 18), Ducal (Bs. 18).

REGLAS DE COMPORTAMIENTO:
1. Sé extremadamente cortés, usa modismos bolivianos amables de forma sutil y natural si cabe (como decir "¡Bienvenido a El Jardín!", "con todo gusto", "claro que sí").
2. Si el usuario te indica que quiere hacer una reserva o pedido, tu deber es preguntarle amablemente:
   - Su nombre.
   - La cantidad de personas.
   - La fecha (recuerda validar que sea Jueves, Sábado o Domingo).
   - La hora de llegada.
   - Qué platos desea pedir de manera anticipada para agilizar el servicio (opcional).
3. Una vez que el usuario te dé datos de reserva o pida reservar explícitamente, activa el flag 'action: "open_reserva"' e introduce los datos recopilados en 'reservaData'. No es necesario que tengas todos los datos completos para activar la acción; si el usuario dice "Quiero una mesa para mañana", activa la acción para asistirle a llenar el formulario visual.
4. Responde con brevedad y concisión. Evita textos excesivamente largos. Usa viñetas para listar platos si te preguntan por opciones.
`;

    // Llamar a la API oficial de Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: formattedContents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              response: {
                type: 'STRING',
                description: 'La respuesta amigable y conversacional para mostrar al usuario.'
              },
              action: {
                type: 'STRING',
                enum: ['open_reserva', 'none'],
                description: 'Establecer a "open_reserva" si el usuario quiere reservar o hacer un pedido. De lo contrario "none".'
              },
              reservaData: {
                type: 'OBJECT',
                description: 'Datos de reserva recopilados de la conversación. Llenar solo lo que se conozca.',
                properties: {
                  nombre: { type: 'STRING' },
                  personas: { type: 'INTEGER' },
                  fecha: { type: 'STRING', description: 'Fecha en formato YYYY-MM-DD' },
                  hora: { type: 'STRING', description: 'Hora en formato HH:MM' },
                  platos: {
                    type: 'ARRAY',
                    items: {
                      type: 'OBJECT',
                      properties: {
                        nombre: { type: 'STRING', description: 'Nombre del plato que coincide con el menú' },
                        cantidad: { type: 'INTEGER' }
                      },
                      required: ['nombre', 'cantidad']
                    }
                  }
                }
              }
            },
            required: ['response', 'action']
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de Gemini API:', errorText);
      return res.status(response.status).json({ error: 'Error al comunicarse con la API de Inteligencia Artificial.' });
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('Respuesta vacía o formato inválido de Gemini API.');
    }

    // Parsear el JSON generado por Gemini
    const parsedResult = JSON.parse(resultText);
    return res.status(200).json(parsedResult);

  } catch (err) {
    console.error('Excepción en handler de chat:', err);
    return res.status(500).json({ error: 'Error interno del servidor al procesar el mensaje.' });
  }
}
