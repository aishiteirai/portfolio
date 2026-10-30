/** @type {import('next').NextConfig} */
const nextConfig = {
  // The three.js scenes own their canvases imperatively; a second dev-only mount would rebuild both.
  reactStrictMode: false,
};

export default nextConfig;
