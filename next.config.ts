import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth avatars
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co', // Supabase storage
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // GitHub avatars (if you add GitHub OAuth)
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
