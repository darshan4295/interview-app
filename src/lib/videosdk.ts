// src/lib/videosdk.ts

/**
 * Utility functions for VideoSDK.live integration
 */

// Function to generate a room ID
export const generateRoomId = (): string => {
  return `interview-${Math.random().toString(36).substring(2, 11)}`;
};

  
export const createVideoSDKRoom = async (): Promise<string> => {
  try {
    // For development, let's generate a random room ID if API call fails
    // This allows testing even without VideoSDK API access
    if (!process.env.VIDEOSDK_API_KEY || !process.env.VIDEOSDK_SECRET_KEY) {
      console.log("Using mock VideoSDK room ID due to missing API keys");
      return generateRoomId();
    }
    
    const API_ENDPOINT = `https://api.videosdk.live/v2/rooms`;
    console.log("Creating VideoSDK room via API");
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `${process.env.VIDEOSDK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Check if response is OK before parsing JSON
    if (!response.ok) {
      const textError = await response.text();
      console.error("VideoSDK API error response:", textError);
      throw new Error(`Failed to create room: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("VideoSDK room created:", data);
    
    return data.roomId;
  } catch (error) {
    console.error('Error creating VideoSDK room:', error);
    // Fallback to local generation for development
    return generateRoomId();
  }
};

  
export const getVideoSDKToken = async (): Promise<string> => {
  try {
    // For development, let's return a mock token if API call fails
    // This allows testing even without VideoSDK API access
    if (!process.env.VIDEOSDK_API_KEY || !process.env.VIDEOSDK_SECRET_KEY) {
      console.log("Using mock VideoSDK token due to missing API keys");
      return "mock_video_sdk_token_for_development";
    }
    
    const API_ENDPOINT = `https://api.videosdk.live/v2/token`;
    console.log("Getting VideoSDK token via API");
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `${process.env.VIDEOSDK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Generate a token that's valid for 2 hours
        expire: Math.floor(Date.now() / 1000) + 2 * 60 * 60,
      }),
    });
    
    // Check if response is OK before parsing JSON
    if (!response.ok) {
      const textError = await response.text();
      console.error("VideoSDK token API error response:", textError);
      throw new Error(`Failed to generate token: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("VideoSDK token generated successfully");
    
    return data.token;
  } catch (error) {
    console.error('Error generating VideoSDK token:', error);
    // Fallback to mock token for development
    return "mock_video_sdk_token_for_development";
  }
};
  
// Function to validate a room ID
export const validateRoomId = async (roomId: string): Promise<boolean> => {
  try {
    // For development, always return true if API keys are missing
    if (!process.env.VIDEOSDK_API_KEY || !process.env.VIDEOSDK_SECRET_KEY) {
      return true;
    }
    
    const API_ENDPOINT = `https://api.videosdk.live/v2/rooms/${roomId}`;
    
    const response = await fetch(API_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `${process.env.VIDEOSDK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error validating room ID:', error);
    return false;
  }
};