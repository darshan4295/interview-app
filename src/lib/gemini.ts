// src/lib/gemini.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Analyzes an interview transcript using Gemini AI
 * 
 * @param transcript The interview transcript to analyze
 * @param interviewType The type of interview (TECHNICAL or MANAGERIAL)
 * @returns Analysis results as a JSON object
 */
export async function analyzeTranscript(
  transcript: string,
  interviewType: "TECHNICAL" | "MANAGERIAL"
): Promise<any> {
  try {
    // Get the Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Create prompt based on interview type
    let prompt = `
    You are an expert AI interviewer. Analyze the following ${interviewType.toLowerCase()} interview transcript and provide a detailed assessment.
    
    The transcript format includes exchanges between an Interviewer and a Candidate.
    
    Please provide your analysis in the following JSON format:
    {
      "overallScore": [A score between 0-100],
      "strengths": [Array of identified strengths, at least 3 if possible],
      "weaknesses": [Array of identified weaknesses, at least 3 if possible],
      "questionAnalysis": [
        {
          "question": [The interview question],
          "answer": [The candidate's answer],
          "score": [Score for this response between 0-10],
          "feedback": [Brief feedback on the answer]
        }
      ],
      "summary": [A paragraph summarizing the candidate's performance],
      "recommendation": ["STRONG_HIRE", "HIRE", "CONSIDER", "REJECT"]
    }
    
    TRANSCRIPT:
    ${transcript}
    `;
    
    if (interviewType === "TECHNICAL") {
      // Add technical-specific instructions
      prompt += `
      For this technical interview, pay special attention to:
      - Technical knowledge accuracy
      - Problem-solving approach
      - Code or algorithm explanation ability
      - Understanding of technical concepts
      - Technical communication skills
      `;
    } else {
      // Add managerial-specific instructions
      prompt += `
      For this managerial interview, pay special attention to:
      - Leadership qualities
      - Team management approach
      - Decision-making process
      - Conflict resolution skills
      - Strategic thinking ability
      - Communication and interpersonal skills
      `;
    }
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract the JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from Gemini response");
    }
    
    const analysisJson = JSON.parse(jsonMatch[0]);
    return analysisJson;
    
  } catch (error) {
    console.error("Error analyzing transcript with Gemini:", error);
    
    // Return a basic error response
    return {
      error: "Failed to analyze transcript",
      overallScore: 0,
      strengths: ["Unable to analyze"],
      weaknesses: ["Unable to analyze"],
      questionAnalysis: [],
      summary: "Failed to generate analysis. Please try again later.",
      recommendation: "CONSIDER"
    };
  }
}

/**
 * Analyzes a coding assessment submission using Gemini AI
 * 
 * @param code The code submission to analyze
 * @param requirements The coding assignment requirements
 * @returns Analysis results as a JSON object
 */
export async function analyzeCodingSubmission(
  code: string,
  requirements: string
): Promise<any> {
  try {
    // Get the Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Create prompt for code analysis
    const prompt = `
    You are an expert code reviewer. Analyze the following code submission based on the provided requirements and provide a detailed assessment.
    
    Please provide your analysis in the following JSON format:
    {
      "overallScore": [A score between 0-100],
      "codeQuality": [A score between 0-10],
      "functionality": [A score between 0-10],
      "efficiency": [A score between 0-10],
      "readability": [A score between 0-10],
      "bestPractices": [A score between 0-10],
      "strengths": [Array of identified strengths in the code, at least 3 if possible],
      "weaknesses": [Array of identified weaknesses in the code, at least 3 if possible],
      "suggestedImprovements": [Array of specific improvements that could be made],
      "summary": [A paragraph summarizing the code quality and meeting requirements],
      "recommendation": ["STRONG_PASS", "PASS", "BORDERLINE", "FAIL"]
    }
    
    REQUIREMENTS:
    ${requirements}
    
    CODE SUBMISSION:
    ${code}
    `;
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract the JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from Gemini response");
    }
    
    const analysisJson = JSON.parse(jsonMatch[0]);
    return analysisJson;
    
  } catch (error) {
    console.error("Error analyzing code with Gemini:", error);
    
    // Return a basic error response
    return {
      error: "Failed to analyze code submission",
      overallScore: 0,
      codeQuality: 0,
      functionality: 0,
      efficiency: 0,
      readability: 0,
      bestPractices: 0,
      strengths: ["Unable to analyze"],
      weaknesses: ["Unable to analyze"],
      suggestedImprovements: ["Unable to analyze"],
      summary: "Failed to generate analysis. Please try again later.",
      recommendation: "BORDERLINE"
    };
  }
}

/**
 * Generates a final candidate report using Gemini AI
 * 
 * @param interviewAnalysis The analysis of the interview
 * @param codingAnalysis The analysis of the coding assessment
 * @param managerialAnalysis The analysis of the managerial interview
 * @returns Final report as a JSON object
 */
export async function generateFinalReport(
  interviewAnalysis: any,
  codingAnalysis: any,
  managerialAnalysis: any
): Promise<any> {
  try {
    // Get the Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Create prompt for final report generation
    const prompt = `
    You are an expert AI hiring assistant. Generate a comprehensive final report for a candidate based on their technical interview, coding assessment, and managerial interview results.
    
    Please provide your report in the following JSON format:
    {
      "overallRating": [A score between 0-100],
      "technicalScore": [A score between 0-100 based on the technical interview],
      "codingScore": [A score between 0-100 based on the coding assessment],
      "managerialScore": [A score between 0-100 based on the managerial interview],
      "strengths": [Array of candidate's key strengths identified across all assessments],
      "weaknesses": [Array of candidate's key weaknesses identified across all assessments],
      "summary": [A comprehensive paragraph summarizing the candidate's overall performance],
      "technicalSummary": [A brief summary of technical skills and knowledge],
      "codingSummary": [A brief summary of coding abilities],
      "managerialSummary": [A brief summary of managerial/soft skills],
      "recommendation": ["STRONG_HIRE", "HIRE", "CONSIDER", "REJECT"],
      "suggestedHike": [Suggested percentage hike if hired, based on performance, e.g., 10, 15, 20],
      "suggestedRole": [A suitable role for the candidate based on their performance]
    }
    
    TECHNICAL INTERVIEW ANALYSIS:
    ${JSON.stringify(interviewAnalysis)}
    
    CODING ASSESSMENT ANALYSIS:
    ${JSON.stringify(codingAnalysis)}
    
    MANAGERIAL INTERVIEW ANALYSIS:
    ${JSON.stringify(managerialAnalysis)}
    `;
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract the JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from Gemini response");
    }
    
    const reportJson = JSON.parse(jsonMatch[0]);
    return reportJson;
    
  } catch (error) {
    console.error("Error generating final report with Gemini:", error);
    
    // Return a basic error response
    return {
      error: "Failed to generate final report",
      overallRating: 0,
      technicalScore: 0,
      codingScore: 0,
      managerialScore: 0,
      strengths: ["Unable to analyze"],
      weaknesses: ["Unable to analyze"],
      summary: "Failed to generate final report. Please try again later.",
      technicalSummary: "Unable to analyze",
      codingSummary: "Unable to analyze",
      managerialSummary: "Unable to analyze",
      recommendation: "CONSIDER",
      suggestedHike: 0,
      suggestedRole: "Unable to determine"
    };
  }
}