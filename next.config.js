/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  poweredByHeader: false,
  experimental: {
    typedRoutes: false,
  },
};

module.exports = nextConfig;
