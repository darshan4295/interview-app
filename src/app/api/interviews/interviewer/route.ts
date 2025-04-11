// src/app/api/interviews/interviewer/route.ts

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
    
    console.log("Fetching interviews for interviewer:", session.user.id);
    
    // Get interviews assigned to this interviewer
    const interviews = await prisma.interview.findMany({
      where: {
        interviewerId: session.user.id,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        scheduledAt: true,
        roomId: true,
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    console.log(`Found ${interviews.length} interviews for interviewer`);
    
    // Make sure the response is an array even if prisma returns null
    return NextResponse.json(interviews || []);
    
  } catch (error) {
    console.error("Error fetching interviewer interviews:", error);
    return NextResponse.json(
      { message: "Internal server error" }, 
      { status: 500 }
    );
  }
}