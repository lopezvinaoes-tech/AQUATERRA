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
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` (secreta, nunca en el navegador) |
   | `ADMIN_EMAILS` | Emails con acceso al panel, separados por comas |

5. Volver a desplegar en Vercel. `/admin` pedirá login.

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
- El panel solo acepta cuentas de Supabase cuyo email esté en `ADMIN_EMAILS`.
- La API limita a 5 envíos por IP cada 10 minutos y descarta bots con un campo trampa (`empresa_web`). La IP no se guarda, solo un hash.
