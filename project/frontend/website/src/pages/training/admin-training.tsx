import {useEffect, useState, type CSSProperties} from "react";
import { AppLayout } from "../../components/layout/app-layout";
import { Badge, Card, Button, Input, Select } from "../../components/ui";
import { useToast } from "../../context/toast-context";
import { createQuestion, getAllQuestions, type Question } from "../../services/education";

interface AdminTrainingProps {
  onNavigate: (path: string) => void;
  activePath: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error? error.message : 'An error occured.'
}

export function AdminTraining({
  onNavigate, 
  activePath,
}: AdminTrainingProps) {
    const { addToast } = useToast();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const loadQuestions = async (): Promise<void> => {
            try {
                setLoading(true);
                setQuestions(await getAllQuestions());
            }catch (error) {
                addToast({
                    type: 'error',
                    title: 'Could not load questions',
                    message: getErrorMessage(error),
                });
            } finally {
                setLoading(false);
            }
        };
        void loadQuestions();
    }, [addToast]);

    const updateOption = (
        optionIndex: number,
        value: string,
    ): void => {
        setOptions((previous) =>
            previous.map((option, index) =>
                index === optionIndex ? value: option,
            ),
        );
    };

    const handleCreateQuestion = async (): Promise<void> => {
        const trimmedQuestion = questionText.trim();
        const completedOptions = options
            .map((option, originalIndex) => ({
                value: option.trim(),
                originalIndex,
            }))
            .filter((option) => option.value.length > 0);

        if (!trimmedQuestion || completedOptions.length < 2) {
            addToast({
                type: 'warning',
                title: 'Incomplete question',
                message: 'Enter the question and at least two options.'
            });

            return;
        }

        const newCorrectOptionIndex = completedOptions.findIndex(
            (option) => option.originalIndex === correctOptionIndex,
        );

        if (newCorrectOptionIndex === -1) {
            addToast({
                type: 'warning',
                title: 'Select a correct answer',
                message: 'The selected correct answer may not be an empty option.'
            });

            return;
        }

        const trimmedOptions = completedOptions.map((option) => option.value,);

        try {
            setSubmitting(true);

            const createdQuestion = await createQuestion({
                questionText: trimmedQuestion,
                options: trimmedOptions,
                correctOptionIndex: newCorrectOptionIndex,
            });

            setQuestions((previous) => [
                createdQuestion,
                ...previous,
            ]);
            setQuestionText('');
            setOptions(['','','','']);
            setCorrectOptionIndex(0);

            addToast({
                type: 'success',
                title: 'Question Added',
                message: 'Question was added to the question bank.'
            });
        } catch (error) {
            addToast({
                type: 'error',
                title: 'Could not add question',
                message: getErrorMessage(error)
            });
        } finally {
            setSubmitting(false);
        }
    };

    const pageStyle: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    };

    const formStyle: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    };

    const cardStyle: CSSProperties = {
        padding: 24,
    };

    const titleStyle: CSSProperties = {
        marginBottom: 16,
        fontSize: 17,
        fontWeight: 700,
    };

    const labelStyle: CSSProperties = {
        display: 'block',
        marginBottom: 8,
        fontSize: 12,
        fontWeight: 600,
    };

    const textAreaStyle: CSSProperties = {
        width: '100%',
        padding: 12,
        border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-input)',
        color: 'var(--text-primary)',
        fontSize: 13,
        resize: 'vertical',
    };

    const optionGridStyle: CSSProperties = {
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    };

    const buttonRowStyle: CSSProperties = {
        display: 'flex',
        justifyContent: 'flex-end',
    };

    const headerStyle: CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        gap:16,
        alignItems: 'center',
    };

    const questionsListStyle: CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    };

    const messageStyle: CSSProperties = {
        padding: 24,
        textAlign: 'center',
        color: 'var(--text-muted)',
    };

    const questionStyle: CSSProperties = {
        padding: 16,
        background: 'var(--bg-hover)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
    };

    const questionsTextStyle: CSSProperties = {
        marginBottom: 8,
        fontSize: 13,
        fontWeight: 700,
    };

    const optionStyle: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 0',
        fontSize: 12
    };

    const letterOptionStyle: CSSProperties = {
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: 22,
        height: 22,
        fontSize: 10,
        fontWeight: 700,
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-full)',
    };

    return(
        <AppLayout
            activePath={activePath}
            onNavigate={onNavigate}
            title="Training"
            subtitle="Add questions and view question bank"
            securityScore={72}
        >
            <div style={pageStyle}>
                <Card style={cardStyle}>
                    <h2 style={titleStyle}>
                        Add New Question
                    </h2>

                    <div style={formStyle}>
                        <div>
                            <label style={labelStyle}>
                                Question
                            </label>

                            <textarea
                                style={textAreaStyle}
                                value={questionText}
                                rows={3}
                                placeholder="Enter the question"
                                onChange={(event) =>
                                    setQuestionText(event.target.value)
                                }
                            />
                        </div>

                        <div style={optionGridStyle}>
                                {options.map((option, optionIndex) => (
                                    <Input
                                        key={optionIndex}
                                        label={`Option${String.fromCharCode(65 + optionIndex)}`} 
                                        value={option}
                                        onChange={(event) => updateOption(optionIndex, event.target.value,)}
                                    />
                                ))}
                        </div>

                        <Select
                            label="Correct answer"
                            value={String(correctOptionIndex)}
                            onChange={(event) => setCorrectOptionIndex(Number(event.target.value))}
                            options={options.map((_, optionIndex) => ({
                                value: String(optionIndex),
                                label: `Option${String.fromCharCode(65 + optionIndex)}`, 
                            }))}
                        />

                        <div style={buttonRowStyle}>
                            <Button
                                disabled={submitting}
                                loading={submitting}
                                onClick={() => {
                                    void handleCreateQuestion();
                                }}
                                style={{padding: '8px 16px',}}
                            >
                                Add Question
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card style={cardStyle}>
                    <div style={headerStyle}>
                        <h2 style={titleStyle}>
                            Question Bank
                        </h2>

                        <Badge variant="primary">
                                {questions.length}{' '}{'Questions'}
                        </Badge>
                    </div>

                    {loading ? (
                        <p style={messageStyle}>
                            Loading questions...
                        </p>
                    ) : questions.length === 0 ? (
                        <p>
                            No questions have been added.
                        </p>
                    ) : (
                        <div style={questionsListStyle}>
                            {questions.map((question, questionIndex) => (
                                <div
                                    style={questionStyle}
                                    key={question.id}
                                >
                                    <p style={questionsTextStyle}>
                                        {questionIndex + 1}.{' '}
                                        {question.questionText}
                                    </p>

                                    {question.options.map(
                                        (option, optionIndex) => (
                                            <div
                                                key={`${question.id}-${optionIndex}`}
                                                style={optionStyle}
                                            >
                                                <span style={letterOptionStyle}>
                                                    {String.fromCharCode(65 + optionIndex)}
                                                </span>

                                                <span style={{flex: 1}}>
                                                    {option}
                                                </span>

                                                {optionIndex === question.correctOptionIndex && (
                                                    <Badge variant="success">
                                                        Correct
                                                    </Badge>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}