/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["@tremor/react", "lucide-react"],
  },
};

export default nextConfig;
