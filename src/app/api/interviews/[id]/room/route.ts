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
    // Await the params object to get the id
    const { id } = await params;
    console.log("Creating/getting room for interview:", id);
    
    // Get current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("Unauthorized - no session");
      return NextResponse.json(
        { message: "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    const interviewId = id;
    
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
      console.log("Interview not found:", interviewId);
      return NextResponse.json(
        { message: "Interview not found" }, 
        { status: 404 }
      );
    }
    
    // Check if user is authorized to access this interview
    const isAuthorized = 
      interview.interviewerId === session.user.id || 
      interview.candidateId === session.user.id ||
      session.user.role === "ADMIN";
      
    if (!isAuthorized) {
      console.log("Access denied - user not authorized:", session.user.id);
      return NextResponse.json(
        { message: "Access denied" }, 
        { status: 403 }
      );
    }
    
    // If the interview already has a room ID, return it
    if (interview.roomId) {
      console.log("Using existing room ID:", interview.roomId);
      return NextResponse.json({ roomId: interview.roomId });
    }
    
    // Create a new room using VideoSDK
    try {
      console.log("Creating new VideoSDK room");
      const roomId = await createVideoSDKRoom();
      console.log("Created room with ID:", roomId);
      
      // Update interview with room ID
      await prisma.interview.update({
        where: { id: interviewId },
        data: { roomId },
      });
      
      return NextResponse.json({ roomId });
    } catch (videoSdkError) {
      console.error("Error creating VideoSDK room:", videoSdkError);
      
      // If we can't create a room with VideoSDK, generate a fallback room ID
      const fallbackRoomId = `interview-${Math.random().toString(36).substring(2, 11)}`;
      console.log("Using fallback room ID:", fallbackRoomId);
      
      // Update interview with fallback room ID
      await prisma.interview.update({
        where: { id: interviewId },
        data: { roomId: fallbackRoomId },
      });
      
      return NextResponse.json({ roomId: fallbackRoomId });
    }
    
  } catch (error) {
    console.error("Error creating/getting interview room:", error);
    return NextResponse.json(
      { message: "Failed to create interview room", error: String(error) }, 
      { status: 500 }
    );
  }
}