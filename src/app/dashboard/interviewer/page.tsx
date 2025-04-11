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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch upcoming interviews
        const interviewsResponse = await fetch("/api/interviews/interviewer");
        const interviewsData = await interviewsResponse.json();
        
        // Fetch pending assessments
        const assessmentsResponse = await fetch("/api/assessments/interviewer");
        const assessmentsData = await assessmentsResponse.json();
        
        // Filter for upcoming interviews
        const upcoming = interviewsData.filter(
          (interview: Interview) => 
            interview.status === "SCHEDULED" && 
            new Date(interview.scheduledAt) > new Date()
        );
        
        // Filter for submitted assessments that need review
        const pending = assessmentsData.filter(
          (assessment: Assessment) => 
            assessment.status === "SUBMITTED"
        );
        
        setUpcomingInterviews(upcoming);
        setPendingAssessments(pending);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
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
            {upcomingInterviews.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {upcomingInterviews.map((interview) => (
                  <li key={interview.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{interview.title}</p>
                        <p className="text-sm text-gray-500">
                          Candidate: {interview.candidate.name}
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
            {pendingAssessments.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {pendingAssessments.map((assessment) => (
                  <li key={assessment.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{assessment.title}</p>
                        <p className="text-sm text-gray-500">
                          Candidate: {assessment.candidate.name}
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