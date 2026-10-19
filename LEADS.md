# Leads y panel de administración

- **Formulario → `POST /api/leads`**: guarda cada solicitud en Supabase, la clasifica por tipo de inversor y prioridad, y registra país, página y campaña (utm).
- **Panel → `/admin`**: login, métricas, embudo, tipos de inversor, tabla con búsqueda, detalle con estado, notas e historial, y exportación a CSV.
- **Un solo perfil por persona**: si alguien vuelve a escribir con el mismo email o WhatsApp (otro formulario, el comparador, las alertas o el chat), no se crea un lead nuevo: se completan los datos que faltaban, se actualizan monto y objetivo, se suman los proyectos de interés y el mensaje, y queda un evento "Volvió a escribir desde …" en su historial. En el panel la tabla se ordena por última actividad, muestra cuántos contactos lleva cada lead y avisa cuando uno vuelve a escribir.
- **Prefijo telefónico**: todos los campos de WhatsApp tienen un selector de país (`prefijos.js`). El número llega a la base con prefijo internacional (`+34 612345678`); el país sugerido es el último elegido o el de la zona horaria del visitante. Si alguien escribe el número ya con `+`, se respeta.
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
- **Bloqueo por intentos**: tras 5 contraseñas incorrectas seguidas (en 24 h) la cuenta del equipo queda bloqueada y Supabase envía un correo con un enlace para crear una contraseña nueva; el enlace abre `/admin` y, al guardar la nueva, se desbloquea. Un administrador también la desbloquea cambiándole la contraseña desde **Equipo**. Para que el enlace funcione, en Supabase **Authentication → URL Configuration** la *Site URL* debe ser la de la web y `https://<dominio>/admin/` debe estar en *Redirect URLs*. El correo de Supabase sin SMTP propio solo llega a direcciones del equipo de Supabase y tiene un límite bajo por hora: para los asesores conviene configurar un SMTP propio (Authentication → Emails → SMTP).
- **Inactividad**: tras 15 minutos sin usar el panel (en ninguna pestaña) la sesión se cierra, también en Supabase, y hay que volver a entrar.
- **Accesos** (pestaña solo para administradores): cada entrada, salida, cierre por inactividad, contraseña incorrecta, bloqueo y cambio de contraseña, con fecha, IP, ciudad, país y navegador. Tablas `accesos` y `acceso_bloqueos` en `supabase/schema.sql`.

## Chat con IA

- **Ventana → `chat.js`**: botón flotante "¿Dudas? Pregúntame" en todas las páginas (`<script src="./chat.js" defer></script>`). Cualquier enlace a `#asistente` lo abre, y `window.abrirAsistente('pregunta')` lo abre con una pregunta.
- **Servidor → `POST /api/chat`**: llama a la IA con los datos de la web y el catálogo de `proyectos.js`. Si la persona acepta que la contacten, guarda el lead con origen **Chat IA**, un resumen y la conversación (se ven en el detalle del lead en `/admin`).
- **IA gratis (recomendado)**: Google Gemini. Crear la clave gratis en [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (sin tarjeta) y añadirla en Vercel como `GEMINI_API_KEY`. Modelo por defecto `gemini-3.8-flash`. En el plan gratis Google puede usar las conversaciones para mejorar sus productos y hay un límite diario de consultas.
- **Alternativa de pago**: Claude, con `ANTHROPIC_API_KEY` (modelo por defecto `claude-haiku-5-5`). Si están las dos claves, se usa Gemini.
- **Opcionales**: `CHAT_MODEL` (cambia el modelo), `CHAT_LIMITE_IP_HORA` (40) y `CHAT_LIMITE_DIARIO` (3000 mensajes al día en total).
- Sin ninguna clave, el botón aparece igual y responde con un aviso que deriva a WhatsApp o al formulario.
