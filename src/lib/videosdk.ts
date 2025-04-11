// src/lib/videosdk.ts

/**
 * Utility functions for VideoSDK.live integration
 */

// Function to generate a room ID
export const generateRoomId = (): string => {
    return `interview-${Math.random().toString(36).substring(2, 11)}`;
  };
  
  // Function to create a VideoSDK room
  export const createVideoSDKRoom = async (): Promise<string> => {
    try {
      const API_ENDPOINT = `https://api.videosdk.live/v2/rooms`;
      
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `${process.env.VIDEOSDK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create room');
      }
      
      return data.roomId;
    } catch (error) {
      console.error('Error creating VideoSDK room:', error);
      throw error;
    }
  };
  
  // Function to get VideoSDK token
  export const getVideoSDKToken = async (): Promise<string> => {
    try {
      const API_ENDPOINT = `https://api.videosdk.live/v2/token`;
      
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
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate token');
      }
      
      return data.token;
    } catch (error) {
      console.error('Error generating VideoSDK token:', error);
      throw error;
    }
  };
  
  // Function to validate a room ID
  export const validateRoomId = async (roomId: string): Promise<boolean> => {
    try {
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