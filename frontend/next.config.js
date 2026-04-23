/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost', port: '3001', pathname: '/uploads/**' },
      { protocol: 'https', hostname: '**', pathname: '/uploads/**' },
    ],
  },
  async rewrites() {
    // BACKEND_URL é variável de servidor (não NEXT_PUBLIC) — segura e sem build arg
    const backend = process.env.BACKEND_URL || 'http://localhost:3001/api'
    return [
      { source: '/api/:path*', destination: `${backend}/:path*` },
    ]
  },
}

module.exports = nextConfig
