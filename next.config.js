/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },

  serverComponentsExternalPackages: ["@resvg/resvg-js"],
  
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" }
        // Add CSP later when you finalize domains for images/scripts
      ]
    }];
  },
};

module.exports = nextConfig;
