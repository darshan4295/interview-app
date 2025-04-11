// src/app/api/assessments/[id]/review/route.ts

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
    
    // Check if user is an interviewer or admin
    if (session.user.role !== "INTERVIEWER" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Access denied. Must be an interviewer or admin." }, 
        { status: 403 }
      );
    }
    
    const assessmentId = params.id;
    
    // Find the assessment
    const assessment = await prisma.codingAssessment.findUnique({
      where: { id: assessmentId },
      select: {
        id: true,
        status: true,
        reviewerId: true,
      },
    });
    
    if (!assessment) {
      return NextResponse.json(
        { message: "Assessment not found" }, 
        { status: 404 }
      );
    }
    
    // Check if assessment has already been reviewed by someone else
    if (assessment.status === "REVIEWED" && assessment.reviewerId && assessment.reviewerId !== session.user.id) {
      return NextResponse.json(
        { message: "Assessment has already been reviewed by another interviewer" }, 
        { status: 400 }
      );
    }
    
    // Get review data from request body
    const body = await req.json();
    const { score, feedback } = body;
    
    if (score === undefined || !feedback) {
      return NextResponse.json(
        { message: "Score and feedback are required" }, 
        { status: 400 }
      );
    }
    
    // Update assessment with review
    await prisma.codingAssessment.update({
      where: { id: assessmentId },
      data: {
        score,
        feedback,
        reviewerId: session.user.id,
        status: "REVIEWED",
      },
    });
    
    return NextResponse.json({ 
      message: "Assessment reviewed successfully",
    });
    
  } catch (error) {
    console.error("Error reviewing assessment:", error);
    return NextResponse.json(
      { message: "Failed to review assessment" }, 
      { status: 500 }
    );
  }
}