export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/parent/:path*",
    "/onboarding",
  ],
};
