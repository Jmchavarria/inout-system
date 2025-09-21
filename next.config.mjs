/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  eslint: {
    // Permite compilar aunque ESLint marque errores
    ignoreDuringBuilds: true,
  },
  images: {

    unoptimized: true, 
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/u/**',
      },
      // Si también usas otros dominios para imágenes, agrégalos aquí
      {
        protocol: 'https',
        hostname: 'github.com',
        port: '',
        pathname: '/**',
      }
    ],
    // Alternativamente, puedes usar la configuración legacy (menos segura):
    // domains: ['avatars.githubusercontent.com', 'github.com'],
  },
  // Otras configuraciones que puedas tener...
  experimental: {

    
    // Cualquier configuración experimental
  },
}

export default nextConfig;