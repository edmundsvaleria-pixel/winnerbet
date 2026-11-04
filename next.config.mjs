/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // This allows production builds to complete even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This also allows builds to complete if there are TypeScript errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;