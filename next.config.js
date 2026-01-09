/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  env: {
    PORT: '3001',
  },
  serverRuntimeConfig: {
    port: 3001,
  },
  publicRuntimeConfig: {
    port: 3001,
  },
};

module.exports = nextConfig;
