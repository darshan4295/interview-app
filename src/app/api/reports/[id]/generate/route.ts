// src/app/api/reports/[id]/generate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateFinalReport } from "@/lib/gemini";

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
    
    // Only admin can generate reports
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Access denied. Must be an admin." }, 
        { status: 403 }
      );
    }
    
    const candidateId = params.id;
    
    // Check if user exists and is a candidate
    const candidate = await prisma.user.findUnique({
      where: {
        id: candidateId,
        role: "CANDIDATE",
      },
    });
    
    if (!candidate) {
      return NextResponse.json(
        { message: "Candidate not found" }, 
        { status: 404 }
      );
    }
    
    // Get report data from request body
    const body = await req.json();
    const { technicalInterview, codingAssessment, managerialInterview } = body;
    
    // Validate required fields
    if (!technicalInterview || !codingAssessment || !managerialInterview) {
      return NextResponse.json(
        { message: "Missing required assessment data" }, 
        { status: 400 }
      );
    }
    
    // Generate final report using Gemini AI
    const reportData = await generateFinalReport(
      technicalInterview,
      codingAssessment,
      managerialInterview
    );
    
    // Check if a report already exists for this candidate
    const existingReport = await prisma.finalReport.findUnique({
      where: { candidateId },
    });
    
    let report;
    
    if (existingReport) {
      // Update existing report
      report = await prisma.finalReport.update({
        where: { candidateId },
        data: {
          interviewScore: reportData.technicalScore,
          codingScore: reportData.codingScore,
          managerialScore: reportData.managerialScore,
          overallRating: reportData.overallRating,
          strengths: reportData.strengths,
          weaknesses: reportData.weaknesses,
          recommendation: reportData.recommendation,
          suggestedHike: reportData.suggestedHike,
        },
      });
    } else {
      // Create new report
      report = await prisma.finalReport.create({
        data: {
          candidateId,
          interviewScore: reportData.technicalScore,
          codingScore: reportData.codingScore,
          managerialScore: reportData.managerialScore,
          overallRating: reportData.overallRating,
          strengths: reportData.strengths,
          weaknesses: reportData.weaknesses,
          recommendation: reportData.recommendation,
          suggestedHike: reportData.suggestedHike,
        },
      });
    }
    
    return NextResponse.json(report);
    
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { message: "Failed to generate report" }, 
      { status: 500 }
    );
  }
}