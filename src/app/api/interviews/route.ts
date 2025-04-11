import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Get current session
    console.log("Creating interview - checking authentication");
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("Unauthorized - no session");
      return NextResponse.json(
        { message: "Unauthorized" }, 
        { status: 401 }
      );
    }
    
    // Only admin or interviewers can create interviews
    if (session.user.role !== "ADMIN" && session.user.role !== "INTERVIEWER") {
      console.log("Access denied - not admin or interviewer");
      return NextResponse.json(
        { message: "Access denied. Must be an admin or interviewer." }, 
        { status: 403 }
      );
    }
    
    // Get interview data from request body
    const body = await req.json();
    console.log("Request body:", body);
    
    const { title, type, candidateId, interviewerId, scheduledAt, duration } = body;
    
    // Validate required fields
    if (!title || !type || !candidateId || !interviewerId || !scheduledAt || !duration) {
      console.log("Missing required fields");
      return NextResponse.json(
        { message: "Missing required fields", 
          required: { title, type, candidateId, interviewerId, scheduledAt, duration } 
        }, 
        { status: 400 }
      );
    }
    
    // Validate interview type
    if (type !== "TECHNICAL" && type !== "MANAGERIAL") {
      console.log("Invalid interview type:", type);
      return NextResponse.json(
        { message: "Invalid interview type" }, 
        { status: 400 }
      );
    }
    
    // Verify that the candidate exists
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId, role: "CANDIDATE" }
    });
    
    if (!candidate) {
      console.log("Candidate not found:", candidateId);
      return NextResponse.json(
        { message: "Candidate not found" }, 
        { status: 404 }
      );
    }
    
    // Verify that the interviewer exists
    const interviewer = await prisma.user.findUnique({
      where: { id: interviewerId, role: "INTERVIEWER" }
    });
    
    if (!interviewer) {
      console.log("Interviewer not found:", interviewerId);
      return NextResponse.json(
        { message: "Interviewer not found" }, 
        { status: 404 }
      );
    }
    
    // Convert scheduledAt to Date if it's a string
    const scheduledDate = new Date(scheduledAt);
    
    // Check if date is valid
    if (isNaN(scheduledDate.getTime())) {
      console.log("Invalid date:", scheduledAt);
      return NextResponse.json(
        { message: "Invalid date format" }, 
        { status: 400 }
      );
    }
    
    // Validate duration
    const durationNumber = Number(duration);
    if (isNaN(durationNumber) || durationNumber < 15 || durationNumber > 120) {
      console.log("Invalid duration:", duration);
      return NextResponse.json(
        { message: "Duration must be between 15 and 120 minutes" }, 
        { status: 400 }
      );
    }
    
    console.log("Creating interview with data:", {
      title,
      type,
      candidateId,
      interviewerId,
      scheduledAt: scheduledDate,
      duration: durationNumber
    });
    
    // Create interview
    const interview = await prisma.interview.create({
      data: {
        title,
        type,
        status: "SCHEDULED",
        scheduledAt: scheduledDate,
        duration: durationNumber,
        candidateId,
        interviewerId,
      },
    });
    
    console.log("Interview created successfully:", interview.id);
    
    return NextResponse.json(
      { message: "Interview scheduled successfully", interview }, 
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Error creating interview:", error);
    return NextResponse.json(
      { message: "Failed to schedule interview", error: String(error) }, 
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
    const candidateId = url.searchParams.get("candidateId");
    
    // Build filter object
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (candidateId) {
      filter.candidateId = candidateId;
    } else {
      // Apply role-based filtering if candidateId is not explicitly provided
      if (session.user.role === "CANDIDATE") {
        filter.candidateId = session.user.id;
      } else if (session.user.role === "INTERVIEWER") {
        filter.interviewerId = session.user.id;
      }
      // Admin can see all interviews, so no additional filter needed
    }
    
    console.log("Interview filter:", filter);
    
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
    
    console.log(`Returning ${interviews.length} interviews`);
    
    return NextResponse.json(interviews);
    
  } catch (error) {
    console.error("Error fetching interviews:", error);
    return NextResponse.json(
      { message: "Failed to fetch interviews" }, 
      { status: 500 }
    );
  }
}