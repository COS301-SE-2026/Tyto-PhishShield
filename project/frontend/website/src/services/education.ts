import { API_BASE } from './api';
import { isErrorResponse } from './send-email';

const EDUCATION_BASE = `${API_BASE}/education`;

export interface Question{
    id: string;
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    createdAt: string;
}

export interface AssignmentQuestion {
    id: string;
    questionText: string;
    options: string[];
    createdAt: string;
}

export type AssignmentStatus = 'pending' | 'passed' | 'failed';

export interface Assignment {
    id: string;
    auth0Id: string;
    questionIds: string[];
    status : AssignmentStatus;
    xpAwarded: number;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PendingAssignment extends Assignment{
    questions: AssignmentQuestion[];
}

export interface CreateQuestionRequest {
    questionText: string;
    options: string[];
    correctOptionIndex: number;
}

export interface SubmitAnswersRequest {
    assignmentId: string;
    answers: number[];
}

export interface SubmitAnswerResponse {
    passed: boolean;
    xpAwarded: number;
    correctCount: number;
    total: number;
    feedback: string;
}

async function educationRequestHelper<T>(
    endpoint: string, 
    options: RequestInit = {},
): Promise<T>{
    const token = localStorage.getItem('access_token');

    const response= await fetch(`${EDUCATION_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    const data: unknown = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(isErrorResponse(data) ? (data).message : 'Education request failed');
    }

    return data as T;
}

//Creates a new question in the question bank (used by admins)
export function createQuestion(request: CreateQuestionRequest): Promise<Question> {
    return educationRequestHelper<Question>('/questions', {
        method: 'POST',
        body: JSON.stringify(request),
    });
}

//Return all questions in the question bank (used by admins)
export function getAllQuestions(): Promise<Question[]> {
    return educationRequestHelper<Question[]>('/questions', {
        method: 'GET',
    });
}

//creates an assignments for the currently authenticated user.
//The backend gets the user's auth0Id from the JWT so no need for request body
export function createMyAssignment(): Promise<Assignment> {
    return educationRequestHelper<Assignment>('/assignments', {
        method: 'POST',
    });
}

//returns pending assignments for the currently authenticated user. (returns null if no pending assignment)
export function getMyAssignment(): Promise<PendingAssignment | null> {
    return educationRequestHelper<PendingAssignment | null>('/assignment/mine', {
        method: 'GET',
    });
}

//returns all assignments for the currently authenticated user.
export function getMyEducationHistory(): Promise<Assignment[]> {
    return educationRequestHelper<Assignment[]>('/history/mine', {
        method: 'GET',
    });
}

//Submit the user's selected indexes for questions for a pending assignment
export function submitAnswers(request: SubmitAnswersRequest): Promise<SubmitAnswerResponse> {
    return educationRequestHelper<SubmitAnswerResponse>('/answers', {
        method: 'POST',
        body:JSON.stringify(request),
    });
}
