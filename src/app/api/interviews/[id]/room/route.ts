// src/app/api/interviews/[id]/room/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createVideoSDKRoom } from "@/lib/videosdk";

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
        roomId: true,
      },
    });
    
    if (!interview) {
      return NextResponse.json(
        { message: "Interview not found" }, 
        { status: 404 }
      );
    }
    
    // Check if user is the interviewer or the candidate for this interview
    const isAuthorized = 
      interview.interviewerId === session.user.id || 
      interview.candidateId === session.user.id;
      
    if (!isAuthorized && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Access denied" }, 
        { status: 403 }
      );
    }
    
    // Create room if it doesn't exist
    if (!interview.roomId) {
      const roomId = await createVideoSDKRoom();
      
      // Update interview with room ID
      await prisma.interview.update({
        where: { id: interviewId },
        data: { roomId },
      });
      
      return NextResponse.json({ roomId });
    }
    
    // Return existing room ID
    return NextResponse.json({ roomId: interview.roomId });
    
  } catch (error) {
    console.error("Error creating interview room:", error);
    return NextResponse.json(
      { message: "Failed to create interview room" }, 
      { status: 500 }
    );
  }
}