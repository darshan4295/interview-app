// src/app/api/admin/activity/count/route.ts

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
    
    // Count pending interviews
    const pendingInterviews = await prisma.interview.count({
      where: { status: "SCHEDULED" },
    });
    
    // Count completed interviews
    const completedInterviews = await prisma.interview.count({
      where: { status: "COMPLETED" },
    });
    
    // Count pending assessments
    const pendingAssessments = await prisma.codingAssessment.count({
      where: { 
        OR: [
          { status: "PENDING" },
          { status: "SUBMITTED" },
        ],
      },
    });
    
    // Count completed assessments
    const completedAssessments = await prisma.codingAssessment.count({
      where: { status: "REVIEWED" },
    });
    
    return NextResponse.json({
      pendingInterviews,
      completedInterviews,
      pendingAssessments,
      completedAssessments,
    });
    
  } catch (error) {
    console.error("Error fetching activity counts:", error);
    return NextResponse.json(
      { message: "Internal server error" }, 
      { status: 500 }
    );
  }
}