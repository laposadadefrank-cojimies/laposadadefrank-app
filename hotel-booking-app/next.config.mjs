/** @type {import('next').NextConfig} */
const nextConfig = {
  // Eliminamos el modo standalone para que Vercel use su configuración nativa
  typescript: {
    ignoreBuildErrors: true,
  },
}
export default nextConfig
