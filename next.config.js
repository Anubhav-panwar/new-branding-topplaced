/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ["images.pexels.com"],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async redirects() {
    return [
      {
        source: "/admin/login",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/auth/login",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/auth/register",
        destination: "/register",
        permanent: true,
      },
      {
        source: "/auth/forgot-password",
        destination: "/forgot-password",
        permanent: true,
      },
      {
        source: "/auth/reset-password",
        destination: "/reset-password",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const rawBackend =
      process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000";
    const backendUrl = rawBackend.replace(/\/$/, "");
    return [
      {
        source: "/proctoring/:path*",
        destination: `${backendUrl}/proctoring/:path*`,
      },
      {
        source: "/api/proctoring/:path*",
        destination: `${backendUrl}/proctoring/:path*`,
      },
      {
        source: "/interview/:path*",
        destination: `${backendUrl}/interview/:path*`,
      },
      {
        source: "/api/interview/:path*",
        destination: `${backendUrl}/interview/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
