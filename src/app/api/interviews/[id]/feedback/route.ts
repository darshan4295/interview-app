// src/app/api/interviews/[id]/feedback/route.ts

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
    
    // Check if interview is completed
    if (interview.status !== "COMPLETED") {
      return NextResponse.json(
        { message: "Cannot provide feedback for an interview that is not completed" }, 
        { status: 400 }
      );
    }
    
    // Get feedback from request body
    const body = await req.json();
    const { feedback } = body;
    
    if (!feedback) {
      return NextResponse.json(
        { message: "Feedback is required" }, 
        { status: 400 }
      );
    }
    
    // Update interview with feedback
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        feedback,
      },
    });
    
    return NextResponse.json({ 
      message: "Feedback submitted successfully",
    });
    
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { message: "Failed to submit feedback" }, 
      { status: 500 }
    );
  }
}