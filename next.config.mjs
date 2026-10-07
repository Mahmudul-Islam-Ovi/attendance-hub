import dotenv from "dotenv";
dotenv.config();

// Server-side date logic (late calculation, "today") follows this timezone.
process.env.TZ = process.env.NEXT_PUBLIC_APP_TZ || "Asia/Dhaka";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Run `npm run typecheck` to see type issues; they will not block the build.
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Cookie, x-api-key, Authorization" },
        ],
      },
    ];
  },
};
export default nextConfig;
