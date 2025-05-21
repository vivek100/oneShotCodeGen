/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    // Use the environment variable directly without transformation
    NEXT_PUBLIC_CLOUD_MODE: process.env.NEXT_PUBLIC_CLOUD_MODE,
    // Supabase settings
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  webpack: (config, { isServer }) => {
    // Add Monaco Editor webpack loader
    config.module.rules.push({
      test: /\.ttf$/,
      type: 'asset/resource'
    });

    return config;
  }
}

export default nextConfig
