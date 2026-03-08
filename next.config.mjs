/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@clerk/nextjs'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gateoverflow.in',
      },
      {
        protocol: 'https',
        hostname: '10tracker.com',
      }
    ],
  },
};

export default nextConfig;
