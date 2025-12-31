/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

 

  images: {
    // ✅ Añade las calidades que usas en tus componentes Image
    qualities: [75, 90],
    
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
};

export default nextConfig;