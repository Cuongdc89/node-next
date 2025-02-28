import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    ppr: 'incremental',
  },
  images: {
    domains: ["randomuser.me"],
  },
};

export default nextConfig;
