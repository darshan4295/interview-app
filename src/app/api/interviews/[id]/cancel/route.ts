// src/app/api/interviews/[id]/cancel/route.ts

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
    
    // Check if user is authorized to cancel this interview
    const isAuthorized = 
      interview.interviewerId === session.user.id || 
      interview.candidateId === session.user.id || 
      session.user.role === "ADMIN";
      
    if (!isAuthorized) {
      return NextResponse.json(
        { message: "Access denied" }, 
        { status: 403 }
      );
    }
    
    // Check if interview is already cancelled or completed
    if (interview.status !== "SCHEDULED") {
      return NextResponse.json(
        { message: "Cannot cancel an interview that is not scheduled" }, 
        { status: 400 }
      );
    }
    
    // Update interview status to cancelled
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        status: "CANCELLED",
      },
    });
    
    return NextResponse.json({ 
      message: "Interview cancelled successfully",
    });
    
  } catch (error) {
    console.error("Error cancelling interview:", error);
    return NextResponse.json(
      { message: "Failed to cancel interview" }, 
      { status: 500 }
    );
  }
}