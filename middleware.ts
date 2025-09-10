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

  // It's better to use an environment variable for the root domain.
  // The host header does not include the protocol, so we should compare against the bare domain.
  // NEXT_PUBLIC_ROOT_DOMAIN should be set to 'websitebuilder-7qa.pages.dev' in your Vercel environment variables.
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN || "websitebuilder-7qa.pages.dev";

  // For local development, you can use localhost.
  const devHostname = `localhost:3000`;

  if (
    hostname &&
    hostname !== rootDomain &&
    hostname !== devHostname &&
    !hostname.endsWith(`.${devHostname}`) // Handles subdomains on localhost
  ) {
    // Extract the subdomain from the hostname
    const subdomain = hostname
      .replace(`.${rootDomain}`, "")
      .replace(`.${devHostname}`, "");

    // Rewrite the URL to the /site/[domain] page
    url.pathname = `/site/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
