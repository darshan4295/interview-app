// src/app/api/assessments/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
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
        title: true,
        description: true,
        requirements: true,
        codeSubmission: true,
        aiAnalysis: true,
        status: true,
        score: true,
        feedback: true,
        candidateId: true,
        reviewerId: true,
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    if (!assessment) {
      return NextResponse.json(
        { message: "Assessment not found" }, 
        { status: 404 }
      );
    }
    
    // Check if user is authorized to view this assessment
    const isAuthorized = 
      assessment.candidateId === session.user.id || // Candidate
      assessment.reviewerId === session.user.id || // Reviewer
      session.user.role === "ADMIN" || // Admin
      (session.user.role === "INTERVIEWER" && assessment.status === "SUBMITTED" && !assessment.reviewerId); // Any interviewer can see submitted assessments without a reviewer
      
    if (!isAuthorized) {
      return NextResponse.json(
        { message: "Access denied" }, 
        { status: 403 }
      );
    }
    
    // Return assessment data based on user role
    if (session.user.role === "CANDIDATE" && session.user.id === assessment.candidateId) {
      // For candidates, only return full details if the assessment is reviewed
      if (assessment.status === "REVIEWED") {
        return NextResponse.json(assessment);
      } else {
        // For pending or submitted assessments, don't include AI analysis
        const { aiAnalysis, ...assessmentWithoutAnalysis } = assessment;
        return NextResponse.json(assessmentWithoutAnalysis);
      }
    } else {
      // For interviewers and admins, return all details
      return NextResponse.json(assessment);
    }
    
  } catch (error) {
    console.error("Error fetching assessment:", error);
    return NextResponse.json(
      { message: "Failed to fetch assessment" }, 
      { status: 500 }
    );
  }
}