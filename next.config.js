/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'ynwkhelqhehjlxlhhjfj.storage.ap-south-1.nhost.run',
      },
    ],
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
