import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);
const SESSION_COOKIE = "vgmf_session";

const PROTECTED = /^\/(?:(?:en|mr|hi)\/)?(admin|account)(\/|$)/;

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PROTECTED.test(pathname) && !req.cookies.get(SESSION_COOKIE)?.value) {
    const url = req.nextUrl.clone();
    const m = /^\/(en|mr|hi)(?=\/|$)/.exec(pathname);
    url.pathname = `${m ? `/${m[1]}` : ""}/login`;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return intl(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|realtime|.*\\..*).*)"],
};
