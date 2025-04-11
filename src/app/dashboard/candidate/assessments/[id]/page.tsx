// src/app/dashboard/candidate/assessments/[id]/page.tsx

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
  status: "PENDING" | "SUBMITTED" | "REVIEWED";
  codeSubmission: string | null;
};

export default function CodingAssessmentPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  
  const { register, handleSubmit, setValue, watch } = useForm<{
    code: string;
  }>({
    defaultValues: {
      code: "",
    },
  });
  
  const codeValue = watch("code");
  
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
        
        // If assessment has been submitted, show the submission
        if (data.codeSubmission) {
          setValue("code", data.codeSubmission);
        }
        
        // Set a time limit for demonstration (2 hours)
        if (data.status === "PENDING") {
          const timeLimit = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
          setRemainingTime(timeLimit);
        }
        
      } catch (error) {
        console.error("Error fetching assessment:", error);
        setError("Failed to load coding assessment");
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [session, params.id, setValue]);
  
  // Timer countdown
  useEffect(() => {
    if (remainingTime === null || assessment?.status !== "PENDING") return;
    
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [remainingTime, assessment?.status]);
  
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const onSubmit = async (data: { code: string }) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/assessments/${params.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: data.code }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit assessment");
      }
      
      router.push("/dashboard/candidate/assessments?submitted=true");
      
    } catch (error) {
      console.error("Error submitting assessment:", error);
      setError("Failed to submit assessment. Please try again.");
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
            onClick={() => router.push("/dashboard/candidate/assessments")}
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
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
        
        {assessment.status === "PENDING" && remainingTime !== null && (
          <div className="bg-indigo-100 px-4 py-2 rounded-md">
            <p className="text-sm text-gray-600">Time Remaining</p>
            <p className={`text-xl font-mono font-semibold ${
              remainingTime < 15 * 60 * 1000 ? "text-red-600" : "text-indigo-600"
            }`}>
              {formatTime(remainingTime)}
            </p>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment Details</h2>
          <div className="prose max-w-none">
            <p className="mb-4">{assessment.description}</p>
            <h3 className="text-md font-semibold mb-2">Requirements:</h3>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
              <pre className="whitespace-pre-wrap">{assessment.requirements}</pre>
            </div>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Solution</h2>
              <div className="text-sm text-gray-500">
                {codeValue.length} characters
              </div>
            </div>
            
            <textarea
              {...register("code", { required: true })}
              className="w-full h-96 font-mono p-4 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your code here..."
              disabled={assessment.status !== "PENDING"}
            ></textarea>
          </div>
        </div>
        
        <div className="flex justify-end">
          {assessment.status === "PENDING" && (
            <button
              type="submit"
              disabled={isSubmitting || !codeValue.trim()}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Solution"}
            </button>
          )}
          
          {assessment.status !== "PENDING" && (
            <button
              type="button"
              onClick={() => router.push("/dashboard/candidate/assessments")}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Assessments
            </button>
          )}
        </div>
      </form>
    </div>
  );
}