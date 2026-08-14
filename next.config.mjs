/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const config = {
  output: 'export',
  trailingSlash: true,
  assetPrefix: isProd ? './' : '',
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default config;
