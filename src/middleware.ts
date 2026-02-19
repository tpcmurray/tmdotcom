import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: [
    // Admin UI — redirect to /login if no session
    "/admin/:path*",
    // Protected API routes — always require auth regardless of HTTP method
    "/api/upload",
  ],
};
