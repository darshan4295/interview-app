// src/app/dashboard/interviewer/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Interview = {
  id: string;
  title: string;
  type: "TECHNICAL" | "MANAGERIAL";
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  scheduledAt: string;
  candidate: {
    id: string;
    name: string;
  };
};

type Assessment = {
  id: string;
  title: string;
  status: "PENDING" | "SUBMITTED" | "REVIEWED";
  candidate: {
    id: string;
    name: string;
  };
};

export default function InterviewerDashboard() {
  const { data: session } = useSession();
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
  const [pendingAssessments, setPendingAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session?.user?.id) return;
      
      try {
        // Fetch interviews
        console.log("Fetching interviewer interviews...");
        const interviewsResponse = await fetch("/api/interviews/interviewer");
        if (!interviewsResponse.ok) {
          throw new Error("Failed to fetch interviews");
        }
        const interviewsData = await interviewsResponse.json();
        
        console.log("Raw interviews data:", interviewsData);
        
        // Filter for upcoming interviews - use timestamp comparison for more reliability
        const currentTime = new Date().getTime();
        const upcoming = Array.isArray(interviewsData) ? interviewsData.filter(
          (interview: Interview) => 
            interview.status === "SCHEDULED" && 
            new Date(interview.scheduledAt).getTime() > currentTime
        ) : [];
        
        console.log("Filtered upcoming interviews:", upcoming);
        setUpcomingInterviews(upcoming);
        
        // Fetch assessments for review
        console.log("Fetching interviewer assessments...");
        const assessmentsResponse = await fetch("/api/assessments/interviewer");
        if (!assessmentsResponse.ok) {
          throw new Error("Failed to fetch assessments");
        }
        const assessmentsData = await assessmentsResponse.json();
        
        console.log("Raw assessments data:", assessmentsData);
        
        // Filter for submitted assessments that need review
        const pending = Array.isArray(assessmentsData) ? assessmentsData.filter(
          (assessment: Assessment) => assessment.status === "SUBMITTED"
        ) : [];
        
        console.log("Filtered pending assessments:", pending);
        setPendingAssessments(pending);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">
        Welcome, {session?.user?.name}
      </h1>
      
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Interviews */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-indigo-50">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Interviews</h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {Array.isArray(upcomingInterviews) && upcomingInterviews.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {upcomingInterviews.map((interview) => (
                  <li key={interview.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{interview.title}</p>
                        <p className="text-sm text-gray-500">
                          Candidate: {interview.candidate?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(interview.scheduledAt).toLocaleString()} - {interview.type === "TECHNICAL" ? "Technical" : "Managerial"} Interview
                        </p>
                      </div>
                      <Link 
                        href={`/interviews/video/${interview.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Start
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming interviews</p>
            )}
            
            <div className="mt-4">
              <Link
                href="/dashboard/interviewer/interviews"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all interviews →
              </Link>
            </div>
          </div>
        </div>
        
        {/* Assessments to Review */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-indigo-50">
            <h2 className="text-lg font-medium text-gray-900">Assessments to Review</h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            {Array.isArray(pendingAssessments) && pendingAssessments.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {pendingAssessments.map((assessment) => (
                  <li key={assessment.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{assessment.title}</p>
                        <p className="text-sm text-gray-500">
                          Candidate: {assessment.candidate?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-500">Status: Submitted</p>
                      </div>
                      <Link 
                        href={`/dashboard/interviewer/assessments/${assessment.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Review
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">No assessments to review</p>
            )}
            
            <div className="mt-4">
              <Link
                href="/dashboard/interviewer/assessments"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                View all assessments →
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="mt-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Activity</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-indigo-50 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed Interviews
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {/* Replace with actual count */}
                    8
                  </dd>
                </div>
              </div>
              <div className="bg-indigo-50 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Reviewed Assessments
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {/* Replace with actual count */}
                    5
                  </dd>
                </div>
              </div>
              <div className="bg-indigo-50 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Candidates Evaluated
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {/* Replace with actual count */}
                    12
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}