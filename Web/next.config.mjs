/** @type {import('next').NextConfig} */
const backendUrl = process.env.APP_BACK_URL
  || (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '');

if (!backendUrl) {
  throw new Error('APP_BACK_URL must be set to the backend URL for production builds.');
}

const parsedBackendUrl = new URL(backendUrl);
if (!['http:', 'https:'].includes(parsedBackendUrl.protocol)) {
  throw new Error('APP_BACK_URL must use http or https.');
}

const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl.replace(/\/+$/, '')}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
