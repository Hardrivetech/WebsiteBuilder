import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  // Match all paths except for ones that start with:
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  // - api/ (API routes)
  // - The root domain itself (e.g., your-saas-domain.com)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|/$).*)"],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host");

  // Use your actual root domain here
  const rootDomain = "https://websitebuilder-7qa.pages.dev/";

  if (
    hostname &&
    hostname !== rootDomain &&
    !hostname.endsWith(`.localhost:3000`)
  ) {
    // Extract the subdomain from the hostname
    const subdomain = hostname.replace(`.${rootDomain}`, "");

    // Rewrite the URL to the /site/[domain] page
    url.pathname = `/site/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
