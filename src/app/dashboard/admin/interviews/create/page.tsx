// src/app/dashboard/admin/interviews/create/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

// Schema for form validation
const scheduleSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  type: z.enum(["TECHNICAL", "MANAGERIAL"], { 
    message: "Please select an interview type" 
  }),
  candidateId: z.string({ 
    message: "Please select a candidate" 
  }),
  interviewerId: z.string({ 
    message: "Please select an interviewer" 
  }),
  date: z.string({ 
    message: "Please select a date" 
  }),
  time: z.string({ 
    message: "Please select a time" 
  }),
  duration: z.number().min(15).max(120)
});

type FormValues = z.infer<typeof scheduleSchema>;

export default function ScheduleInterviewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [candidates, setCandidates] = useState<User[]>([]);
  const [interviewers, setInterviewers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<FormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      title: "",
      type: undefined,
      candidateId: "",
      interviewerId: "",
      date: new Date().toISOString().split("T")[0],
      time: "10:00",
      duration: 60
    }
  });

  useEffect(() => {
    const fetchUsers = async () => {
      if (!session?.user?.id) return;
      
      try {
        if (session.user.role !== "ADMIN") {
          setError("You do not have permission to access this page.");
          setIsLoading(false);
          return;
        }

        // Fetch candidates
        console.log("Fetching candidates...");
        const candidatesResponse = await fetch("/api/admin/users?role=CANDIDATE");
        if (!candidatesResponse.ok) {
          throw new Error("Failed to fetch candidates");
        }
        const candidatesData = await candidatesResponse.json();
        console.log(`Found ${candidatesData.length} candidates`);
        setCandidates(candidatesData);

        // Fetch interviewers
        console.log("Fetching interviewers...");
        const interviewersResponse = await fetch("/api/admin/users?role=INTERVIEWER");
        if (!interviewersResponse.ok) {
          throw new Error("Failed to fetch interviewers");
        }
        const interviewersData = await interviewersResponse.json();
        console.log(`Found ${interviewersData.length} interviewers`);
        setInterviewers(interviewersData);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load users. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [session]);

  const onSubmit = async (data: FormValues) => {
    console.log("Form submitted with data:", data);
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create interview date by combining date and time
      const scheduledAt = new Date(`${data.date}T${data.time}`);
      console.log("Scheduled at:", scheduledAt.toISOString());
      
      // Validate that the interview is in the future
      if (scheduledAt <= new Date()) {
        setError("Interview must be scheduled for a future date and time");
        setIsSubmitting(false);
        return;
      }
      
      // Create the request body
      const requestBody = {
        title: data.title,
        type: data.type,
        candidateId: data.candidateId,
        interviewerId: data.interviewerId,
        scheduledAt: scheduledAt.toISOString(),
        duration: data.duration
      };
      
      console.log("Sending request with body:", requestBody);
      
      // Send the request to create the interview
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      console.log("API response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to schedule interview");
      }

      // Success - redirect to interviews list
      console.log("Interview scheduled successfully");
      router.push("/dashboard/admin/interviews?scheduled=true");
    } catch (error) {
      console.error("Error scheduling interview:", error);
      setError(error instanceof Error ? error.message : "Failed to schedule interview. Please try again.");
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

  if (error && !isSubmitting) {
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
        <h1 className="text-2xl font-bold text-gray-900">Schedule New Interview</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Interview Title
                </label>
                <input
                  type="text"
                  {...register("title")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g., Frontend Developer Interview"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Interview Type
                </label>
                <select
                  {...register("type")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select interview type</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="MANAGERIAL">Managerial</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.type.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Candidate
                </label>
                <select
                  {...register("candidateId")}
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
                    {errors.candidateId.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Interviewer
                </label>
                <select
                  {...register("interviewerId")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select interviewer</option>
                  {interviewers.map((interviewer) => (
                    <option key={interviewer.id} value={interviewer.id}>
                      {interviewer.name} ({interviewer.email})
                    </option>
                  ))}
                </select>
                {errors.interviewerId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.interviewerId.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    {...register("date")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.date.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Time
                  </label>
                  <input
                    type="time"
                    {...register("time")}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  {errors.time && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.time.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  {...register("duration", { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="60"
                  min="15"
                  max="120"
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.duration.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => router.push("/dashboard/admin/interviews")}
                className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Scheduling...
                  </span>
                ) : "Schedule Interview"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}