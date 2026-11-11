/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    const backendUrl = (
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://localhost:5000"
    ).replace(/\/+$/, "");

    return [
      {
        source: "/api/clubs/:path*",
        destination: `${backendUrl}/api/clubs/:path*`,
      },
      {
        source: "/api/events/:path*",
        destination: `${backendUrl}/api/events/:path*`,
      },
      {
        source: "/api/users/:path*",
        destination: `${backendUrl}/api/users/:path*`,
      },
      {
        source: "/api/programming/:path*",
        destination: `${backendUrl}/api/programming/:path*`,
      },
      {
        source: "/api/web-development/:path*",
        destination: `${backendUrl}/api/web-development/:path*`,
      },
      {
        source: "/api/health",
        destination: `${backendUrl}/api/health`,
      },
    ];
  },
};

export default nextConfig;
