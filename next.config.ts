import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'srv938571.hstgr.cloud',
    ],
  },
}

export default nextConfig


// import type { NextConfig } from 'next'

// const nextConfig: NextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: "http",
//         hostname: "localhost",
//         port: "4000",
//         pathname: "/uploads/**",
//       },
//     ],
//   },
// }

// export default nextConfig
