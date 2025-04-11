// src/app/dashboard/interviewer/assessments/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

type AssessmentData = {
  id: string;
  title: string;
  description: string;
  requirements: string;
  codeSubmission: string | null;
  status: "PENDING" | "SUBMITTED" | "REVIEWED";
  aiAnalysis: any;
  score: number | null;
  feedback: string | null;
  candidate: {
    id: string;
    name: string;
    email: string;
  };
};

export default function AssessmentReviewPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "analysis" | "feedback">("code");
  
  const { register, handleSubmit, setValue } = useForm<{
    score: number;
    feedback: string;
  }>({
    defaultValues: {
      score: 0,
      feedback: "",
    },
  });
  
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        if (!session?.user?.id) {
          setError("You must be logged in to access this page");
          return;
        }

        const response = await fetch(`/api/assessments/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch assessment");
        }
        
        const data = await response.json();
        setAssessment(data);
        
        // Pre-fill form with AI analysis if available
        if (data.aiAnalysis) {
          setValue("score", data.aiAnalysis.overallScore || 0);
          
          // Generate feedback from AI analysis
          const strengths = data.aiAnalysis.strengths?.join("\n- ") || "";
          const weaknesses = data.aiAnalysis.weaknesses?.join("\n- ") || "";
          const improvements = data.aiAnalysis.suggestedImprovements?.join("\n- ") || "";
          
          const generatedFeedback = `
# Code Review Feedback

## Overall Assessment
${data.aiAnalysis.summary || ""}

## Strengths
- ${strengths}

## Areas for Improvement
- ${weaknesses}

## Suggested Improvements
- ${improvements}

## Code Quality: ${data.aiAnalysis.codeQuality}/10
## Functionality: ${data.aiAnalysis.functionality}/10
## Efficiency: ${data.aiAnalysis.efficiency}/10
## Readability: ${data.aiAnalysis.readability}/10
## Best Practices: ${data.aiAnalysis.bestPractices}/10
          `.trim();
          
          setValue("feedback", generatedFeedback);
        }
        
        // If assessment already has reviewer feedback, use that instead
        if (data.feedback) {
          setValue("feedback", data.feedback);
        }
        
        if (data.score !== null) {
          setValue("score", data.score);
        }
        
      } catch (error) {
        console.error("Error fetching assessment:", error);
        setError("Failed to load assessment");
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [session, params.id, setValue]);
  
  const onSubmit = async (data: { score: number; feedback: string }) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/assessments/${params.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          score: data.score,
          feedback: data.feedback,
          reviewerId: session?.user?.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit review");
      }
      
      router.push("/dashboard/interviewer/assessments?reviewed=true");
      
    } catch (error) {
      console.error("Error submitting review:", error);
      setError("Failed to submit review. Please try again.");
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
            onClick={() => router.push("/dashboard/interviewer/assessments")}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
          >
            Return to Assessments
          </button>
        </div>
      </div>
    );
  }
  
  if (!assessment) {
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
        <div className="flex items-center mt-2">
          <p className="text-gray-600 mr-4">
            Candidate: <span className="font-semibold">{assessment.candidate.name}</span>
          </p>
          <p className="text-gray-600">
            Status: <span className={`font-semibold ${
              assessment.status === "PENDING" 
                ? "text-yellow-600" 
                : assessment.status === "SUBMITTED" 
                ? "text-blue-600" 
                : "text-green-600"
            }`}>
              {assessment.status === "PENDING" 
                ? "Pending" 
                : assessment.status === "SUBMITTED" 
                ? "Submitted" 
                : "Reviewed"}
            </span>
          </p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("code")}
            className={`${
              activeTab === "code"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Code Submission
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
        {activeTab === "code" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment Requirements</h2>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
              <pre className="whitespace-pre-wrap">{assessment.requirements}</pre>
            </div>
            
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Code Submission</h2>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 font-mono text-sm overflow-auto max-h-96">
              <pre>{assessment.codeSubmission || "No code submitted yet"}</pre>
            </div>
          </div>
        )}
        
        {activeTab === "analysis" && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h2>
            
            {assessment.aiAnalysis ? (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <div className="bg-indigo-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Overall Score</p>
                    <p className="text-2xl font-semibold text-indigo-600">
                      {assessment.aiAnalysis.overallScore}/100
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Code Quality</p>
                    <p className="text-2xl font-semibold text-indigo-600">
                      {assessment.aiAnalysis.codeQuality}/10
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Functionality</p>
                    <p className="text-2xl font-semibold text-indigo-600">
                      {assessment.aiAnalysis.functionality}/10
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Efficiency</p>
                    <p className="text-2xl font-semibold text-indigo-600">
                      {assessment.aiAnalysis.efficiency}/10
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-md">
                    <p className="text-sm text-gray-500">Readability</p>
                    <p className="text-2xl font-semibold text-indigo-600">
                      {assessment.aiAnalysis.readability}/10
                    </p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-md font-semibold mb-2">Summary</h3>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <p>{assessment.aiAnalysis.summary}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-md font-semibold mb-2">Strengths</h3>
                    <div className="bg-green-50 p-4 rounded-md border border-green-200">
                      <ul className="list-disc list-inside space-y-1">
                        {assessment.aiAnalysis.strengths?.map((strength: string, index: number) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-semibold mb-2">Weaknesses</h3>
                    <div className="bg-red-50 p-4 rounded-md border border-red-200">
                      <ul className="list-disc list-inside space-y-1">
                        {assessment.aiAnalysis.weaknesses?.map((weakness: string, index: number) => (
                          <li key={index}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-md font-semibold mb-2">Suggested Improvements</h3>
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                    <ul className="list-disc list-inside space-y-1">
                      {assessment.aiAnalysis.suggestedImprovements?.map((improvement: string, index: number) => (
                        <li key={index}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-md font-semibold mb-2">AI Recommendation</h3>
                  <div className={`p-4 rounded-md ${
                    assessment.aiAnalysis.recommendation === "STRONG_PASS" 
                      ? "bg-green-100 border border-green-300" 
                      : assessment.aiAnalysis.recommendation === "PASS" 
                      ? "bg-green-50 border border-green-200" 
                      : assessment.aiAnalysis.recommendation === "BORDERLINE" 
                      ? "bg-yellow-50 border border-yellow-200" 
                      : "bg-red-50 border border-red-200"
                  }`}>
                    <p className="font-semibold">{
                      assessment.aiAnalysis.recommendation === "STRONG_PASS" 
                        ? "Strong Pass" 
                        : assessment.aiAnalysis.recommendation === "PASS" 
                        ? "Pass" 
                        : assessment.aiAnalysis.recommendation === "BORDERLINE" 
                        ? "Borderline" 
                        : "Fail"
                    }</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">No AI analysis available</p>
            )}
          </div>
        )}
        
        {activeTab === "feedback" && (
          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-6">
                <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-1">
                  Overall Score (0-100)
                </label>
                <input
                  type="number"
                  id="score"
                  min="0"
                  max="100"
                  {...register("score", { required: true, min: 0, max: 100 })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback
                </label>
                <textarea
                  id="feedback"
                  rows={15}
                  {...register("feedback", { required: true })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Provide detailed feedback on the code submission..."
                ></textarea>
                <p className="mt-2 text-sm text-gray-500">
                  You can use Markdown formatting for better readability.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/interviewer/assessments")}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : assessment.status === "REVIEWED" ? "Update Review" : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}