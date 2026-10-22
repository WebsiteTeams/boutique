import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uploads and local database files are runtime data, never part of the server bundle.
  outputFileTracingExcludes: { "**": ["./data/**/*"] },
  // Online appointment booking was retired; old links land on the contact page.
  async redirects() {
    return [{ source: "/appointments", destination: "/contact", permanent: true }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/photos/**",
      },
      // Product, review and reference images when Cloudinary storage is configured.
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
