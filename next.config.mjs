/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/u/**',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

<<<<<<< HEAD
=======
  // Quita el bloque experimental ya que Next.js 14 no necesita turbo: false
>>>>>>> c7b1863 (Nuevos cambios en el home)
};

export default nextConfig;