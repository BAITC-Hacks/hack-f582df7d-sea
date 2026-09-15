/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL || "http://localhost:8001";

const nextConfig = {
  async rewrites() {
    // Проксируем /api/* на FastAPI-бэкенд, чтобы фронт работал без CORS и без хардкода адреса
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
