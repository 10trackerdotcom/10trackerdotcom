import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  publicRoutes: [
    "/",
    "/resources(.*)",
    "/practice(.*)",
    "/web-development(.*)",
    "/mock-test(.*)",
    "/api/(.*)",
  ],
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/(api|trpc)(.*)",
  ],
};

