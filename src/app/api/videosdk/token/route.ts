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
    
    // Generate token with better error handling
    try {
      const token = await getVideoSDKToken();
      return NextResponse.json({ token });
    } catch (tokenError) {
      console.error("Error in token generation:", tokenError);
      
      // For development, return a mock token if actual generation fails
      if (process.env.NODE_ENV !== 'production') {
        console.log("Using fallback mock token for development");
        return NextResponse.json({ 
          token: "mock_video_sdk_token_for_development",
          message: "Using mock token - VideoSDK API unavailable"
        });
      }
      
      throw tokenError;
    }
  } catch (error) {
    console.error("Error generating VideoSDK token:", error);
    return NextResponse.json(
      { message: "Failed to generate token", error: String(error) }, 
      { status: 500 }
    );
  }
}