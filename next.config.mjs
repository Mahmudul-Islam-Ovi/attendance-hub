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
};
export default nextConfig;
