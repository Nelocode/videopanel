/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Allow images from any source (for future expansion)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
