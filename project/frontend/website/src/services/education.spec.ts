import { createQuestion,getAllQuestions,
  createMyAssignment,
  getMyAssignment,
  getMyEducationHistory,
  submitAnswers,
  type Assignment,
  type CreateQuestionRequest,
  type PendingAssignment,
  type Question,
  type SubmitAnswerResponse,
  type SubmitAnswersRequest, 
} from "./education";
import { API_BASE } from "./api";
import { describe, beforeEach, expect, vi, it } from "vitest";

const EDUCATION_BASE = `${API_BASE}/education`;

interface MockResponseOptions {
    ok?: boolean;
    status?: number;
    data?:unknown;
    jsonError?: Error;
}

function createMockResponse({ok = true, status = 200, data = null, jsonError}: MockResponseOptions = {}): Response {
  return {
    ok,
    status,
    json: jsonError
      ? vi.fn().mockRejectedValue(jsonError)
      : vi.fn().mockResolvedValue(data),
  } as unknown as Response;
}

describe('education service', () => {
    const fetchMock = vi.fn<typeof fetch>();

    beforeEach(() => {
        fetchMock.mockReset();
        localStorage.clear();
        vi.stubGlobal('fetch', fetchMock);
    });

    it('adds the access token to the authenticated requests', async () => {
        localStorage.setItem('access_token', 'test-token');

        fetchMock.mockResolvedValueOnce(createMockResponse({data: [],}));
        await getAllQuestions();

        expect(fetchMock).toHaveBeenCalledWith(
            `${EDUCATION_BASE}/questions`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test-token',
                },
            }
        );
    });

    it('Does not add Authorization header if there is no token', async () => {
        fetchMock.mockResolvedValueOnce(createMockResponse({data: [],}));
        await getAllQuestions();

        expect(fetchMock).toHaveBeenCalledWith(
            `${EDUCATION_BASE}/questions`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    });

    it('should create a question using the correct endpoint and request body', async () => {
        const request: CreateQuestionRequest = {
            questionText: 'Which email is sus?',
            options: [
                'Option A',
                'Unexpected password reset email',
                'Option C',
            ],
            correctOptionIndex: 1,
        };

        const createdQuestion: Question = {
            id: 'question-1',
            ...request,
            createdAt: '2026-07-27T10:00:00.000Z',
        };

        localStorage.setItem('access_token', 'admin-token');

        fetchMock.mockResolvedValueOnce(createMockResponse({status: 201, data: createdQuestion}));

        const result = await createQuestion(request);

        expect(fetchMock).toHaveBeenCalledOnce();
        expect(fetchMock).toHaveBeenCalledWith(
            `${EDUCATION_BASE}/questions`,
            {
                method: 'POST',
                body: JSON.stringify(request),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer admin-token',
                },
            }
        );
        expect(result).toEqual(createdQuestion);
    });

    it('should return all questions from the question bank', async () => {
        const questions: Question[] = [
            {
                id: 'question-1',
                questionText: 'What is phishing.',
                options: [
                    'Cyberattack',
                    'Option B',
                    'Option C',
                ],
                correctOptionIndex: 0,
                createdAt: '2026-07-27T10:00:00.000Z',
            },
            {
                id: 'question-2',
                questionText: 'What must you check before opening a link',
                options: [
                    'sender and url',
                    'Option B',
                    'Option C',
                ],
                correctOptionIndex: 0,
                createdAt: '2026-07-27T11:00:00.000Z',
            },
        ];

        fetchMock.mockResolvedValueOnce(createMockResponse({data: questions,}));

        const result = await getAllQuestions();

        expect(fetchMock).toHaveBeenCalledWith(
            `${EDUCATION_BASE}/questions`,
            expect.objectContaining({ method: 'GET',}),
        );

        expect(result).toEqual(questions);
    });

    it('creates a assignment without sending a request body', async () => {
        const assignment: Assignment ={
            id: 'assignment-1',
            auth0Id: 'auth0|user-1',
            questionIds: ['question-1', 'question-2'],
            status: 'pending',
            xpAwarded: 0,
            createdAt: '2026-07-27T11:00:00.000Z',
            updatedAt: '2026-07-27T11:00:00.000Z'
        };

        fetchMock.mockResolvedValueOnce(createMockResponse({status: 201, data: assignment}));
        const result = await createMyAssignment();

        expect(fetchMock).toHaveBeenCalledWith(
            `${EDUCATION_BASE}/assignments`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const [, requestOptions] = fetchMock.mock.calls[0];

        expect(requestOptions).not.toHaveProperty('body');
        expect(result).toEqual(assignment);
    });

    it('should return a pending assignment', async () => {
        const assignment: PendingAssignment = {
            id: 'assignment-1',
            auth0Id: 'auth0|user-1',
            questionIds: ['question-1'],
            status: 'pending',
            xpAwarded: 0,
            createdAt: '2026-07-27T11:00:00.000Z',
            updatedAt: '2026-07-27T11:00:00.000Z',
            questions: [
                {
                    id: 'question-1',
                    questionText: 'Which email is sus?',
                    options: [
                        'Option A',
                        'Unexpected password reset email',
                        'Option C',
                    ],
                    createdAt: '2026-07-27T10:00:00.000Z',
                }
            ]
        };

        fetchMock.mockResolvedValueOnce(createMockResponse({data: assignment}));
        const result = await getMyAssignment();

        expect(fetchMock).toHaveBeenCalledWith(
            `${EDUCATION_BASE}/assignment/mine`,
            expect.objectContaining({ method: 'GET', })
        );

        expect(result).toEqual(assignment);
        expect(result?.questions[0]).not.toHaveProperty('correctOptionIndex');
    });

    it('should return null if the user does not have a pening assignment', async () => {
        fetchMock.mockResolvedValueOnce(createMockResponse({data: null}));

        await expect(getMyAssignment()).resolves.toBeNull();
    });

    it('should return the assignment/education history of the authenticated user', async () => {
        const history: Assignment[] = [
            {
                id: 'assignment-1',
                auth0Id: 'auth0|user-1',
                questionIds: ['question-1'],
                status: 'passed',
                xpAwarded: 100,
                completedAt: '2026-07-25T12:00:00.000Z',
                createdAt: '2026-07-25T11:00:00.000Z',
                updatedAt: '2026-07-25T12:00:00.000Z',
            }
        ];

        fetchMock.mockResolvedValueOnce(createMockResponse({data: history}));
        const result = await getMyEducationHistory();

        expect(fetchMock).toHaveBeenCalledWith(
            `${EDUCATION_BASE}/history/mine`,
            expect.objectContaining({ method: 'GET', })
        );

        expect(result).toEqual(history);
    });

    it('submits the assignment ID and the selected indexes', async () => {
        const request: SubmitAnswersRequest ={
            assignmentId: 'assignment-1',
            answers: [0, 2, 1],
        };

        const response: SubmitAnswerResponse = {
            passed: true,
            xpAwarded: 100,
            correctCount: 3,
            total: 3,
            feedback: 'gg wp',
        };

        fetchMock.mockResolvedValueOnce(createMockResponse({data: response}));
        const result = await submitAnswers(request);

        expect(fetchMock).toHaveBeenCalledWith(
            `${EDUCATION_BASE}/answers`,
            {
                method: 'POST',
                body: JSON.stringify(request),
                headers: {
                    'Content-Type': 'application/json'
                },
            },
        );

        expect(result).toEqual(response);
    });

    it('should use backend error message for failed requests', async () => {
        fetchMock.mockResolvedValueOnce(
            createMockResponse({
                ok: false,
                status: 403,
                data: {
                    message: 'Only admins may create questions',
                },
            }),
        );

        const request: CreateQuestionRequest = {
            questionText: 'Test question',
            options: ['Option A', 'Option B'],
            correctOptionIndex: 0,
        };

        await expect(createQuestion(request)).rejects.toThrow(
            'Only admins may create questions',
        );
    });

    it('should use the fallback message when the error response in invalid JSON', async () => {
        fetchMock.mockResolvedValueOnce(
            createMockResponse({
                ok: false,
                status: 500,
                jsonError: new SyntaxError('Invalid JSON'),
            }),
        );

        await expect(getAllQuestions()).rejects.toThrow(
            'Education request failed',
        );
    });
});