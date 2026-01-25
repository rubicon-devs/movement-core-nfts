/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: '*.tradeport.xyz',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tradeport.xyz',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
        pathname: '/**',
      },
      // Additional IPFS gateways
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ipfs.nftstorage.link',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'nftstorage.link',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gateway.ipfs.io',
        pathname: '/**',
      },
      // Arweave
      {
        protocol: 'https',
        hostname: 'arweave.net',
        pathname: '/**',
      },
      // Common CDNs
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig