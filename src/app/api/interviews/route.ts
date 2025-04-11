// src/app/api/interviews/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    // Only admin or interviewers can create interviews
    if (session.user.role !== "ADMIN" && session.user.role !== "INTERVIEWER") {
      return NextResponse.json(
        { message: "Access denied. Must be an admin or interviewer." }, 
        { status: 403 }
      );
    }
    
    // Get interview data from request body
    const body = await req.json();
    const { title, type, candidateId, interviewerId, scheduledAt, duration } = body;
    
    // Validate required fields
    if (!title || !type || !candidateId || !interviewerId || !scheduledAt || !duration) {
      return NextResponse.json(
        { message: "Missing required fields" }, 
        { status: 400 }
      );
    }
    
    // Validate interview type
    if (type !== "TECHNICAL" && type !== "MANAGERIAL") {
      return NextResponse.json(
        { message: "Invalid interview type" }, 
        { status: 400 }
      );
    }
    
    // Create interview
    const interview = await prisma.interview.create({
      data: {
        title,
        type,
        status: "SCHEDULED",
        scheduledAt: new Date(scheduledAt),
        duration,
        candidateId,
        interviewerId,
      },
    });
    
    return NextResponse.json(
      { message: "Interview scheduled successfully", interview }, 
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Error creating interview:", error);
    return NextResponse.json(
      { message: "Failed to schedule interview" }, 
      { status: 500 }
    );
  }
}

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
    
    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");
    
    // Build filter object
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (type) {
      filter.type = type;
    }
    
    // Apply role-based filtering
    if (session.user.role === "CANDIDATE") {
      filter.candidateId = session.user.id;
    } else if (session.user.role === "INTERVIEWER") {
      filter.interviewerId = session.user.id;
    }
    // Admin can see all interviews, so no additional filter needed
    
    // Get interviews
    const interviews = await prisma.interview.findMany({
      where: filter,
      orderBy: {
        scheduledAt: 'asc',
      },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        interviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(interviews);
    
  } catch (error) {
    console.error("Error fetching interviews:", error);
    return NextResponse.json(
      { message: "Failed to fetch interviews" }, 
      { status: 500 }
    );
  }
}