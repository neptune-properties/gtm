/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  eslint: {
    ignoreDuringBuilds: false,
  },
};
export default nextConfig;
