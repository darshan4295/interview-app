// src/app/api/reports/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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
    
    const candidateId = params.id;
    
    // Determine access permissions
    const isCandidate = session.user.id === candidateId;
    const isAdmin = session.user.role === "ADMIN";
    
    // Only the candidate themselves or an admin can access the report
    if (!isCandidate && !isAdmin) {
      return NextResponse.json(
        { message: "Access denied" }, 
        { status: 403 }
      );
    }
    
    // Get the final report
    const report = await prisma.finalReport.findUnique({
      where: { candidateId },
    });
    
    if (!report) {
      return NextResponse.json(
        { message: "Report not found" }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(report);
    
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { message: "Failed to fetch report" }, 
      { status: 500 }
    );
  }
}