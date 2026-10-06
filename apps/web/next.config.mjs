/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile the shared workspace package so Next.js can process its TypeScript.
  transpilePackages: ["@whippe/shared"],
};

export default nextConfig;
