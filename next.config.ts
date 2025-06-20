
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
    ],
  },
  env: {
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  },
  allowedDevOrigins: [
    'https://9000-firebase-studio-1749141756127.cluster-2xfkbshw5rfguuk5qupw267afs.cloudworkstations.dev',
    'https://6000-firebase-studio-1749141756127.cluster-2xfkbshw5rfguuk5qupw267afs.cloudworkstations.dev',
    'https://3000-firebase-studio-1749141756127.cluster-2xfkbshw5rfguuk5qupw267afs.cloudworkstations.dev',
  ],
};

export default nextConfig;
