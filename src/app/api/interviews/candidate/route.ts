// src/app/api/interviews/candidate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    // Check if user is a candidate
    if (session.user.role !== "CANDIDATE") {
      return NextResponse.json(
        { message: "Access denied. Must be a candidate." }, 
        { status: 403 }
      );
    }
    
    // Get candidate's interviews
    const interviews = await prisma.interview.findMany({
      where: {
        candidateId: session.user.id,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        scheduledAt: true,
        roomId: true,
        interviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return NextResponse.json(interviews);
    
  } catch (error) {
    console.error("Error fetching candidate interviews:", error);
    return NextResponse.json(
      { message: "Internal server error" }, 
      { status: 500 }
    );
  }
}