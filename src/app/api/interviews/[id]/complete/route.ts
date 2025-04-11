// src/app/api/interviews/[id]/complete/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    const interviewId = params.id;
    
    // Find the interview
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: {
        id: true,
        status: true,
        candidateId: true,
        interviewerId: true,
      },
    });
    
    if (!interview) {
      return NextResponse.json(
        { message: "Interview not found" }, 
        { status: 404 }
      );
    }
    
    // Check if user is the interviewer or admin
    const isAuthorized = 
      interview.interviewerId === session.user.id || 
      session.user.role === "ADMIN";
      
    if (!isAuthorized) {
      return NextResponse.json(
        { message: "Access denied" }, 
        { status: 403 }
      );
    }
    
    // Check if interview is already completed
    if (interview.status === "COMPLETED") {
      return NextResponse.json(
        { message: "Interview is already completed" }, 
        { status: 400 }
      );
    }
    
    // Update interview status to completed
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: "COMPLETED",
      },
    });
    
    return NextResponse.json({ 
      message: "Interview marked as completed",
    });
    
  } catch (error) {
    console.error("Error completing interview:", error);
    return NextResponse.json(
      { message: "Failed to complete interview" }, 
      { status: 500 }
    );
  }
}