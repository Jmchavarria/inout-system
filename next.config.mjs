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
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
  // Quita el bloque experimental ya que Next.js 14 no necesita turbo: false
>>>>>>> c7b1863 (Nuevos cambios en el home)
=======
>>>>>>> 67d3771 (New changes in dev)
=======
  // Quita el bloque experimental ya que Next.js 14 no necesita turbo: false
>>>>>>> bb0b039 (Nuevos cambios en el home)
=======
>>>>>>> 41a978b (New changes in dev)
};

export default nextConfig;