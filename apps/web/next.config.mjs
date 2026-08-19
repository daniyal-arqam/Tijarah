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
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
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
      { source: "/inbox", destination: "/app/inbox", permanent: false },
      { source: "/team", destination: "/app/team", permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: "/auth/:path*", destination: `${API}/auth/:path*` },
      { source: "/api/:path*", destination: `${API}/api/:path*` },
      { source: "/public/:path*", destination: `${API}/public/:path*` },
      { source: "/track/:path*", destination: `${API}/track/:path*` },
    ];
  },
};

export default nextConfig;
