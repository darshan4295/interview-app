// src/app/api/admin/users/route.ts

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
    
    // Check if user is an admin or interviewer
    if (session.user.role !== "ADMIN" && session.user.role !== "INTERVIEWER") {
      return NextResponse.json(
        { message: "Access denied. Must be an admin or interviewer." }, 
        { status: 403 }
      );
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const roleFilter = url.searchParams.get("role");
    const search = url.searchParams.get("search");
    
    // Build filter object
    const filter: any = {};
    
    if (roleFilter) {
      filter.role = roleFilter;
    }
    
    if (search) {
      filter.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Get users
    const users = await prisma.user.findMany({
      where: filter,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(users);
    
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" }, 
      { status: 500 }
    );
  }
}

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
    
    // Only admin can create users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Access denied. Must be an admin." }, 
        { status: 403 }
      );
    }
    
    // Get user data from request body
    const body = await req.json();
    const { name, email, password, role } = body;
    
    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: "Missing required fields" }, 
        { status: 400 }
      );
    }
    
    // Validate role
    if (role !== "CANDIDATE" && role !== "INTERVIEWER" && role !== "ADMIN") {
      return NextResponse.json(
        { message: "Invalid role" }, 
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" }, 
        { status: 409 }
      );
    }
    
    // Hash the password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json(
      { message: "User created successfully", user: userWithoutPassword }, 
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Failed to create user" }, 
      { status: 500 }
    );
  }
}