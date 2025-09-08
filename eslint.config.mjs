// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true }, // ⬅️ desactiva ESLint en el build
  // Si quieres, también puedes desactivar TypeScript en build, pero NO lo recomiendo:
  // typescript: { ignoreBuildErrors: true },
  experimental: {},
};

export default nextConfig;
