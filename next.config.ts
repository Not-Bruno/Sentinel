import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Diese Konfiguration stellt sicher, dass das 'node-ssh'-Paket
  // korrekt in den Server-Build für die Produktionsumgebung eingebunden wird.
  // Ohne dies schlagen SSH-Verbindungen im Docker-Container fehl.
  serverComponentsExternalPackages: ['node-ssh'],
};

export default nextConfig;
