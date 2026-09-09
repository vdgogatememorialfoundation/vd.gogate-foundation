import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@vgmf/auth", "@vgmf/core", "@vgmf/db", "@vgmf/i18n", "@vgmf/integrations"],
  serverExternalPackages: ["@prisma/client", "bcryptjs", "socket.io"],
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  // Workspace packages use NodeNext-style ".js" specifiers that point at .ts sources.
  webpack: (config) => {
    config.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"] };
    return config;
  },
  turbopack: { resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"] },
};

export default withNextIntl(nextConfig);
