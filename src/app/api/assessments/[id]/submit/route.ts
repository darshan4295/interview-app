// src/app/api/assessments/[id]/submit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { analyzeCodingSubmission } from "@/lib/gemini";

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
    
    const assessmentId = params.id;
    
    // Find the assessment
    const assessment = await prisma.codingAssessment.findUnique({
      where: { id: assessmentId },
      select: {
        id: true,
        candidateId: true,
        status: true,
        requirements: true,
      },
    });
    
    if (!assessment) {
      return NextResponse.json(
        { message: "Assessment not found" }, 
        { status: 404 }
      );
    }
    
    // Check if user is the candidate for this assessment
    if (assessment.candidateId !== session.user.id) {
      return NextResponse.json(
        { message: "Access denied" }, 
        { status: 403 }
      );
    }
    
    // Check if assessment is still pending
    if (assessment.status !== "PENDING") {
      return NextResponse.json(
        { message: "Assessment has already been submitted" }, 
        { status: 400 }
      );
    }
    
    // Get code from request body
    const body = await req.json();
    const { code } = body;
    
    if (!code) {
      return NextResponse.json(
        { message: "Code submission is required" }, 
        { status: 400 }
      );
    }
    
    // Analyze code using Gemini AI
    const analysisResult = await analyzeCodingSubmission(code, assessment.requirements);
    
    // Update assessment with code submission and analysis
    await prisma.codingAssessment.update({
      where: { id: assessmentId },
      data: {
        codeSubmission: code,
        aiAnalysis: analysisResult,
        status: "SUBMITTED",
      },
    });
    
    return NextResponse.json({ 
      message: "Assessment submitted successfully",
      analysis: analysisResult,
    });
    
  } catch (error) {
    console.error("Error submitting assessment:", error);
    return NextResponse.json(
      { message: "Failed to submit assessment" }, 
      { status: 500 }
    );
  }
}