import type { ReactNode } from "react";

// Root layout only passes through; the [locale] layout renders <html>.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
