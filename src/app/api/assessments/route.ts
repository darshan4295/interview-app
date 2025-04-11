// src/app/api/assessments/route.ts

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
    
    // Only admin or interviewers can create assessments
    if (session.user.role !== "ADMIN" && session.user.role !== "INTERVIEWER") {
      return NextResponse.json(
        { message: "Access denied. Must be an admin or interviewer." }, 
        { status: 403 }
      );
    }
    
    // Get assessment data from request body
    const body = await req.json();
    const { title, description, requirements, candidateId } = body;
    
    // Validate required fields
    if (!title || !description || !requirements || !candidateId) {
      return NextResponse.json(
        { message: "Missing required fields" }, 
        { status: 400 }
      );
    }
    
    // Create assessment
    const assessment = await prisma.codingAssessment.create({
      data: {
        title,
        description,
        requirements,
        status: "PENDING",
        candidateId,
      },
    });
    
    return NextResponse.json(
      { message: "Assessment created successfully", assessment }, 
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Error creating assessment:", error);
    return NextResponse.json(
      { message: "Failed to create assessment" }, 
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
    
    // Build filter object
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    // Apply role-based filtering
    if (session.user.role === "CANDIDATE") {
      filter.candidateId = session.user.id;
    } else if (session.user.role === "INTERVIEWER") {
      filter.OR = [
        { reviewerId: session.user.id },
        { reviewerId: null, status: "SUBMITTED" },
      ];
    }
    // Admin can see all assessments, so no additional filter needed
    
    // Get assessments
    const assessments = await prisma.codingAssessment.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
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
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(assessments);
    
  } catch (error) {
    console.error("Error fetching assessments:", error);
    return NextResponse.json(
      { message: "Failed to fetch assessments" }, 
      { status: 500 }
    );
  }
}