/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      // desenvolvimento local
      { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/uploads/**' },
      // produção — aceita qualquer domínio HTTPS para /uploads/
      { protocol: 'https', hostname: '**', pathname: '/uploads/**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
