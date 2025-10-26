import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/resources(.*)",
    "/practice(.*)",
    "/web-development(.*)",
    "/mock-test(.*)",
    "/api/(.*)"
  ],
});

export const config = {
  matcher: [
    "/((?!.+\.[\w]+$|_next).*)",
    "/(api|trpc)(.*)",
  ],
};


