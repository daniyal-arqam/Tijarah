/** @type {import('next').NextConfig} */
const API = process.env.API_URL || "http://localhost:4000";

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/auth/:path*", destination: `${API}/auth/:path*` },
      { source: "/api/:path*", destination: `${API}/api/:path*` },
      { source: "/public/:path*", destination: `${API}/public/:path*` },
    ];
  },
};

export default nextConfig;
