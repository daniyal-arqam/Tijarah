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
  async redirects() {
    return [
      { source: "/dashboard", destination: "/app", permanent: false },
      { source: "/companies", destination: "/app/leads", permanent: false },
      { source: "/outreach", destination: "/app/outreach", permanent: false },
      { source: "/quotes", destination: "/app/quotes", permanent: false },
      { source: "/orders", destination: "/app/orders", permanent: false },
      { source: "/reviews", destination: "/app/reviews", permanent: false },
      { source: "/profile", destination: "/app/profile", permanent: false },
      { source: "/suppliers", destination: "/app/suppliers", permanent: false },
      { source: "/invoices", destination: "/app/invoices", permanent: false },
      { source: "/rfqs", destination: "/app/rfqs", permanent: false },
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
