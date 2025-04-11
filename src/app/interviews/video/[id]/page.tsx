// src/app/interviews/video/[id]/page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MeetingProvider, useMeeting, useParticipant } from "@videosdk.live/react-sdk";

type InterviewDetails = {
  id: string;
  title: string;
  type: "TECHNICAL" | "MANAGERIAL";
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  candidateName: string;
  interviewerName: string;
  isCandidate: boolean;
  isInterviewer: boolean;
};

export default function VideoCallPage({ params }: { params: { id: string } }) {
  // Safely access the ID from params
  const interviewId = params?.id;
  
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [interviewDetails, setInterviewDetails] = useState<InterviewDetails | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const transcriptRef = useRef<string>("");
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [useMockMode, setUseMockMode] = useState<boolean>(false);

  useEffect(() => {
    // Only proceed if we have both the interviewId and session
    if (!interviewId || !session?.user?.id) {
      if (!interviewId) {
        setError("Interview ID is missing");
      } else if (!session?.user?.id) {
        setError("You must be logged in to access this page");
      }
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch interview details - with error logging
        console.log("Fetching interview details for ID:", interviewId);
        try {
          const interviewResponse = await fetch(`/api/interviews/${interviewId}`);
          console.log("Interview response status:", interviewResponse.status);
          
          if (!interviewResponse.ok) {
            const errorData = await interviewResponse.json().catch(() => ({}));
            console.error("Error response:", errorData);
            throw new Error(errorData.message || "Failed to fetch interview details");
          }
          
          const interviewData = await interviewResponse.json();
          console.log("Interview data received:", interviewData);
          
          // Check if the user is authorized to join this interview
          const isCandidate = interviewData.candidateId === session.user.id;
          const isInterviewer = interviewData.interviewerId === session.user.id;
          const isAdmin = session.user.role === "ADMIN";
          
          if (!isCandidate && !isInterviewer && !isAdmin) {
            setError("You are not authorized to join this interview");
            setLoading(false);
            return;
          }

          // Check if candidate and interviewer data exists
          if (!interviewData.candidate || !interviewData.interviewer) {
            console.error("Missing candidate or interviewer data:", interviewData);
            setError("Interview data is incomplete");
            setLoading(false);
            return;
          }
          
          setInterviewDetails({
            id: interviewData.id,
            title: interviewData.title,
            type: interviewData.type,
            status: interviewData.status,
            candidateName: interviewData.candidate.name,
            interviewerName: interviewData.interviewer.name,
            isCandidate,
            isInterviewer,
          });
        } catch (error) {
          console.error("Error fetching interview:", error);
          setError("Failed to fetch interview details. Please try again.");
          setLoading(false);
          return;
        }

        // Create/get room ID
        try {
          console.log("Creating/getting room for interview:", interviewId);
          const roomResponse = await fetch(`/api/interviews/${interviewId}/room`, {
            method: "POST",
          });
          
          if (!roomResponse.ok) {
            const errorData = await roomResponse.json().catch(() => ({}));
            console.error("Room error response:", errorData);
            throw new Error(errorData.message || "Failed to create interview room");
          }
          
          const roomData = await roomResponse.json();
          console.log("Room data received:", roomData);
          setRoomId(roomData.roomId);
        } catch (error) {
          console.error("Error creating/getting room:", error);
          setError("Failed to set up video call room");
          setLoading(false);
          return;
        }

        // Get VideoSDK token
        try {
          console.log("Fetching VideoSDK token");
          const tokenResponse = await fetch("/api/videosdk/token");
          
          if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json().catch(() => ({}));
            console.error("Token error response:", errorData);
            // Don't throw here - instead set useMockMode to true
            console.warn("Using mock mode due to token error");
            setUseMockMode(true);
          } else {
            const tokenData = await tokenResponse.json();
            console.log("Token received:", tokenData.token ? "Valid token" : "No token");
            setToken(tokenData.token);
            
            // Use mock mode if no token was provided
            if (!tokenData.token) {
              console.warn("Using mock mode due to missing token");
              setUseMockMode(true);
            }
          }
        } catch (error) {
          console.error("Error fetching token:", error);
          console.warn("Using mock mode due to token error");
          setUseMockMode(true);
        }

        // Gather debug info
        setDebugInfo({
          interviewId,
          userId: session.user.id,
          userRole: session.user.role,
          userName: session.user.name,
          roomId: roomId,
          hasToken: !!token,
          mockMode: useMockMode
        });

        setLoading(false);
      } catch (error) {
        console.error("Error in overall setup:", error);
        setError("Failed to set up video call");
        setLoading(false);
      }
    };

    fetchData();
  }, [session, interviewId]);

  const saveTranscript = async () => {
    if (!interviewId) return;
    
    try {
      await fetch(`/api/interviews/${interviewId}/transcript`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript: transcriptRef.current }),
      });
    } catch (error) {
      console.error("Error saving transcript:", error);
    }
  };

  const endInterview = async () => {
    if (!interviewId) return;
    
    try {
      await saveTranscript();
      
      await fetch(`/api/interviews/${interviewId}/complete`, {
        method: "POST",
      });
      
      // Redirect based on user role
      if (interviewDetails?.isInterviewer) {
        router.push(`/dashboard/interviewer/interviews/${interviewId}/feedback`);
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error ending interview:", error);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    // In a real implementation, we would start speech recognition here
    // For simplicity, we're simulating transcript generation
    simulateTranscript();
  };

  const stopRecording = () => {
    setIsRecording(false);
    // In a real implementation, we would stop speech recognition here
  };

  // Simulating transcript generation for demo purposes
  const simulateTranscript = () => {
    const sampleQuestions = [
      "Tell me about your background and experience.",
      "What are your strengths and weaknesses?",
      "Can you describe a challenging project you worked on?",
      "How do you handle pressure and tight deadlines?",
      "Where do you see yourself in five years?",
    ];

    const sampleAnswers = [
      "I have a background in computer science with 5 years of experience...",
      "My strengths include problem-solving and teamwork. As for weaknesses...",
      "I worked on a complex project where we had to migrate a legacy system...",
      "I prioritize tasks and maintain clear communication to handle pressure...",
      "In five years, I see myself having grown into a technical leadership role...",
    ];

    let questionIndex = 0;
    const interval = setInterval(() => {
      if (!isRecording) {
        clearInterval(interval);
        return;
      }

      if (questionIndex < sampleQuestions.length) {
        const newText = `Interviewer: ${sampleQuestions[questionIndex]}\n\nCandidate: ${sampleAnswers[questionIndex]}\n\n`;
        transcriptRef.current += newText;
        setTranscript(transcriptRef.current);
        questionIndex++;
      } else {
        clearInterval(interval);
      }
    }, 5000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Use mock mode if token is missing or if useMockMode was set due to errors
  const shouldUseMockMode = useMockMode || !token || !roomId;
  
  console.log("Video call render state:", {
    hasInterviewDetails: !!interviewDetails,
    hasToken: !!token,
    hasRoomId: !!roomId,
    useMockMode: shouldUseMockMode
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {shouldUseMockMode ? (
        // Mock video interface for development/fallback
        <div className="flex flex-col md:flex-row min-h-screen">
          <div className="flex-1 bg-gray-900 p-4">
            <div className="flex flex-col h-full">
              <div className="bg-gray-800 text-white p-3 rounded-t-md flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-xl font-semibold">{interviewDetails?.title || "Interview"}</h1>
                  <p className="text-sm text-gray-300">
                    {interviewDetails?.type === "TECHNICAL" ? "Technical" : "Managerial"} Interview (Mock Mode)
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={endInterview}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                  >
                    End Interview
                  </button>
                </div>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mock user video */}
                <div className="bg-gray-700 rounded-lg p-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-indigo-600 mx-auto flex items-center justify-center text-white text-2xl font-semibold">
                      {session?.user?.name?.charAt(0) || "Y"}
                    </div>
                    <p className="mt-2 text-white">You (Mock Mode)</p>
                    <p className="mt-1 text-gray-400 text-xs">Camera active</p>
                  </div>
                </div>
                
                {/* Mock other participant */}
                <div className="bg-gray-700 rounded-lg p-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-purple-600 mx-auto flex items-center justify-center text-white text-2xl font-semibold">
                      {interviewDetails?.isCandidate ? 
                        interviewDetails.interviewerName.charAt(0) : 
                        interviewDetails?.candidateName.charAt(0) || "?"}
                    </div>
                    <p className="mt-2 text-white">
                      {interviewDetails?.isCandidate ? 
                        interviewDetails.interviewerName : 
                        interviewDetails?.candidateName} (Simulated)
                    </p>
                    <p className="mt-1 text-gray-400 text-xs">Camera active</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-gray-800 p-3 rounded-b-md text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm">
                      Interviewer: <span className="font-semibold">{interviewDetails?.interviewerName || "Interviewer"}</span>
                    </p>
                    <p className="text-sm">
                      Candidate: <span className="font-semibold">{interviewDetails?.candidateName || "Candidate"}</span>
                    </p>
                  </div>
                  <div className="text-sm">
                    {interviewDetails?.isInterviewer && (
                      <p className="text-indigo-300">You are the interviewer</p>
                    )}
                    {interviewDetails?.isCandidate && (
                      <p className="text-indigo-300">You are the candidate</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Transcript section */}
          <div className="w-full md:w-1/3 bg-white p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Interview Transcript</h2>
              <div className="flex space-x-2">
                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="bg-red-600 text-white px-3 py-1 rounded-md flex items-center"
                  >
                    <span className="inline-block w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></span>
                    Stop Recording
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="bg-indigo-600 text-white px-3 py-1 rounded-md"
                  >
                    Start Recording
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 p-4 rounded-md">
              <pre className="whitespace-pre-wrap text-sm">{transcript}</pre>
            </div>
          </div>
        </div>
      ) : (
        // Real VideoSDK implementation
        <MeetingProvider
          config={{
            meetingId: roomId as string,
            micEnabled: true,
            webcamEnabled: true,
            name: session?.user?.name || "User",
            participantId: session?.user?.id, // Ensure unique participant IDs
          }}
          token={token as string}
          joinWithoutUserInteraction={true} // Auto-join when possible
        >
          <div className="flex flex-col md:flex-row min-h-screen">
            {/* Video conference section */}
            <div className="flex-1 bg-gray-900 p-4">
              <VideoConference
                interviewDetails={interviewDetails as InterviewDetails}
                onEndInterview={endInterview}
              />
            </div>
            
            {/* Transcript section */}
            <div className="w-full md:w-1/3 bg-white p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Interview Transcript</h2>
                <div className="flex space-x-2">
                  {isRecording ? (
                    <button
                      onClick={stopRecording}
                      className="bg-red-600 text-white px-3 py-1 rounded-md flex items-center"
                    >
                      <span className="inline-block w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></span>
                      Stop Recording
                    </button>
                  ) : (
                    <button
                      onClick={startRecording}
                      className="bg-indigo-600 text-white px-3 py-1 rounded-md"
                    >
                      Start Recording
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-gray-50 p-4 rounded-md">
                <pre className="whitespace-pre-wrap text-sm">{transcript}</pre>
              </div>
            </div>
          </div>
        </MeetingProvider>
      )}
      
      {/* Debug information (only in development) */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="bg-black text-green-400 p-2 text-xs font-mono overflow-x-auto">
          <details>
            <summary>Debug Info (Development Only)</summary>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}

function VideoConference({ 
  interviewDetails,
  onEndInterview,
}: { 
  interviewDetails: InterviewDetails;
  onEndInterview: () => void;
}) {
  const { 
    participants, 
    localParticipantId, 
    join, 
    leave, 
    enableWebcam, 
    disableWebcam,
    enableMic,
    disableMic,
    meetingId
  } = useMeeting();
  
  // Auto-join and handle webcam/mic
  useEffect(() => {
    // Force join the meeting when component mounts
    console.log("Meeting provider ready, attempting to join...");
    
    if (join) {
      console.log("Joining the meeting...");
      join();
      
      // Enable webcam and mic after joining
      setTimeout(() => {
        if (enableWebcam) {
          console.log("Enabling webcam...");
          enableWebcam();
        }
        
        if (enableMic) {
          console.log("Enabling microphone...");
          enableMic();
        }
      }, 1000);
    }
    
    // Cleanup when component unmounts
    return () => {
      if (leave) {
        console.log("Leaving the meeting...");
        leave();
      }
    };
  }, [join, leave, enableWebcam, enableMic]);

  // Log participants for debugging
  useEffect(() => {
    console.log("Meeting ID:", meetingId);
    console.log("Current participants:", participants?.size || 0);
    console.log("Local participant ID:", localParticipantId);
    
    if (participants) {
      participants.forEach(p => console.log("Participant:", p.id, p.displayName));
    }
  }, [participants, localParticipantId, meetingId]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-800 text-white p-3 rounded-t-md flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-semibold">{interviewDetails.title}</h1>
          <p className="text-sm text-gray-300">
            {interviewDetails.type === "TECHNICAL" ? "Technical" : "Managerial"} Interview
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEndInterview}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            End Interview
          </button>
        </div>
      </div>
      
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        {participants && participants.size > 0 ? (
          Array.from(participants.values()).map((participant) => (
            <ParticipantView
              key={participant.id}
              participantId={participant.id}
              isLocal={participant.id === localParticipantId}
            />
          ))
        ) : (
          <div className="col-span-2 flex items-center justify-center bg-gray-800 rounded-lg">
            <div className="text-center p-8">
              <div className="text-xl text-white mb-4">Waiting for participants to join...</div>
              <div className="animate-pulse text-indigo-400">
                <p>Room ID: {meetingId || "Not available"}</p>
                <p className="mt-2">
                  Make sure both participants have joined the same meeting room.
                </p>
                <p className="mt-6 text-xs text-gray-400">
                  You are {interviewDetails.isCandidate ? "the candidate" : "the interviewer"}.
                  {interviewDetails.isCandidate 
                    ? ` Waiting for ${interviewDetails.interviewerName} to join.`
                    : ` Waiting for ${interviewDetails.candidateName} to join.`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 bg-gray-800 p-3 rounded-b-md text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm">
              Interviewer: <span className="font-semibold">{interviewDetails.interviewerName}</span>
            </p>
            <p className="text-sm">
              Candidate: <span className="font-semibold">{interviewDetails.candidateName}</span>
            </p>
          </div>
          <div className="text-sm">
            {interviewDetails.isInterviewer && (
              <p className="text-indigo-300">You are the interviewer</p>
            )}
            {interviewDetails.isCandidate && (
              <p className="text-indigo-300">You are the candidate</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticipantView({ 
  participantId,
  isLocal,
}: { 
  participantId: string;
  isLocal: boolean;
}) {
  const { 
    webcamStream, 
    micStream, 
    webcamOn, 
    micOn, 
    isActiveSpeaker, 
    displayName,
    enableWebcam,
    disableWebcam,
    enableMic,
    disableMic
  } = useParticipant(participantId);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (webcamOn && webcamStream && videoRef.current) {
      videoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream, webcamOn]);

  // Add controls for toggling camera and mic
  const toggleCamera = () => {
    if (webcamOn) {
      disableWebcam?.();
    } else {
      enableWebcam?.();
    }
  };

  const toggleMic = () => {
    if (micOn) {
      disableMic?.();
    } else {
      enableMic?.();
    }
  };
  
  return (
    <div className={`relative rounded-lg overflow-hidden bg-gray-700 aspect-video ${isActiveSpeaker ? "ring-4 ring-indigo-500" : ""}`}>
      {webcamOn ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-semibold">
            {displayName?.charAt(0) || "U"}
          </div>
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 flex justify-between items-center">
        <span className="text-sm truncate">
          {displayName} {isLocal && "(You)"}
        </span>
        {isLocal && (
          <div className="flex space-x-3">
            <button 
              onClick={toggleMic}
              className={`text-white flex items-center justify-center w-8 h-8 rounded-full ${micOn ? 'bg-green-500' : 'bg-red-500'}`}
            >
              {micOn ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>
            <button 
              onClick={toggleCamera}
              className={`text-white flex items-center justify-center w-8 h-8 rounded-full ${webcamOn ? 'bg-green-500' : 'bg-red-500'}`}
            >
              {webcamOn ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          </div>
        )}
        <div className="flex space-x-2">
          <span className={`inline-block w-3 h-3 rounded-full ${micOn ? "bg-green-500" : "bg-red-500"}`}></span>
          <span className={`inline-block w-3 h-3 rounded-full ${webcamOn ? "bg-green-500" : "bg-red-500"}`}></span>
        </div>
      </div>
    </div>
  );
}