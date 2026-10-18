# Leads y panel de administración

- **Formulario → `POST /api/leads`**: guarda cada solicitud en Supabase, la clasifica por tipo de inversor y prioridad, y registra país, página y campaña (utm).
- **Panel → `/admin`**: login, métricas, embudo, tipos de inversor, tabla con búsqueda, detalle con estado, notas e historial, y exportación a CSV.
- Mientras la base no esté configurada, `/admin` muestra datos de ejemplo (modo demostración).

## Puesta en marcha (una sola vez)

1. Crear un proyecto gratis en [supabase.com](https://supabase.com) (región São Paulo, la más cercana a Paraguay).
2. En Supabase, **SQL Editor → New query**, pegar `supabase/schema.sql` y ejecutar.
3. En Supabase, **Authentication → Users → Add user**: crear el usuario administrador (email y contraseña).
4. En Vercel, **Settings → Environment Variables**, agregar:

   | Variable | Dónde se obtiene |
   |---|---|
   | `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
   | `SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → `service_role` o una secret key `sb_secret_...` (secreta, nunca en el navegador) |
   | `ADMIN_EMAILS` | (Opcional) Emails que siempre son administradores, separados por comas |

5. Volver a desplegar en Vercel. `/admin` pedirá login.

## Usuarios y permisos

El panel tiene dos roles, guardados en la tabla `equipo`:

- **Administrador**: ve todo, agrega leads a mano, edita sus datos, los elimina, asigna asesores y gestiona el equipo (pestaña **Equipo**).
- **Asesor**: ve los leads y las estadísticas, cambia el estado y deja notas.

Un administrador da de alta a cada persona desde la pestaña Equipo con una contraseña inicial; el panel crea su usuario en Supabase.

## Conectar el formulario

Incluir `<script src="/leads.js"></script>` y, al enviar:

```js
window.enviarLead({ nombre, email, whatsapp, monto, objetivo, mensaje, proyecto })
  .then(() => { /* mostrar "Recibimos tu solicitud" */ })
  .catch((e) => { /* mostrar e.message */ });
```

`monto` y `objetivo` son los textos de los botones del formulario (p. ej. `"USD 50.000 – 100.000"`, `"Renta por alquiler"`).

## Seguridad

- Las tablas tienen RLS activado y ninguna política: con la clave pública no se puede leer ni escribir nada. Solo la API de Vercel accede, con la clave `service_role`.
- El panel solo acepta cuentas activas de la tabla `equipo` (o de `ADMIN_EMAILS`), y el servidor comprueba el rol en cada acción.
- La API limita a 5 envíos por IP cada 10 minutos y descarta bots con un campo trampa (`empresa_web`). La IP no se guarda, solo un hash.

## Chat con IA

- **Ventana → `chat.js`**: botón flotante "¿Dudas? Pregúntame" en todas las páginas (`<script src="./chat.js" defer></script>`). Cualquier enlace a `#asistente` lo abre, y `window.abrirAsistente('pregunta')` lo abre con una pregunta.
- **Servidor → `POST /api/chat`**: llama a la IA con los datos de la web y el catálogo de `proyectos.js`. Si la persona acepta que la contacten, guarda el lead con origen **Chat IA**, un resumen y la conversación (se ven en el detalle del lead en `/admin`).
- **IA gratis (recomendado)**: Google Gemini. Crear la clave gratis en [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (sin tarjeta) y añadirla en Vercel como `GEMINI_API_KEY`. Modelo por defecto `gemini-3.8-flash`. En el plan gratis Google puede usar las conversaciones para mejorar sus productos y hay un límite diario de consultas.
- **Alternativa de pago**: Claude, con `ANTHROPIC_API_KEY` (modelo por defecto `claude-haiku-5-5`). Si están las dos claves, se usa Gemini.
- **Opcionales**: `CHAT_MODEL` (cambia el modelo), `CHAT_LIMITE_IP_HORA` (40) y `CHAT_LIMITE_DIARIO` (3000 mensajes al día en total).
- Sin ninguna clave, el botón aparece igual y responde con un aviso que deriva a WhatsApp o al formulario.
