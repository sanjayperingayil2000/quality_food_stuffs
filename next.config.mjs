/** @type {import('next').NextConfig} */
const config = {
  eslint: {
    // Allow production builds even if ESLint errors exist
    ignoreDuringBuilds: true,
  },
};

export default config;
