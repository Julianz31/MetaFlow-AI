# MetaFlow.AI

Dashboard y backend para revisar performance de Meta Ads, evaluar reglas de automatizacion y dejar acciones sugeridas en una cola de aprobacion.

## Estructura

- `backend/`: API Express, conexion con Supabase y Meta Marketing API.
- `frontend/`: app React para dashboard, reglas, aprobacion y configuracion.
- `database/schema.sql`: tablas base para reglas y cola de acciones.

## Configuracion

1. Copia `backend/.env.example` a `backend/.env` y completa las credenciales.
2. Copia `frontend/.env.example` a `frontend/.env`.
3. Ejecuta `database/schema.sql` en Supabase.

## Desarrollo

Backend:

```bash
cd backend
npm install
npm start
```

Por defecto la API usa `http://localhost:3000` y acepta el frontend local en `http://localhost:3002`.

Frontend:

```bash
cd frontend
npm install
npm start
```

## Endpoints principales

- `GET /api/health`: confirma que la API esta viva.
- `GET /api/meta/connection`: valida el System User Access Token contra la cuenta publicitaria.
- `GET /api/stats`: trae inversion, ROAS agregado y acciones pendientes.
- `GET /api/campaigns`: lista insights por campana para validar lectura.
- `GET /api/campaign-objectives`: lista objetivos disponibles para crear campanas.
- `GET /api/meta/assets`: lista Fan Pages disponibles y su Instagram conectado cuando Meta lo permite.
- `POST /api/campaign-builder/generate-copy`: genera copys con IA y notas de cumplimiento.
- `POST /api/campaign-builder/create`: crea campana, ad set, creativos y anuncios en estado `PAUSED`.
- `POST /api/process-rules`: evalua reglas activas contra insights por campana y crea acciones pendientes.

## Notas

- Los archivos `.env` no deben versionarse.
- El token de Meta debe ser un System User Access Token guardado solo en `backend/.env`.
- Asigna al System User unicamente la cuenta publicitaria que vas a administrar.
- Para crear campanas desde creativos, configura `META_PAGE_ID`, `META_INSTAGRAM_ACCOUNT_ID`, `META_DESTINATION_URL`, `META_WHATSAPP_NUMBER`, y `META_PIXEL_ID` si vas a usar objetivo de ventas.
- Para que la IA genere copys, configura `OPENAI_API_KEY`. Si no existe, la app usa un fallback local conservador.
- Las acciones se guardan como `pending`; la ejecucion real sobre Meta debe quedar detras de aprobacion explicita.
