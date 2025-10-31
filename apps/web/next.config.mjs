/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  eslint: {
    // while you’re unblocking CI:
    ignoreDuringBuilds: false,
  },
};
export default nextConfig;
