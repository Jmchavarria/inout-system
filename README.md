# InOut System 📊

## 📋 Descripción

InOut System es una aplicación fullstack para la gestión de ingresos y egresos, con control de usuarios y generación de reportes, desarrollada como prueba técnica. El sistema permite llevar un control detallado de las entradas y salidas financieras con diferentes niveles de acceso de usuarios.

## ✨ Características Principales

- 💰 **Gestión de Ingresos y Egresos**: Registro completo de transacciones financieras
- 👥 **Control de Usuarios**: Sistema de autenticación y autorización
- 📊 **Generación de Reportes**: Reportes detallados y estadísticas
- 🔒 **Autenticación Segura**: Sistema de login y manejo de sesiones
- 🔍 **Filtrado y Búsqueda**: Búsqueda avanzada de transacciones
- 📅 **Historial Completo**: Registro histórico de todas las operaciones

## 🛠️ Stack Tecnológico

### Frontend
- HTML5, CSS3, JavaScript
- Framework CSS (Shadcn/Tailwind CSS)
- Responsive Design

### Backend
- API RESTful
- Middleware de autenticación

### Base de Datos
- Prisma / PostgreSQL / Supabase 
- Migraciones y seeders

### Herramientas de Desarrollo
- Git para control de versiones
- npm/bun para gestión de paquetes

## 📋 Requisitos Previos

Asegúrate de tener instalado:

- **Node.js** (versión 16 o superior)
- **npm** o **yarn**
- **MySQL** o **PostgreSQL**
- **Git**

## 🚀 Instalación Local

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Jmchavarria/inout-system.git

```

### 2. Instalar Dependencias

```bash
# Si usas npm
npm install

```

### 3. Configurar Variables de Entorno

1. Copia el archivo de ejemplo:
   ```bash
   .env
   ```

2. Configura las variables en el archivo `.env`:
   ```env
 # Connect to Supabase via connection pooling
DATABASE_URL="postgresql://postgres.rxrgwbrthqjhljsgrfua:UPDQeKklpmLjPWZH@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection to the database. Used for migrations
DIRECT_URL="postgresql://postgres.rxrgwbrthqjhljsgrfua:UPDQeKklpmLjPWZH@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL=https://rxrgwbrthqjhljsgrfua.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cmd3YnJ0aHFqaGxqc2dyZnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTIyOTksImV4cCI6MjA3MjY2ODI5OX0.xWgaej-YCN_uVD2ecIxiNgWbJeRx1f8P0u5C8IJOjv0

# Better Auth
BETTER_AUTH_SECRET=CpJnj9Kf8HH6aJavbNg9JyD3xmteTi2D
BETTER_AUTH_URL=http://localhost:3000/
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000/

# GitHub OAuth
GITHUB_CLIENT_ID="Ov23lirh2Us15QOFVZvL"
GITHUB_CLIENT_SECRET="29a976b9faccc115354f984046da6d05b1d76dda"
   ```

### 4. Configurar Base de Datos

1. Crear la base de datos:
   ```sql
   CREATE DATABASE inout_system;
   ```

2. Ejecutar migraciones:
   ```bash
   npm run migrate
   # o
   npm run db:setup
   ```



### 5. Ejecutar la Aplicación

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

### 6. Acceder a la Aplicación

- **URL Local**: `http://localhost:3000`


## 🚀 Despliegue en Vercel

### Método 1: Despliegue Automático

1. **Conectar con GitHub:**
   - Ve a [vercel.com](https://vercel.com)
   - Conecta tu cuenta de GitHub
   - Importa el repositorio `inout-system`

2. **Configurar Variables de Entorno:**
   En el dashboard de Vercel, agrega:
   ```env
   GITHUB_CLIENT_SECRET=5e06cbd99760cf0c62dad0d4707c574fa19d0e52
   NEXT_PUBLIC_BETTER_AUTH_URL=https://inout-system.vercel.app
   DATABASE_URL=postgresql://postgres.rxrgwbrthqjhljsgrfua:UPDQeKklpmLjPWZH@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres.rxrgwbrthqjhljsgrfua:UPDQeKklpmLjPWZH@aws-1-us-east-1.pooler.supabase.com:5432/postgres
   NEXT_PUBLIC_SUPABASE_URL=https://rxrgwbrthqjhljsgrfua.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cmd3YnJ0aHFqaGxqc2dyZnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTIyOTksImV4cCI6MjA3MjY2ODI5OX0.xWgaej-YCN_uVD2ecIxiNgWbJeRx1f8P0u5C8IJOjv0
   BETTER_AUTH_SECRET=CpJnj9Kf8HH6aJavbNg9JyD3xmteTi2D
   GITHUB_CLIENT_ID=Ov23liPcFlmYvnwvJCvO
   
   ```

3. **Configuración de Build:**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "installCommand": "npm install"
   }
   ```

### Método 2: Despliegue con CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```



---

⭐ **Si este proyecto te resulta útil, ¡no olvides darle una estrella!**

🚀 **¿Listo para gestionar tus finanzas de manera eficiente?**
