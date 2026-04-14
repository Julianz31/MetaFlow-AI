# VAULT · App de Finanzas Personales

Stack: **Next.js 14 · TypeScript · Supabase · Chart.js · Tailwind CSS**

---

## 🚀 Setup en 5 pasos

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratuita
2. Crea un nuevo proyecto
3. Ve a **SQL Editor** y ejecuta el contenido de `supabase-schema.sql`
4. Ve a **Settings → API** y copia tus keys

### 3. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus keys de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 4. Correr en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### 5. Deploy en producción (Vercel)

```bash
npx vercel
```

O conecta tu repo en [vercel.com](https://vercel.com) y agrega las variables de entorno.

---

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── login/          # Autenticación
│   ├── dashboard/      # Panel principal
│   ├── inversiones/    # Portafolio
│   ├── deudas/         # Gestión deudas
│   ├── metas/          # Metas + IFI
│   └── simulador/      # Simulador de escenarios
├── components/
│   ├── ui/             # Modal, Btn, KpiCard, Panel...
│   ├── forms/          # FormTransaccion, FormInversion...
│   └── layout/         # Sidebar
├── hooks/
│   └── useData.ts      # Todos los hooks de Supabase
├── lib/
│   ├── supabase.ts     # Cliente Supabase
│   └── calculos.ts     # Cálculos financieros (IFI, simulador...)
└── types/
    └── index.ts        # Tipos TypeScript
```

## 🧮 Cálculos clave

- **IFI** = (Renta pasiva mensual / Gastos mensuales) × 100
- **Renta pasiva** = Capital total × 4% / 12 (Regla del 4%)
- **Capital requerido** = Gastos anuales / 4%
- **Estrategia Avalancha** = Pagar primero deuda con mayor tasa
- **Simulador** = Interés compuesto mensual + ajuste por inflación

## 🔐 Seguridad

- Row Level Security (RLS) en todas las tablas
- Cada usuario solo ve sus propios datos
- Autenticación nativa de Supabase

---

Construido con ❤️ en Medellín 🇨🇴
