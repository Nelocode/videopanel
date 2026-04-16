/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Proxy all /api/* requests to the backend container
  // BACKEND_URL must be set to the public backend URL in EasyPanel env vars
  // Default fallback for local development only
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    console.log(`[VideoPanel] Backend URL: ${backendUrl}`)
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },

  // Allow images from any source (for future expansion)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
