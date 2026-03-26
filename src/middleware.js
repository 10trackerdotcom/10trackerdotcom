import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const ARTICLE_CATEGORY_SLUGS = new Set([
  "latest-jobs",
  "exam-results",
  "answer-key",
  "admit-cards",
  "news",
  "categories",
]);

export default clerkMiddleware(
  (auth, req) => {
    const { pathname } = req.nextUrl;

    if (pathname === "/article") {
      const url = req.nextUrl.clone();
      url.pathname = "/articles";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/article/")) {
      const rest = pathname.slice("/article/".length);
      const firstSeg = rest.split("/")[0];

      if (firstSeg && !ARTICLE_CATEGORY_SLUGS.has(firstSeg)) {
        const url = req.nextUrl.clone();
        url.pathname = `/articles/${rest}`;
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  },
  {
    publicRoutes: [
      "/",
      "/resources(.*)",
      "/practice(.*)",
      "/web-development(.*)",
      "/mock-test(.*)",
      "/api/(.*)",
    ],
  }
);

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/(api|trpc)(.*)",
  ],
};

