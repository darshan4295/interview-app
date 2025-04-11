// src/app/dashboard/admin/assessments/create/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function CreateAssessmentPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [candidates, setCandidates] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        // Fetch candidates
        const response = await fetch("/api/admin/users?role=CANDIDATE");
        if (!response.ok) {
          throw new Error("Failed to fetch candidates");
        }
        const data = await response.json();
        setCandidates(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching candidates:", error);
        setError("Failed to load candidates. Please try again later.");
        setIsLoading(false);
      }
    };

    if (session?.user?.role === "ADMIN") {
      fetchCandidates();
    } else {
      setError("You do not have permission to access this page.");
      setIsLoading(false);
    }
  }, [session]);

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          requirements: data.requirements,
          candidateId: data.candidateId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create assessment");
      }

      router.push("/dashboard/admin/assessments?created=true");
    } catch (error) {
      console.error("Error creating assessment:", error);
      setError("Failed to create assessment. Please try again.");
      setIsSubmitting(false);
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
            onClick={() => router.push("/dashboard/admin")}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Coding Assessment</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assessment Title
                </label>
                <input
                  type="text"
                  {...register("title", { required: "Title is required" })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g., Frontend Developer Coding Challenge"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.title.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Candidate
                </label>
                <select
                  {...register("candidateId", { required: "Candidate is required" })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select candidate</option>
                  {candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name} ({candidate.email})
                    </option>
                  ))}
                </select>
                {errors.candidateId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.candidateId.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  {...register("description", { required: "Description is required" })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Provide a brief introduction to the coding assessment..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.description.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Requirements
                </label>
                <textarea
                  rows={10}
                  {...register("requirements", { required: "Requirements are required" })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Detailed requirements and instructions for the coding challenge..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Include clear instructions, requirements, and any specific functionalities or constraints. 
                  You can use Markdown formatting.
                </p>
                {errors.requirements && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.requirements.message as string}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => router.push("/dashboard/admin/assessments")}
                className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Assessment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}