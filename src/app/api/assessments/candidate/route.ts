// src/app/api/assessments/candidate/route.ts

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
    
    // Get candidate's assessments
    const assessments = await prisma.codingAssessment.findMany({
      where: {
        candidateId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        score: true,
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    return NextResponse.json(assessments);
    
  } catch (error) {
    console.error("Error fetching candidate assessments:", error);
    return NextResponse.json(
      { message: "Internal server error" }, 
      { status: 500 }
    );
  }
}