// src/app/api/interviews/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      // Await the params object to get the id
      const { id } = await params;
      console.log("Fetching interview with ID:", id);
      
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
      
      // Find the interview with related data
      const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
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
    
    if (!interview) {
      console.log("Interview not found:", interviewId);
      return NextResponse.json(
        { message: "Interview not found" }, 
        { status: 404 }
      );
    }
    
    // Check if user is authorized to access this interview
    const isAuthorized = 
      interview.candidateId === session.user.id || 
      interview.interviewerId === session.user.id || 
      session.user.role === "ADMIN";
      
    if (!isAuthorized) {
      console.log("Access denied - user not authorized:", session.user.id);
      return NextResponse.json(
        { message: "Access denied" }, 
        { status: 403 }
      );
    }
    
    console.log("Interview found and access granted");
    return NextResponse.json(interview);
    
  } catch (error) {
    console.error("Error fetching interview:", error);
    return NextResponse.json(
      { message: "Failed to fetch interview details", error: String(error) }, 
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    });
    
    if (!interview) {
      return NextResponse.json(
        { message: "Interview not found" }, 
        { status: 404 }
      );
    }
    
    // Check if user is authorized to update this interview
    const isAuthorized = 
      interview.interviewerId === session.user.id || 
      session.user.role === "ADMIN";
      
    if (!isAuthorized) {
      return NextResponse.json(
        { message: "Access denied" }, 
        { status: 403 }
      );
    }
    
    // Get update data from request body
    const body = await req.json();
    const updateData: any = {};
    
    // List of allowed fields to update
    const allowedFields = ["title", "status", "feedback"];
    
    // Filter out any fields that are not allowed to be updated
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    
    // Update interview
    const updatedInterview = await prisma.interview.update({
      where: { id: interviewId },
      data: updateData,
    });
    
    return NextResponse.json(updatedInterview);
    
  } catch (error) {
    console.error("Error updating interview:", error);
    return NextResponse.json(
      { message: "Failed to update interview" }, 
      { status: 500 }
    );
  }
}