import { useState, useEffect, useMemo, useCallback, type CSSProperties } from "react";
import { AppLayout } from "../../components/layout/app-layout";
import { Button, Card, Input, Select, Badge } from '../../components/ui';
import { useToast } from "../../context/toast-context";
import { deleteEmailTemplate, getEmailTemplates, updateEmailTemplate, type EmailTemplate, type UpdateEmailTemplateRequest } from "../../services/email-template";
import type { EmailDifficulty } from "../../services/send-batch-email";

interface ManageEmailTemplatesProps {
    readonly onNavigate: (path: string) => void;
    readonly activePath: string;
}

interface TemplateForm {
    sender: string;
    alias: string;
    subject: string;
    content: string;
    difficulty: EmailDifficulty;
}

type FormErrors = Partial<Record<keyof TemplateForm, string>>;

const DIFFICULTY_OPTIONS = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
];

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i; //got regex from https://www.geeksforgeeks.org/javascript/how-to-validate-email-address-using-regexp-in-javascript/

export function ManageEmailTemplates({
    onNavigate,
    activePath,
}: ManageEmailTemplatesProps){
    const { addToast } = useToast();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedReference, setSelectedReference] = useState('');
    const [form, setForm] = useState<TemplateForm | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);

        try {
            const result = await getEmailTemplates();
            setTemplates(result);
        } catch (error) {
            console.error(error);

            addToast({
                type: 'error',
                title: 'Could not load templates',
                message: error instanceof Error ? error.message : 'Email templates could not be loaded.',
            });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        void fetchTemplates();
    }, [fetchTemplates]);

    const selectedTemplate = useMemo(
        () => 
            templates.find(
                (template) => template.referenceNumber === selectedReference,
            ) ?? null,
        [templates, selectedReference]
    );

    const templateOptions = useMemo(
        () => [
            {
                value: '',
                label: 'Select an email template',
            },
            ...templates.map((template) => ({
                value: template.referenceNumber,
                label: `${template.referenceNumber} - ${template.subject}`,
            })),
        ],
        [templates]
    );

    const handleTemplateSelection = (referenceNumber: string) => {
        setSelectedReference(referenceNumber);
        setErrors({});
    
        const template = templates.find(
            (item) => item.referenceNumber === referenceNumber,
        );

        if (!template) {
            setForm(null);
            return;
        }

        setForm({
            sender: template.sender,
            alias: template.alias ?? '',
            subject: template.subject,
            content: template.content,
            difficulty: template.difficulty,
        });
    };

    const setField = <K extends keyof TemplateForm>(
        field: K,
        value: TemplateForm[K],
    ) => {
        setForm((previous) =>
            previous 
            ? {
                ...previous,
                [field]: value,
            }
            : previous,
        );
        setErrors((previous) => ({
            ...previous,
            [field]: undefined,
        }));
    };

    const validateForm = (): boolean => {
        if (!form) {
            return false;
        }

        const nextErrors: FormErrors = {};

        if (!form.sender.trim()) {
            nextErrors.sender = 'Sender email is required.'
        } else if (!EMAIL_PATTERN.test(form.sender.trim())) {
            nextErrors.sender = 'Enter a valid sender email address.';
        }

        if (!form.subject.trim()) {
            nextErrors.subject = 'Subject is required.';
        }

        if (!form.content.trim()) {
            nextErrors.content = 'Email body is required.';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSave = async () => {
        if (!form || !validateForm() || !selectedTemplate){
            return;
        }

        setSaving(true);

        try {
            const request: UpdateEmailTemplateRequest = {
                sender: form.sender.trim(),
                alias: form.alias.trim() || undefined,
                subject: form.subject.trim(),
                content: form.content.trim(),
                difficulty: form.difficulty,
            };

            const updated = await updateEmailTemplate(
                selectedTemplate.referenceNumber,
                request,
            );

            setTemplates((previous) => 
                previous.map((template) => 
                    template.referenceNumber === updated.referenceNumber ? updated : template,
                )
            );

            setForm({
                sender: updated.sender,
                alias: updated.alias ?? '',
                subject: updated.subject,
                content: updated.content,
                difficulty: updated.difficulty,
            });

            addToast({
                type: 'success',
                title: 'Template updated',
                message: `${updated.referenceNumber} was updated successfully.`,
            });
        } catch (error) {
            console.error(error);

            addToast({
                type: 'error',
                title: 'Template update failed',
                message: error instanceof Error ? error.message : 'Email template could not be updated.'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedTemplate) {
            return;
        }

        const confirmed = window.confirm(`Delete ${selectedTemplate.referenceNumber}? This cannot be undone.`);

        if (!confirmed) {
            return;
        }

        setDeleting(true);

        try {
            await deleteEmailTemplate(selectedTemplate.referenceNumber);

            setTemplates((previous) =>
                previous.filter(
                    (template) =>
                        template.referenceNumber !== selectedTemplate.referenceNumber,
                )
            );

            setSelectedReference('');
            setForm(null);
            setErrors({});

            addToast({
                type: 'success',
                title: 'Template deleted',
                message: `${selectedTemplate.referenceNumber} was deleted.`
            });
        }catch (error) {
            console.error(error);

            addToast({
                type: 'error',
                title: 'Template deletion failed',
                message: error instanceof Error ? error.message : 'The email template could not be deleted.',
            });
        } finally {
            setDeleting(false);
        }
    };

    const labelStyle: CSSProperties = {
        display: 'block',
        marginBottom: 8,
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-primary)',
        fontFamily: 'Inter, system-ui, sans-serif',
    }

    const errorStyle: CSSProperties = {
        marginTop: 4,
        fontSize: 11,
        color: 'var(--color-danger)',
        fontFamily: 'Inter, system-ui, sans-serif',
    }

    return(
        <AppLayout
            activePath={activePath}
            onNavigate={onNavigate}
            title='Manage Email Templates'
            subtitle="Edit or delete phishing email templates"
            breadcrumbs={[
                {
                    label: 'Emails',
                    path: '/emails',
                },
                {
                    label: 'Manage Templates',
                },
            ]}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: 900,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                }}
            >
                <Card style={{ padding: 24}}>
                    <div
                        style={{
                            display: 'flex',
                            gap: 16,
                            justifyContent: 'space-between',
                            alignContent: 'flex-end',
                            flexWrap: 'wrap',
                        }}
                    >
                        <div style={{flex: 1, minWidth: 240}}>
                            <Select
                                label="Email template"
                                value={selectedReference}
                                options={templateOptions}
                                disabled={loading}
                                onChange={(event) => handleTemplateSelection(event.target.value)}
                            />
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                            alignSelf: 'flex-end',
                        }}>
                            <Button
                                variant="ghost"
                                loading={loading}
                                disabled={loading}
                                onClick={() => void fetchTemplates()}
                            >
                                Refresh
                            </Button>

                            <Button
                                onClick={() => onNavigate('/emails/create-email')}
                            >
                                Create New Template
                            </Button>
                        </div>
                    </div>
                </Card>

                {form && selectedTemplate ? (
                    <Card style={{ padding: 24}}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap:12,
                                marginBottom: 24,
                                flexWrap: 'wrap',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        marginBottom: 4,
                                        color: 'var(--text-muted)'
                                    }}
                                >
                                    Reference number
                                </div>

                                <code
                                    style={{
                                        fontSize:14,
                                        fontWeight: 700,
                                        color: 'var(--color-primary)'
                                    }}
                                >
                                    {selectedTemplate?.referenceNumber}
                                </code>
                            </div>

                            <Badge
                                variant={form?.difficulty === 'easy' ? "success" : form?.difficulty === 'medium' ? "warning" : 'danger'}
                            >
                                {form?.difficulty}
                            </Badge>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 16,
                            }}
                        >
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                    gap: 12,
                                }}
                            >
                                <Input
                                    label="Sender email"
                                    value={form.sender}
                                    error={errors.sender}
                                    onChange={(event) => setField('sender', event.target.value)}

                                />
                                <Input
                                    label='Display name (Optional)'
                                    value={form.alias}
                                    onChange={(event) => setField('alias', event.target.value)}
                                />
                            </div>

                            <Input
                                label="Email subject"
                                value={form.subject}
                                error={errors.subject}
                                onChange={(event) => setField('subject', event.target.value)}
                                required
                            />

                            <div>
                                <label style={labelStyle}>
                                    Email body{''}
                                    <span
                                        style={{
                                            color: 'var(--color-danger)'
                                        }}
                                    >
                                        *
                                    </span>
                                </label>

                                <textarea
                                    rows={12}
                                    value={form.content}
                                    onChange={(event) => setField('content', event.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: 12,
                                        border: `1.5px solid ${errors.content ? "var(--color-danger)" : "var(--border)"}`,
                                        borderRadius: 8,
                                        outline: 'none',
                                        background: 'var(--bg-input)',
                                        color: 'var(--text-primary)',
                                        resize: 'vertical',
                                        fontSize: 13,
                                        lineHeight: 1.5,
                                        fontFamily: 'Inter, system-ui, sans-serif'
                                    }}
                                />

                                {errors.content && (
                                    <p style={errorStyle}>
                                        {errors.content}
                                    </p>
                                )}
                            </div>

                            <Select
                                label="Difficulty"
                                value={form.difficulty}
                                options={DIFFICULTY_OPTIONS}
                                onChange={(event) => setField('difficulty', event.target.value as EmailDifficulty)}
                            />
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 12,
                                marginTop: 24,
                                paddingTop: 16,
                                borderTop: '1px solid var(--border)',
                                flexWrap: 'wrap'
                            }}
                        >
                            <Button
                                variant="ghost"
                                disabled={saving || deleting}
                                style={{ color: 'var(--color-danger)'}}
                                onClick={() => void handleDelete()}
                            >
                                {deleting ? 'Deleting...' : 'Delete Template'}
                            </Button>

                            <Button
                                loading={saving}
                                disabled={saving || deleting}
                                onClick={() => void handleSave()}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <Card style={{padding: 24}}>
                        <div
                            style={{
                                textAlign: 'center',
                                color: 'var(--text-muted)',
                                padding: 24,
                            }}
                        >
                            {loading ? 'Loading email templates...' : 'Select an email template above to edit or delete it.'}
                        </div>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}