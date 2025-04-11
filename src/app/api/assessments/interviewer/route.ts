// src/app/api/assessments/interviewer/route.ts

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
    
    // Check if user is an interviewer or admin
    if (session.user.role !== "INTERVIEWER" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Access denied. Must be an interviewer or admin." }, 
        { status: 403 }
      );
    }
    
    // Get assessments assigned to this interviewer or unassigned (for review)
    const assessments = await prisma.codingAssessment.findMany({
      where: {
        OR: [
          { reviewerId: session.user.id },
          // Also include submitted assessments with no reviewer
          { status: "SUBMITTED", reviewerId: null },
        ],
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        candidate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return NextResponse.json(assessments);
    
  } catch (error) {
    console.error("Error fetching interviewer assessments:", error);
    return NextResponse.json(
      { message: "Internal server error" }, 
      { status: 500 }
    );
  }
}