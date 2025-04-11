// src/app/api/interviews/[id]/transcript/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { analyzeTranscript } from "@/lib/gemini";

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
        type: true,
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
    
    // Get transcript from request body
    const body = await req.json();
    const { transcript } = body;
    
    if (!transcript) {
      return NextResponse.json(
        { message: "Transcript is required" }, 
        { status: 400 }
      );
    }
    
    // Analyze transcript using Gemini AI
    const analysisResult = await analyzeTranscript(transcript, interview.type);
    
    // Update interview with transcript and analysis
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        transcript,
        aiAnalysis: analysisResult,
      },
    });
    
    return NextResponse.json({ 
      message: "Transcript saved and analyzed successfully",
      analysis: analysisResult,
    });
    
  } catch (error) {
    console.error("Error saving transcript:", error);
    return NextResponse.json(
      { message: "Failed to save transcript" }, 
      { status: 500 }
    );
  }
}

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
    
    const interviewId = params.id;
    
    // Find the interview
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      select: {
        id: true,
        candidateId: true,
        interviewerId: true,
        transcript: true,
        aiAnalysis: true,
      },
    });
    
    if (!interview) {
      return NextResponse.json(
        { message: "Interview not found" }, 
        { status: 404 }
      );
    }
    
    // Check if user is authorized to access the transcript
    const isAuthorized = 
      interview.candidateId === session.user.id ||
      interview.interviewerId === session.user.id || 
      session.user.role === "ADMIN";
      
    if (!isAuthorized) {
      return NextResponse.json(
        { message: "Access denied" }, 
        { status: 403 }
      );
    }
    
    // Check if transcript exists
    if (!interview.transcript) {
      return NextResponse.json(
        { message: "Transcript not available" }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      transcript: interview.transcript,
      analysis: interview.aiAnalysis,
    });
    
  } catch (error) {
    console.error("Error retrieving transcript:", error);
    return NextResponse.json(
      { message: "Failed to retrieve transcript" }, 
      { status: 500 }
    );
  }
}