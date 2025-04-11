// src/app/api/videosdk/token/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getVideoSDKToken } from "@/lib/videosdk";

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
    
    // Generate token
    const token = await getVideoSDKToken();
    
    return NextResponse.json({ token });
    
  } catch (error) {
    console.error("Error generating VideoSDK token:", error);
    return NextResponse.json(
      { message: "Failed to generate token" }, 
      { status: 500 }
    );
  }
}