import {useEffect, useState, type CSSProperties} from "react";
import { AppLayout } from "../../components/layout/app-layout";
import { Badge, Card, Button } from "../../components/ui";
import { useToast } from "../../context/toast-context";
import { getMyAssignment, submitAnswers, getMyEducationHistory, type Assignment, type PendingAssignment, type SubmitAnswerResponse, type AssignmentStatus } from "../../services/education";

interface TrainingProps {
  onNavigate: (path: string) => void;
  activePath: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error? error.message : 'An error occured.'
}

type TrainingFilter = 'all' | 'not_started' | 'completed';
type SelectedAnswers = Record<string, number>;

function formatDate(date: string): string{
  return new Date(date).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getStatusBadge(status: AssignmentStatus) {
  if (status === 'passed') {
    return <Badge variant='success'>Passed</Badge>
  }
  if (status === 'failed') {
    return <Badge variant='danger'>Failed</Badge>
  }
  return <Badge variant="neutral">Not Started</Badge>
}

export function Training({
  onNavigate, 
  activePath,
}: TrainingProps) {
  const { addToast } = useToast();
  const [assignment, setAssignment] = useState<PendingAssignment | null>(null);
  const [history, setHistory] = useState<Assignment[]>([]);
  const [answers, setAnswers] = useState<SelectedAnswers>({});
  const [result, setResult] = useState<SubmitAnswerResponse | null>(null);
  const [filter, setFilter] = useState<TrainingFilter>('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadEducationData = async (): Promise<void> => {
    const [PendingAssignment, assignmentHistory] = await Promise.all([getMyAssignment(), getMyEducationHistory()]);

    setAssignment(PendingAssignment);
    setHistory(
      assignmentHistory.filter((item) => item.status !== 'pending')
    );
  };

  useEffect(() => {
    const initialisePage = async (): Promise<void> => {
      try {
        setLoading(true);
        await loadEducationData();
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Could not load training',
          message: getErrorMessage(error),
        });
      } finally {
        setLoading(false);
      }
    };

    void initialisePage();
  }, [addToast]);

  const handleSelectAnswer = (
    questionId: string,
    optionIdex: number,
  ): void => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionIdex,
    }));
  };

  const handleSubmitAnswers = async (): Promise<void> => {
    if (!assignment) {
      return;
    }

    const allAnswered = assignment.questions.every((question) => answers[question.id] !== undefined,);

    if (!allAnswered) {
      addToast({
        type: 'warning',
        title: 'Assignment incomplete',
        message: 'Please answer all questions before submitting.',
      });

      return;
    }

    const orderedAnswers = assignment.questions.map(
      (question) => answers[question.id],
    );

    try {
      setSubmitting(true);

      const submissionResult = await submitAnswers({
        assignmentId: assignment.id,
        answers: orderedAnswers,
      });

      setResult(submissionResult);
      setAnswers({});
      setAssignment(null);

      const updatedHistory = await getMyEducationHistory();

      setHistory(updatedHistory.filter((item) => item.status !== 'pending'));

      addToast({
        type: submissionResult.passed ? 'success' : 'warning',
        title: submissionResult.passed ? 'Assignment passed' : 'Assignment completed',
        message: submissionResult.feedback,
      });
    } catch (error){
      addToast({
        type: 'error',
        title: 'Could not submit answerss',
        message: getErrorMessage(error),
      });
    } finally {
      setSubmitting(false);
    }
  };

  //for the three stats at the top of training page
  const completedCount = history.length;
  const passedCount = history.filter((item) => item.status === 'passed').length;
  const totalXp = history.reduce((total, item) => total + item.xpAwarded, 0 ,);

  const allQuestionsAnswered =  assignment !== null && assignment.questions.length > 0 && assignment.questions.every((question) => answers[question.id] !== undefined);

  const answeredCount = assignment
    ? assignment.questions.filter((question) => answers[question.id] !== undefined,).length
    : 0;

  const showHistory = filter === 'all' || filter === 'completed';
  const showPending = filter === 'all' || filter === 'not_started';

  const summaryGridStyle: CSSProperties = {
    display: 'grid',
    gap: 16,
    marginBottom: 16,
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))'
  };

  const summaryCardStyle: CSSProperties = {
    padding: '16px',
  };

  const summaryLabelStyle: CSSProperties = {
    marginBottom: 8,
    fontSize: 11,
    color: 'var(--text-secondary)',
  };

  const summaryValueStyle: CSSProperties = {
    fontSize: 24,
    fontWeight: 800,
  };

  const tabStyle: CSSProperties = {
    display: 'flex',
    width: 'fit-content',
    gap: 4,
    padding: 4,
    marginBottom: 16,
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--bg-card)',
  };

  const tabButtonStyle: CSSProperties = {
    padding: '8px 16px',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 600,
  };

  const contentListStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  };

  const contentCardStyle: CSSProperties = {
    padding: 24,
  };

  const cardHeaderStyle: CSSProperties = {
    display: 'flex',
    gap: 16,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  };

  const titleRowStyle: CSSProperties = {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  };

  const sectionHeaderStyle: CSSProperties = {
    marginBottom: 16,
  };

  const sectionTitleStyle: CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
  };

  const descriptionStyle: CSSProperties = {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 1.5,
    color: 'var(--text-secondary)'
  };

  const progressStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)'
  };

  const questionListStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginTop: 16,
  };

  const questionStyle: CSSProperties = {
    padding: 16,
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-hover)',
  };

  const questionTextStyle: CSSProperties = {
    marginBottom: 12,
    fontSize: 13,
    fontWeight: 700,
  };

  const optionListStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const optionButtonStyle: CSSProperties = {
    width: '100%',
    padding: 8,
    border: '1.5px solid',
    borderRadius: 'var(--radius-md)',
    textAlign: 'left',
    fontSize: 12,
  };

  const optionLetterStyle: CSSProperties = {
    display: 'inline-flex',
    width:21,
    height: 21,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid',
    borderRadius: 'var(--radius-full)',
    fontSize: 10,
    fontWeight: 700,
  };

  const submitRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 16,
  };

  const emptyStateStyle: CSSProperties = {
    padding: '24px 12px',
    textAlign: 'center',
  };

  const emptyMessageStyle: CSSProperties = {
    padding: '24px 12px',
    textAlign: 'center',
    fontSize: 12,
    color: 'var(--text-muted)',
  };

  const resultSummaryStyle: CSSProperties = {
    minWidth: 90,
    textAlign: 'right',
  };

  const resultScoreStyle: CSSProperties = {
    fontSize: 18,
    fontWeight: 700,
  };

  const smallTextStyle: CSSProperties = {
    marginTop: 8,
    fontSize: 11,
    color: 'var(--text-muted)',
  };

  const historyListStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const historyItemStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    padding: '12px 16px',
    alignItems: 'center',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-hover)',
    flexWrap: 'wrap',
  };

  const historyTitleStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
  };

  const historyXpStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
  };

  return(
    <AppLayout
      activePath={activePath}
      onNavigate={onNavigate}
      title="Training"
      subtitle="Complete assignments and earn XP"
      securityScore={72}
    >
      <div style={summaryGridStyle}>
        <Card style={summaryCardStyle}>
          <p style={summaryLabelStyle}>
            Completed
          </p>
          <p style={summaryValueStyle}>
            {completedCount}
          </p>
        </Card>

        <Card style={summaryCardStyle}>
          <p style={summaryLabelStyle}>
            Passed
          </p>
          <p 
            style={{
              ...summaryValueStyle,
              color: 'var(--color-success)',
            }}
          >
            {passedCount}
          </p>
        </Card>

        <Card style={summaryCardStyle}>
          <p style={summaryLabelStyle}>
            Training XP
          </p>
          <p 
            style={{
              ...summaryValueStyle,
              color: 'var(--color-primary)',
            }}
          >
            {totalXp}
          </p>
        </Card>
      </div>

      <div style={tabStyle}>
        {(
          [
            {value: 'all', label: 'All'},
            {value: 'not_started', label: 'Not Started'},
            {value: 'completed', label: 'Completed'},
          ] as const
        ).map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            style={{
              ...tabButtonStyle,
              background: filter === tab.value ? 'var(--color-primary)' :'transparent',
              color: filter === tab.value ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Card style={contentCardStyle}>
          <p style={emptyMessageStyle}>
            Loading assignments...
          </p>
        </Card>
      ) : (
        <div style={contentListStyle}>
          {showPending && assignment && (
            <Card style={contentCardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <div style={titleRowStyle}>
                    <h2 style={sectionHeaderStyle}>
                      Security Awareness Assignment
                    </h2>

                    <Badge variant="neutral">
                      Not Started
                    </Badge>
                  </div>

                  <p style={descriptionStyle}>
                    Answer all questions before submitting.
                  </p>
                </div>

                <p style={progressStyle}>
                  {answeredCount}/{assignment.questions.length} answered
                </p>
              </div>

              <div style={questionListStyle}>
                {assignment.questions.map(
                  (question, questionIndex) => (
                    <div 
                      key={question.id}
                      style={questionStyle}
                    >
                      <p style={questionTextStyle}>
                        {questionIndex + 1}.{' '}
                        {question.questionText}
                      </p>

                      <div style={optionListStyle}>
                        {question.options.map(
                          (option, optionIndex) => {
                            const isSelected = answers[question.id] === optionIndex;

                            return(
                              <button
                                key={`${question.id}-${optionIndex}`}
                                type="button"
                                style={{
                                  ...optionButtonStyle,
                                  fontWeight: isSelected? 600 : 400,
                                  borderColor: isSelected ? 'var(--color-primary)' : 'var(--border)',
                                  background: isSelected ? 'var(--color-primary-light)' : 'var(--bg-input)',
                                  color: isSelected ? 'var(--color-primary)' : 'var(--text-secodary)',
                                }}
                                onClick={() =>
                                  handleSelectAnswer(question.id, optionIndex)
                                }
                              >
                                <span
                                  style={{
                                    ...optionLetterStyle,
                                    borderColor: isSelected ? 'var(--color-primary)' : 'var(--border)',
                                    background: isSelected ? 'var(--color-primary)' : 'transparent',
                                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                                  }}
                                >
                                  {String.fromCharCode(65 + optionIndex)} {/*this convers a index number to uppercase letter (A,B,C,D)*/}
                                </span>

                                {option}
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>

              <div style={submitRowStyle}>
                <Button
                  loading={submitting}
                  disabled={!allQuestionsAnswered || submitting}
                  onClick={() => {
                    void handleSubmitAnswers();
                  }}
                >
                  Submit Answers
                </Button>

              </div>
            </Card>
          )}

          {showPending && !assignment && (
            <Card style={contentCardStyle}>
              <div style={emptyStateStyle}>
                <h2 style={sectionTitleStyle}>
                  No assignments available
                </h2>

                <p style={descriptionStyle}>
                  You do not currently have any pending assignments.
                </p>
              </div>
            </Card>
          )}

          {showHistory && result && (
            <Card style={contentCardStyle}>
              <div style={cardHeaderStyle}>
                <div>
                  <div style={titleRowStyle}>
                    <h2 style={sectionTitleStyle}>
                      Assignment Result
                    </h2>

                    <Badge
                      variant={result.passed ? 'success': 'danger'}
                    >
                      {result.passed ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>

                  <div style={resultSummaryStyle}>
                    <p style={resultScoreStyle}>
                      {result.correctCount}/{result.total}
                    </p>

                    <p style={smallTextStyle}>
                      {result.xpAwarded} XP earned
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {showHistory && (
            <Card style={contentCardStyle}>
              <div style={sectionHeaderStyle}>
                <h2 style={sectionTitleStyle}>
                  Completed Assignments
                </h2>

                <p style={descriptionStyle}>
                  Your previous assignments.
                </p>
              </div>

              {history.length === 0 ? (
                <p style={emptyMessageStyle}>
                  You have not completed any assignments yet.
                </p>
              ) : (
                <div style={historyListStyle}>
                  {history.map((item, index) => (
                    <div
                      style={historyItemStyle}
                      key={item.id}
                    >
                      <div>
                        <div style={titleRowStyle}>
                          <p style={historyTitleStyle}>
                            Assignment{' '}
                            {history.length - index}
                          </p>
                          {getStatusBadge(item.status)}
                        </div>

                        <p style={smallTextStyle}>
                          Created{' '}
                          {formatDate(item.createdAt)}
                          {item.completedAt ? `Completed ${formatDate(item.completedAt,)}` : ''}
                        </p>
                      </div>

                      <p style={{
                          ...historyXpStyle,
                          color: item.xpAwarded > 0 ? 'var(--color-success)' : 'var(--text-secondary)'
                        }}
                      >
                        {item.xpAwarded} XP
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </AppLayout>
  );
}