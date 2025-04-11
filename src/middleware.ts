// src/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req: request, secret });
  
  // Get the pathname of the request
  const pathname = request.nextUrl.pathname;
  
  // Check if the route is protected
  const isProtectedRoute = 
    pathname.startsWith("/dashboard") || 
    pathname.startsWith("/interviews") || 
    pathname.startsWith("/admin");
    
  // Check if the route is role-specific
  const isCandidateRoute = pathname.includes("/candidate");
  const isInterviewerRoute = pathname.includes("/interviewer");
  const isAdminRoute = pathname.includes("/admin");
  
  // If the route is protected and the user is not authenticated, redirect to login
  if (isProtectedRoute && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", encodeURI(pathname));
    return NextResponse.redirect(url);
  }
  
  // Role-based access control
  if (token) {
    // Only candidates can access candidate routes
    if (isCandidateRoute && token.role !== "CANDIDATE") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    
    // Only interviewers can access interviewer routes
    if (isInterviewerRoute && token.role !== "INTERVIEWER") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    
    // Only admins can access admin routes
    if (isAdminRoute && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }
  
  return NextResponse.next();
}

// Specify paths to apply the middleware to
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/interviews/:path*", 
    "/admin/:path*",
    "/api/private/:path*",
  ],
};