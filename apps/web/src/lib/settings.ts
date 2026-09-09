import { prisma } from "@vgmf/db";
import { cache } from "react";

export type Branding = {
  siteName: string;
  logoUrl: string | null;
  appLogoUrl: string | null;
  primaryColor: string;
};

export const getBranding = cache(async (): Promise<Branding> => {
  const rows = await prisma.siteSetting.findMany({ where: { key: { startsWith: "branding." } } });
  const get = (k: string) => rows.find((r) => r.key === `branding.${k}`)?.value;
  return {
    siteName: (get("site_name") as string | undefined) ?? "Vaidya Gogate Memorial Foundation",
    logoUrl: (get("logo_url") as string | null | undefined) ?? null,
    appLogoUrl: (get("app_logo_url") as string | null | undefined) ?? null,
    primaryColor: (get("primary_color") as string | undefined) ?? "#7c2d12",
  };
});
