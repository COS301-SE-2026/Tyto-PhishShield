import { useState, useMemo, useEffect, useCallback } from "react";
import { AppLayout } from "../../components/layout/app-layout";
import { Button, Card, Input, Select, Badge } from '../../components/ui';
import { useToast } from "../../context/toast-context";
import { getEmailTemplate, getEmailTemplates, type EmailTemplate } from "../../services/email-template";
import { sendBatchWithReference } from "../../services/send-batch-email";

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i; //regex validates email. got it from https://dirask.com/posts/TypeScript-validate-email-with-regex-Dn40Ej.

interface SendEmailProps {
    onNavigate: (path: string) => void;
    activePath: string;
}

interface FormErrors {
    referenceNumber?: string;
    recipients?: string;
}

function parseRecipients(value: string): string[] {
    return[
        ...new Set(
            value
                .split(/[,;]+/) //recipients email addresses can be seperated by a comma or a semicolon
                .map((recipient) => recipient.trim())
                .filter(Boolean),
        ),
    ];
}

function formatSender(template: EmailTemplate): string{
    if (template.alias) {
        return `${template.alias} <${template.sender}>`;
    }

    return template.sender;
}

function getDifficultyVariant(difficulty: EmailTemplate['difficulty']): 'success' | 'warning' |'danger' {
    if (difficulty === 'easy'){
        return 'success';
    }

    if (difficulty === 'medium'){
        return 'warning';
    }

    return 'danger'
}

export function SendEmail({
    onNavigate,
    activePath,
}: SendEmailProps){
    const {addToast} = useToast();

    const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
    const [referenceInput, setReferenceInput] = useState('');
    const [selectedReference, setSelectedReference] = useState('');
    const [selectedEmail, setSelectedEmail] = useState<EmailTemplate | null>(null);
    const [recipientsInput, setRecipientsInput] = useState('');
    const [sending, setSending] = useState(false);
    const [templateLoading, setTemplateLoading] = useState(false);
    const [templatesLoading, setTemplatesLoading] = useState(true);

    const [errors, setErrors] = useState<FormErrors>({});

    const parsedRecipients = useMemo(
        () =>
            parseRecipients(recipientsInput),
        [recipientsInput],
    );

    const invalidRecipients = useMemo(
        () =>
            parsedRecipients.filter(
                (recipient) => !EMAIL_PATTERN.test(recipient),
            ),
        [parsedRecipients],
    );

    const templateOptions = useMemo(
        () => [
            {
                value: '',
                label: 'Please select an available email template',
            },
            ...emailTemplates.map((template) => ({
            value: template.referenceNumber,
            label: `${template.referenceNumber} — ${template.subject}`,
        })),
       ],
       [emailTemplates],
    );

    const fetchEmailTemplates = useCallback(async () => {
        setTemplatesLoading(true);

        try {
            const availableTemplates = await getEmailTemplates();

            setEmailTemplates(availableTemplates);

            if (availableTemplates.length === 0) {
                addToast({
                    type: 'warning',
                    title: 'No email templates available',
                    message:
                        'Create a template before attempting to send an email.'
                });
            }
        } catch (error) {
            console.error(error);

            addToast({
                type: 'error',
                title: 'Could not load email templates',
                message:
                error instanceof Error ? error.message : 'Available email templates could not be loaded.'
            });
        } finally{
            setTemplatesLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        void fetchEmailTemplates();
    }, [fetchEmailTemplates]);

    const handleTemplateSelection = (referenceNumber: string) => {
        setSelectedReference(referenceNumber);

        setErrors((previous) => ({
            ...previous,
            referenceNumber: undefined,
        }));

        if (!referenceNumber) {
            setSelectedEmail(null);
            return;
        }

        const template = emailTemplates.find(
            (emailTemplate) => emailTemplate.referenceNumber === referenceNumber,
        );

        if  (!template) {
            setSelectedEmail(null);

            setErrors((previous) => ({
                ...previous,
                referenceNumber: 'The selected email template not found.'
            }));

            return;
        }

        setSelectedEmail(template);
    };

    const handleReferenceLookup = async () => {
        const cleanedReference = referenceInput.trim().toUpperCase();

        if (!cleanedReference) {
            setErrors((previous) => ({
                ...previous,
                referenceNumber: 'Enter a reference number.'
            }));

            return;
        }

        setTemplateLoading(true);

        try{
            const template = await getEmailTemplate(cleanedReference);

            setSelectedEmail(template);
            setSelectedReference(template.referenceNumber);
            setReferenceInput(template.referenceNumber);

            setErrors((previous) => ({
                ...previous,
                referenceNumber: undefined,
            }));

            if (!emailTemplates.some((emailTemplate) => emailTemplate.referenceNumber === template.referenceNumber)){
                setEmailTemplates((previous) => [
                    ...previous,
                    template,
                ]);
            }

            addToast({
                type: 'success',
                title: 'Email template found',
                message: `${template.referenceNumber} is ready to use.`,
            });
        } catch (error){
            console.error(error);

            setSelectedEmail(null);
            setSelectedReference('');

            const message = error instanceof Error ? error.message : `No template was found for ${cleanedReference}.`;

            setErrors((previous) => ({
                ...previous,
                referenceNumber: message,
            }));

            addToast({
                type: 'error',
                title: 'Email template not found',
                message,
            });
        } finally {
            setTemplateLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const nextErrors: FormErrors = {};

        if (!selectedEmail) {
            nextErrors.referenceNumber = 'Select or find a email template.';
        }

        if (parsedRecipients.length === 0) {
            nextErrors.recipients = 'Enter at least one recipient email address.';
        } else if (invalidRecipients.length > 0) {
            nextErrors.recipients = `Invalid email address${
                invalidRecipients.length === 1 ? '' : 'es'
            }: ${invalidRecipients.join(', ')}`;
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const handleSend = async () => {
        if (!validateForm() || !selectedEmail){
            return;
        }

        setSending(true);

        try {
            await sendBatchWithReference(selectedEmail.referenceNumber, parsedRecipients);

            addToast({
                type: 'success',
                title: 'Email sent',
                message: `${selectedEmail.referenceNumber} was sent to ${parsedRecipients.length} recipient ${parsedRecipients.length === 1 ? '' : 's'}.`,
            });
        } catch (error) {
            console.error(error);

            addToast({
                type: 'error',
                title: 'Email sending failed',
                message:
                    error instanceof Error ? error.message : 'The email could not be sent.',
            });
        }finally{
            setSending(false);
        }
    };

    return (
        <AppLayout
            activePath={activePath}
            onNavigate={onNavigate}
            title='Send Email with Reference Number'
            breadcrumbs={[
                {
                    label: 'Campaigns',
                    path: '/campaigns',
                },
                {
                    label: 'Send Existing Email'
                }
            ]}
            securityScore={72}
        >
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
                <div className="flex flex-col gap-6">
                    <Card className="p-6">
                        <div className="mb-5">
                            <h2 className="text-base font-semibold text-[var(--text-primary)]">
                                Email Template
                            </h2>
                            <Select
                                label='Available email templates'
                                value={selectedReference}
                                onChange={(event) => handleTemplateSelection(event.target.value)}
                                options={templateOptions}
                                disabled={templateLoading}
                            />
                            
                            <div>
                                <Button
                                    variant="ghost"
                                    loading={templatesLoading}
                                    disabled={templatesLoading}
                                    onClick={() => void fetchEmailTemplates()}
                                >
                                    Refresh Templates
                                </Button>
                            </div>
                        </div>
                                
                        <div className="my-6 flex items-center gap-3">
                            <div className="h-px flex-1 bg-[var(--border)]" />
                                <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                                    Or
                                </span>
                            <div className="h-px flex-1 bg-[var(--border)]" />
                        </div>

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                            <div className="flex-1">
                                <Input
                                    label='Find by reference number'
                                    placeholder=""
                                    value={referenceInput}
                                    error={errors.referenceNumber}
                                    onChange={(event) => {
                                        setReferenceInput(
                                            event.target.value.toUpperCase()
                                        );
                                        setErrors((previous) => ({
                                            ...previous,
                                            referenceNumber: undefined,
                                        }));
                                    }}
                                />
                            </div>

                            <Button
                                variant="ghost"
                                loading={templateLoading}
                                disabled={templateLoading || !referenceInput.trim()}
                                onClick={() => void handleReferenceLookup()}
                            >
                                Find Template
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="mb-4">
                            <h2 className="text-base font-semibold text-[var(--text-primary)]">
                            Recipients
                            </h2>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                Separate multiple addresses with commas or semicolons.
                            </p>
                        </div>

                        <textarea
                            id="recipients"
                            rows={5}
                            placeholder='user1@example.com, user2@example.com'
                            value={recipientsInput}
                            onChange={(event) => {
                                setRecipientsInput(event.target.value);

                                setErrors((previous) => ({
                                    ...previous,
                                    recipients: undefined,
                                }));
                            }}
                            className={`w-full resize-y rounded-lg border bg-[var(--bg-input)] px-3 py-2 text-sm leading-6 text-[var(--text-primary)] outline-none ${
                                errors.recipients ? 'border-[var(--color-danger)]' : 'border-[var(--border)]'
                            }`}
                        />

                        {errors.recipients && (
                            <p className="mt-2 text-xs text-[var(--color-danger)]">
                                {errors.recipients}
                            </p>
                        )}

                        {parsedRecipients.length > 0 && (
                            <div className="mt-4 flex items-center gap-2">
                                <Badge
                                    variant={
                                        invalidRecipients.length > 0 ? 'danger': 'success'
                                    }
                                >
                                    {parsedRecipients.length}{' '}
                                    {parsedRecipients.length ===1 ? 'recipient': 'recipients'}
                                </Badge>

                            {invalidRecipients.length > 0 && (
                                <span className="text-xs text-[var(--color-danger)]">
                                    {invalidRecipients.length} invalid
                                </span>
                            )}
                            </div>
                        )}
        
                    </Card>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                            variant='ghost'
                            onClick={() => onNavigate('/campaigns')}
                        >
                            Cancel
                        </Button>

                        <Button
                            loading={sending}
                            disabled={sending||templateLoading||!selectedEmail|| parsedRecipients.length === 0 || invalidRecipients.length > 0}
                            onClick={() => void handleSend()}
                        >
                            Send Email
                        </Button>
                    </div>
                </div>

                <Card className="overflow-hidden xl:sticky xl:top-6">
                    <div className="border-b border-[var(--border)] px-6 py-5">
                        <h2>
                            Email Preview
                        </h2>

                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            Review the selected template
                        </p>
                    </div>
                    
                    <div className="p-6">
                    {templateLoading ? (
                        <div className="flex min-h-72 items-center justify-center">
                            <p>
                                Loading template...
                            </p>
                        </div>
                    ) : selectedEmail ? (
                        <div className="flex flex-col gap-5">
                            <div>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Reference
                                </p>

                                <code className="text-sm font-bold text-[var(--color-primary)]">
                                    {selectedEmail.referenceNumber}
                                </code>
                            </div>

                            <div>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Sender
                                </p>

                                <p className="text-sm text-[var(--text-primary)]">
                                    {formatSender(selectedEmail)}
                                </p>
                            </div>

                            <div>
                                <p className="mb-1 text-xs text-[var(--text-muted)]">
                                    Difficulty
                                </p>

                                <Badge
                                    variant={getDifficultyVariant(
                                        selectedEmail.difficulty,
                                    )}
                                >
                                    {selectedEmail.difficulty}
                                </Badge>
                            </div>

                            <div>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Subject
                                </p>

                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                    {selectedEmail.subject}
                                </p>
                            </div>

                            <div className="border-t border-[var(--border)] pt-4">
                                <div className="max-h-[416px] overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-[var(--text-secondary)]">
                                    {selectedEmail.content}
                                </div>
                            </div>
                        </div>
                    ):(
                        <p className="py-12 text-center text-sm text-[var(--text-muted)]">
                            Select or find an email template.
                        </p>
                    )}
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}

