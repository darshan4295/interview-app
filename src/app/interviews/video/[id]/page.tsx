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

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!session?.user?.id) {
          setError("You must be logged in to access this page");
          return;
        }

        // Fetch interview details
        const interviewResponse = await fetch(`/api/interviews/${params.id}`);
        if (!interviewResponse.ok) {
          throw new Error("Failed to fetch interview details");
        }
        const interviewData = await interviewResponse.json();
        
        // Check if the user is authorized to join this interview
        const isCandidate = interviewData.candidateId === session.user.id;
        const isInterviewer = interviewData.interviewerId === session.user.id;
        const isAdmin = session.user.role === "ADMIN";
        
        if (!isCandidate && !isInterviewer && !isAdmin) {
          setError("You are not authorized to join this interview");
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

        // Create/get room ID
        const roomResponse = await fetch(`/api/interviews/${params.id}/room`, {
          method: "POST",
        });
        if (!roomResponse.ok) {
          throw new Error("Failed to create interview room");
        }
        const roomData = await roomResponse.json();
        setRoomId(roomData.roomId);

        // Get VideoSDK token
        const tokenResponse = await fetch("/api/videosdk/token");
        if (!tokenResponse.ok) {
          throw new Error("Failed to get VideoSDK token");
        }
        const tokenData = await tokenResponse.json();
        setToken(tokenData.token);

        setLoading(false);
      } catch (error) {
        console.error("Error setting up video call:", error);
        setError("Failed to set up video call");
        setLoading(false);
      }
    };

    fetchData();
  }, [session, params.id]);

  const saveTranscript = async () => {
    try {
      await fetch(`/api/interviews/${params.id}/transcript`, {
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
    try {
      await saveTranscript();
      
      await fetch(`/api/interviews/${params.id}/complete`, {
        method: "POST",
      });
      
      // Redirect based on user role
      if (interviewDetails?.isInterviewer) {
        router.push(`/dashboard/interviewer/interviews/${params.id}/feedback`);
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

  if (!token || !roomId || !interviewDetails) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <MeetingProvider
        config={{
          meetingId: roomId,
          micEnabled: true,
          webcamEnabled: true,
          name: session?.user?.name || "User",
        }}
        token={token}
      >
        <div className="flex flex-col md:flex-row min-h-screen">
          {/* Video conference section */}
          <div className="flex-1 bg-gray-900 p-4">
            <VideoConference
              interviewDetails={interviewDetails}
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
  const { participants, localParticipantId } = useMeeting();
  
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
        {[...participants.values()].map((participant) => (
          <ParticipantView
            key={participant.id}
            participantId={participant.id}
            isLocal={participant.id === localParticipantId}
          />
        ))}
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
  const { webcamStream, micStream, webcamOn, micOn, isActiveSpeaker, displayName } = useParticipant(participantId);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (webcamOn && webcamStream && videoRef.current) {
      videoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream, webcamOn]);
  
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
        <div className="flex space-x-2">
          <span className={`inline-block w-3 h-3 rounded-full ${micOn ? "bg-green-500" : "bg-red-500"}`}></span>
          <span className={`inline-block w-3 h-3 rounded-full ${webcamOn ? "bg-green-500" : "bg-red-500"}`}></span>
        </div>
      </div>
    </div>
  );
}