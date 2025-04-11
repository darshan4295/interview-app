// src/app/dashboard/interviewer/interviews/[id]/feedback/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

type InterviewData = {
  id: string;
  title: string;
  type: "TECHNICAL" | "MANAGERIAL";
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  transcript: string | null;
  aiAnalysis: any;
  feedback: string | null;
  candidate: {
    id: string;
    name: string;
    email: string;
  };
};

export default function InterviewFeedbackPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"transcript" | "analysis" | "feedback">("transcript");
  
  const { register, handleSubmit, setValue } = useForm<{
    feedback: string;
  }>({
    defaultValues: {
      feedback: "",
    },
  });
  
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        if (!session?.user?.id) {
          setError("You must be logged in to access this page");
          return;
        }

        // Fetch interview details
        const response = await fetch(`/api/interviews/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch interview details");
        }
        
        const data = await response.json();
        setInterview(data);
        
        // Pre-fill feedback if available
        if (data.feedback) {
          setValue("feedback", data.feedback);
        } else if (data.aiAnalysis) {
          // Generate feedback suggestion from AI analysis
          const strengths = data.aiAnalysis.strengths?.join("\n- ") || "";
          const weaknesses = data.aiAnalysis.weaknesses?.join("\n- ") || "";
          
          const generatedFeedback = `
# Interview Feedback

## Overall Assessment
${data.aiAnalysis.summary || ""}

## Candidate's Strengths
- ${strengths}

## Areas for Improvement
- ${weaknesses}

## Technical Knowledge: ${data.aiAnalysis.overallScore}/100

## Question-by-Question Analysis:
${data.aiAnalysis.questionAnalysis?.map((qa: any, index: number) => 
  `### Question ${index + 1}: ${qa.question}
Score: ${qa.score}/10
Feedback: ${qa.feedback}
`).join("\n\n") || ""}
          `.trim();
          
          setValue("feedback", generatedFeedback);
        }
        
      } catch (error) {
        console.error("Error fetching interview:", error);
        setError("Failed to load interview details");
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [session, params.id, setValue]);
  
  const onSubmit = async (data: { feedback: string }) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/interviews/${params.id}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          feedback: data.feedback,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }
      
      router.push("/dashboard/interviewer/interviews?feedback=true");
      
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setError("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
            onClick={() => router.push("/dashboard/interviewer/interviews")}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
          >
            Return to Interviews
          </button>
        </div>
      </div>
    );
  }
  
  if (!interview) {
    return null;
  }
  
  if (interview.status === "SCHEDULED") {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Interview Not Completed</h2>
          <p className="text-gray-700 mb-6">
            This interview has not been completed yet. You can provide feedback once the interview is finished.
          </p>
          <button
            onClick={() => router.push("/dashboard/interviewer/interviews")}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
          >
            Return to Interviews
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{interview.title} - Feedback</h1>
        <div className="flex items-center mt-2">
          <p className="text-gray-600 mr-4">
            Candidate: <span className="font-semibold">{interview.candidate.name}</span>
          </p>
          <p className="text-gray-600">
            Type: <span className="font-semibold">
              {interview.type === "TECHNICAL" ? "Technical" : "Managerial"}
            </span>
          </p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("transcript")}
            className={`${
              activeTab === "transcript"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Interview Transcript
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`${
              activeTab === "analysis"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            AI Analysis
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`${
              activeTab === "feedback"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Your Feedback
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        {activeTab === "transcript" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Interview Transcript</h2>
            
            {interview.transcript ? (
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{interview.transcript}</pre>
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <p className="text-yellow-700">
                  No transcript available for this interview. Transcripts are generated during the interview.
                </p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === "analysis" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h2>
            
            {interview.aiAnalysis ? (
              <div>
                <div className="mb-6">
                  <h3 className="text-md font-semibold mb-2">Overall Score</h3>
                  <div className="bg-indigo-50 p-4 rounded-md border border-indigo-200">
                    <div className="flex items-center space-x-2">
                      <div className="text-3xl font-bold text-indigo-700">
                        {interview.aiAnalysis.overallScore}/100
                      </div>
                      <div className="text-sm text-indigo-500">
                        {interview.aiAnalysis.recommendation === "STRONG_HIRE" 
                          ? "Strong Hire" 
                          : interview.aiAnalysis.recommendation === "HIRE" 
                          ? "Hire" 
                          : interview.aiAnalysis.recommendation === "CONSIDER" 
                          ? "Consider" 
                          : "Reject"}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-md font-semibold mb-2">Summary</h3>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <p>{interview.aiAnalysis.summary}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-md font-semibold mb-2">Strengths</h3>
                    <div className="bg-green-50 p-4 rounded-md border border-green-200">
                      <ul className="list-disc list-inside space-y-1">
                        {interview.aiAnalysis.strengths?.map((strength: string, index: number) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-semibold mb-2">Weaknesses</h3>
                    <div className="bg-red-50 p-4 rounded-md border border-red-200">
                      <ul className="list-disc list-inside space-y-1">
                        {interview.aiAnalysis.weaknesses?.map((weakness: string, index: number) => (
                          <li key={index}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                {interview.aiAnalysis.questionAnalysis && (
                  <div>
                    <h3 className="text-md font-semibold mb-2">Question Analysis</h3>
                    <div className="space-y-4">
                      {interview.aiAnalysis.questionAnalysis.map((qa: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                          <div className="mb-2">
                            <span className="font-semibold">Question {index + 1}:</span> {qa.question}
                          </div>
                          <div className="mb-2 pl-4 text-gray-700 border-l-2 border-gray-300">
                            {qa.answer}
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-semibold">Score:</span> 
                              <span className={`ml-1 ${
                                qa.score >= 8 
                                  ? "text-green-600" 
                                  : qa.score >= 5 
                                  ? "text-yellow-600" 
                                  : "text-red-600"
                              }`}>
                                {qa.score}/10
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="font-semibold">Feedback:</span> {qa.feedback}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <p className="text-yellow-700">
                  No AI analysis available for this interview. Analysis is generated based on the interview transcript.
                </p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === "feedback" && (
          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-6">
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Feedback
                </label>
                <textarea
                  id="feedback"
                  rows={15}
                  {...register("feedback", { required: true })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Provide detailed feedback on the candidate's performance..."
                ></textarea>
                <p className="mt-2 text-sm text-gray-500">
                  You can use Markdown formatting for better readability.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/interviewer/interviews")}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : interview.feedback ? "Update Feedback" : "Submit Feedback"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );