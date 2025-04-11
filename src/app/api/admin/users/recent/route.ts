// src/app/api/admin/users/recent/route.ts

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
    
    // Get recent users
    const recentUsers = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    
    return NextResponse.json(recentUsers);
    
  } catch (error) {
    console.error("Error fetching recent users:", error);
    return NextResponse.json(
      { message: "Internal server error" }, 
      { status: 500 }
    );
  }
}