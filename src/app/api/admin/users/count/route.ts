// src/app/api/admin/users/count/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    // Check if user is an admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Access denied. Must be an admin." }, 
        { status: 403 }
      );
    }
    
    // Count users by role
    const candidates = await prisma.user.count({
      where: { role: "CANDIDATE" },
    });
    
    const interviewers = await prisma.user.count({
      where: { role: "INTERVIEWER" },
    });
    
    const admins = await prisma.user.count({
      where: { role: "ADMIN" },
    });
    
    return NextResponse.json({
      candidates,
      interviewers,
      admins,
    });
    
  } catch (error) {
    console.error("Error fetching user counts:", error);
    return NextResponse.json(
      { message: "Internal server error" }, 
      { status: 500 }
    );
  }
}