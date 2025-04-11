// src/app/api/admin/users/[id]/route.ts

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
    
    // Check permissions - admins and interviewers can view user details
    if (session.user.role !== "ADMIN" && session.user.role !== "INTERVIEWER") {
      return NextResponse.json(
        { message: "Access denied" }, 
        { status: 403 }
      );
    }
    
    const userId = params.id;
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
    
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Failed to fetch user" }, 
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
    
    // Only admin can update users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Access denied. Must be an admin." }, 
        { status: 403 }
      );
    }
    
    const userId = params.id;
    
    // Get update data
    const body = await req.json();
    const { name, email, role } = body;
    
    // Build update object
    const updateData: Record<string, any> = {};
    
    if (name) {
      updateData.name = name;
    }
    
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: {
            id: userId,
          },
        },
      });
      
      if (existingUser) {
        return NextResponse.json(
          { message: "Email already in use" }, 
          { status: 400 }
        );
      }
      
      updateData.email = email;
    }
    
    if (role) {
      // Validate role
      if (!["CANDIDATE", "INTERVIEWER", "ADMIN"].includes(role)) {
        return NextResponse.json(
          { message: "Invalid role" }, 
          { status: 400 }
        );
      }
      
      updateData.role = role;
    }
    
    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json(user);
    
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Failed to update user" }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    // Only admin can delete users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Access denied. Must be an admin." }, 
        { status: 403 }
      );
    }
    
    const userId = params.id;
    
    // Prevent admin from deleting their own account
    if (userId === session.user.id) {
      return NextResponse.json(
        { message: "Cannot delete your own account" }, 
        { status: 400 }
      );
    }
    
    // Delete related records (we need to handle this manually due to foreign key constraints)
    
    // Delete any final reports
    await prisma.finalReport.deleteMany({
      where: { candidateId: userId },
    });
    
    // Delete any coding assessments where this user is a candidate
    await prisma.codingAssessment.deleteMany({
      where: { candidateId: userId },
    });
    
    // Update any coding assessments where this user is a reviewer (set reviewerId to null)
    await prisma.codingAssessment.updateMany({
      where: { reviewerId: userId },
      data: { reviewerId: null },
    });
    
    // Delete any interviews where this user is a candidate or interviewer
    await prisma.interview.deleteMany({
      where: {
        OR: [
          { candidateId: userId },
          { interviewerId: userId },
        ],
      },
    });
    
    // Finally, delete the user
    await prisma.user.delete({
      where: { id: userId },
    });
    
    return NextResponse.json({ 
      message: "User deleted successfully",
    });
    
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Failed to delete user" }, 
      { status: 500 }
    );
  }
}