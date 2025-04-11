// src/app/dashboard/admin/candidates/[id]/report/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Candidate = {
  id: string;
  name: string;
  email: string;
};

type Interview = {
  id: string;
  title: string;
  type: "TECHNICAL" | "MANAGERIAL";
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  aiAnalysis: any;
};

type Assessment = {
  id: string;
  title: string;
  status: "PENDING" | "SUBMITTED" | "REVIEWED";
  aiAnalysis: any;
  score: number | null;
};

type FinalReport = {
  id: string;
  interviewScore: number;
  codingScore: number;
  managerialScore: number;
  overallRating: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  suggestedHike: number | null;
  createdAt: string;
};

export default function CandidateReportPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [technicalInterview, setTechnicalInterview] = useState<Interview | null>(null);
  const [managerialInterview, setManagerialInterview] = useState<Interview | null>(null);
  const [codingAssessment, setCodingAssessment] = useState<Assessment | null>(null);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchCandidateData = async () => {
      try {
        if (!session?.user?.id) {
          setError("You must be logged in to access this page");
          return;
        }

        if (session.user.role !== "ADMIN") {
          setError("You do not have permission to access this page");
          return;
        }

        // Fetch candidate details
        const candidateResponse = await fetch(`/api/admin/users/${params.id}`);
        if (!candidateResponse.ok) {
          throw new Error("Failed to fetch candidate details");
        }
        const candidateData = await candidateResponse.json();
        setCandidate(candidateData);

        // Fetch candidate's technical interview
        const technicalResponse = await fetch(`/api/interviews?candidateId=${params.id}&type=TECHNICAL&status=COMPLETED`);
        if (technicalResponse.ok) {
          const technicalData = await technicalResponse.json();
          if (technicalData.length > 0) {
            setTechnicalInterview(technicalData[0]);
          }
        }

        // Fetch candidate's managerial interview
        const managerialResponse = await fetch(`/api/interviews?candidateId=${params.id}&type=MANAGERIAL&status=COMPLETED`);
        if (managerialResponse.ok) {
          const managerialData = await managerialResponse.json();
          if (managerialData.length > 0) {
            setManagerialInterview(managerialData[0]);
          }
        }

        // Fetch candidate's coding assessment
        const assessmentResponse = await fetch(`/api/assessments?candidateId=${params.id}&status=REVIEWED`);
        if (assessmentResponse.ok) {
          const assessmentData = await assessmentResponse.json();
          if (assessmentData.length > 0) {
            setCodingAssessment(assessmentData[0]);
          }
        }

        // Fetch candidate's final report if it exists
        const reportResponse = await fetch(`/api/reports/${params.id}`);
        if (reportResponse.ok) {
          const reportData = await reportResponse.json();
          setFinalReport(reportData);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching candidate data:", error);
        setError("Failed to load candidate data. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchCandidateData();
  }, [session, params.id]);

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      
      if (!technicalInterview?.aiAnalysis || !codingAssessment?.aiAnalysis || !managerialInterview?.aiAnalysis) {
        throw new Error("Cannot generate report without required assessments and interviews");
      }

      const response = await fetch(`/api/reports/${params.id}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          technicalInterview: technicalInterview.aiAnalysis,
          codingAssessment: codingAssessment.aiAnalysis,
          managerialInterview: managerialInterview.aiAnalysis,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const data = await response.json();
      setFinalReport(data);
      setIsGenerating(false);
    } catch (error) {
      console.error("Error generating report:", error);
      setError("Failed to generate report. Please ensure all interviews and assessments are complete.");
      setIsGenerating(false);
    }
  };

  if (isLoading) {
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
            onClick={() => router.push("/dashboard/admin/candidates")}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
          >
            Return to Candidates
          </button>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Candidate Report</h1>
        <div className="flex items-center mt-2">
          <p className="text-gray-600 mr-4">
            Candidate: <span className="font-semibold">{candidate.name}</span>
          </p>
          <p className="text-gray-600">
            Email: <span className="font-semibold">{candidate.email}</span>
          </p>
        </div>
      </div>

      {/* Interview and Assessment Status */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Technical Interview</h3>
              {technicalInterview ? (
                <div>
                  <div className="flex items-center mb-2">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      technicalInterview.status === "COMPLETED" ? "bg-green-500" : "bg-yellow-500"
                    }`}></div>
                    <span className="text-sm">
                      {technicalInterview.status === "COMPLETED" ? "Completed" : "Scheduled"}
                    </span>
                  </div>
                  {technicalInterview.aiAnalysis && (
                    <div className="text-sm text-indigo-600">AI Analysis Available</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No technical interview yet
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Coding Assessment</h3>
              {codingAssessment ? (
                <div>
                  <div className="flex items-center mb-2">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      codingAssessment.status === "REVIEWED" 
                        ? "bg-green-500" 
                        : codingAssessment.status === "SUBMITTED" 
                        ? "bg-blue-500"
                        : "bg-yellow-500"
                    }`}></div>
                    <span className="text-sm">
                      {codingAssessment.status === "REVIEWED" 
                        ? "Reviewed" 
                        : codingAssessment.status === "SUBMITTED" 
                        ? "Submitted"
                        : "Pending"}
                    </span>
                  </div>
                  {codingAssessment.aiAnalysis && (
                    <div className="text-sm text-indigo-600">AI Analysis Available</div>
                  )}
                  {codingAssessment.score !== null && (
                    <div className="text-sm font-medium mt-1">Score: {codingAssessment.score}/100</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No coding assessment yet
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Managerial Interview</h3>
              {managerialInterview ? (
                <div>
                  <div className="flex items-center mb-2">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      managerialInterview.status === "COMPLETED" ? "bg-green-500" : "bg-yellow-500"
                    }`}></div>
                    <span className="text-sm">
                      {managerialInterview.status === "COMPLETED" ? "Completed" : "Scheduled"}
                    </span>
                  </div>
                  {managerialInterview.aiAnalysis && (
                    <div className="text-sm text-indigo-600">AI Analysis Available</div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No managerial interview yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Final Report */}
      {!finalReport ? (
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Final Report</h2>
            <p className="text-gray-600 mb-6">
              {(technicalInterview?.aiAnalysis && codingAssessment?.aiAnalysis && managerialInterview?.aiAnalysis) ? (
                "All required assessments and interviews have been completed. You can now generate a final report."
              ) : (
                <>
                  The candidate needs to complete the following before generating a final report:
                  <ul className="list-disc list-inside mt-2">
                    {!technicalInterview?.aiAnalysis && (
                      <li>Technical interview with AI analysis</li>
                    )}
                    {!codingAssessment?.aiAnalysis && (
                      <li>Coding assessment with AI analysis</li>
                    )}
                    {!managerialInterview?.aiAnalysis && (
                      <li>Managerial interview with AI analysis</li>
                    )}
                  </ul>
                </>
              )}
            </p>
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating || !(technicalInterview?.aiAnalysis && codingAssessment?.aiAnalysis && managerialInterview?.aiAnalysis)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Report...
                </>
              ) : "Generate Final Report"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Final Report</h2>
              <span className="text-sm text-gray-500">
                Generated on {new Date(finalReport.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-md border border-indigo-200 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Overall Rating</p>
                  <p className="text-xl font-bold text-indigo-700">{finalReport.overallRating}/100</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Technical Score</p>
                  <p className="text-lg font-medium text-indigo-600">{finalReport.interviewScore}/100</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Coding Score</p>
                  <p className="text-lg font-medium text-indigo-600">{finalReport.codingScore}/100</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Managerial Score</p>
                  <p className="text-lg font-medium text-indigo-600">{finalReport.managerialScore}/100</p>
                </div>
              </div>
            </div>
            
            <div className="mb-6 p-4 rounded-md border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Recommendation</h3>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                finalReport.recommendation === "STRONG_HIRE" 
                  ? "bg-green-100 text-green-800" 
                  : finalReport.recommendation === "HIRE" 
                  ? "bg-green-50 text-green-700" 
                  : finalReport.recommendation === "CONSIDER" 
                  ? "bg-yellow-100 text-yellow-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {finalReport.recommendation === "STRONG_HIRE" 
                  ? "Strong Hire" 
                  : finalReport.recommendation === "HIRE" 
                  ? "Hire" 
                  : finalReport.recommendation === "CONSIDER" 
                  ? "Consider" 
                  : "Reject"}
              </div>
              
              {finalReport.suggestedHike !== null && (
                <div className="mt-2">
                  <span className="text-sm text-gray-700">
                    Suggested Salary Increase: <span className="font-medium">{finalReport.suggestedHike}%</span>
                  </span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Strengths</h3>
                <div className="bg-green-50 p-4 rounded-md border border-green-200">
                  <ul className="list-disc list-inside space-y-1">
                    {finalReport.strengths.map((strength, index) => (
                      <li key={index} className="text-sm">{strength}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Areas for Improvement</h3>
                <div className="bg-red-50 p-4 rounded-md border border-red-200">
                  <ul className="list-disc list-inside space-y-1">
                    {finalReport.weaknesses.map((weakness, index) => (
                      <li key={index} className="text-sm">{weakness}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => handleGenerateReport()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Regenerate Report
              </button>
              <a
                href={`/api/reports/${params.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Download PDF
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );