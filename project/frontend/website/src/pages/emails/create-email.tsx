import { useState, type CSSProperties, useRef } from "react";
import { AppLayout } from "../../components/layout/app-layout";
import { Button, Card, Input, Select } from '../../components/ui';
import { useToast } from "../../context/toast-context";
import type { EmailDifficulty } from "../../services/send-batch-email";
import { createEmailTemplate, type CreateEmailTemplateRequest, type EmailTemplate } from '../../services/email-template';

interface CreateEmailProps {
    onNavigate: (path: string) => void;
    activePath: string;
}

interface EmailForm {
    sender: string;
    alias: string;
    subject: string;
    content: string;
    difficulty: EmailDifficulty;
}

type EmailFormErrors = Partial<Record<keyof EmailForm, string>>;

const DIFFICULTY_OPTIONS = [
    {
        value: 'easy',
        label: 'Easy',
    },
    {
        value: 'medium',
        label: 'Medium',
    },
    {
        value: 'hard',
        label: 'Hard',
    },
];

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i; //regex validates email. got it from https://dirask.com/posts/TypeScript-validate-email-with-regex-Dn40Ej.

const initialForm: EmailForm = {
    sender: '',
    alias: '',
    subject: '',
    content: '',
    difficulty: 'medium',
}

export function CreateEmail({
  onNavigate,
  activePath,
}: CreateEmailProps) {
  const { addToast } = useToast();

  const [form, setForm] = useState<EmailForm>(initialForm);
  const [errors, setErrors] = useState<EmailFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [createdTemplate, setCreatedTemplate] =
    useState<EmailTemplate | null>(null);
  const [copying, setCopying] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const placeholders = [
    {label: 'Name', value: '{{name}}'},
    {label: 'Department', value: '{{department}}'},
    {label: 'Business name', value: '{{business_name}}'},
    {label: 'Tracking link', value: '{{tracking_link}}'},
  ];

  const insertPlaceholder = (placeholder: string) => {
    const textarea = contentRef.current;

    if (!textarea){
        return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = form.content.slice(0, start) + placeholder + form.content.slice(end);

    setField('content', newContent);
    requestAnimationFrame(() => {
        const cursorPosition = start + placeholder.length;
        textarea.focus();
        textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  }

  const setField = <K extends keyof EmailForm>(
    field: K,
    value: EmailForm[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));
  };

    const validateForm = (): boolean =>{
        const nextErrors: EmailFormErrors = {};

        if (!form.sender.trim()){
            nextErrors.sender = 'Sender email is required. eg. test@capstone-five-guys.dns.net.za';
        } else if (!EMAIL_PATTERN.test(form.sender.trim())) {
            nextErrors.sender = 'Enter a valid sender email address.';
        }

        if (!form.subject.trim()){
            nextErrors.subject = 'Email subject is required.';
        }
        if (!form.content.trim()){
            nextErrors.content = 'Email content is required.';
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const handleCreate = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try{
            const request: CreateEmailTemplateRequest = {
                sender: form.sender.trim(),
                alias: form.alias.trim() || undefined,
                subject: form.subject.trim(),
                content: form.content.trim(),
                difficulty: form.difficulty,
            }

            const template = await createEmailTemplate(request);
            setCreatedTemplate(template);

            addToast({
                type: 'success',
                title: 'Email template created',
                message: `Template ${template.referenceNumber} was added successfully.`,
            });
        }catch (error){
            console.error(error);

            addToast({
                type: 'error',
                title: 'Email template creation failed',
                message: error instanceof Error? error.message : 'The email template could not be created.'
            });
        } finally{
            setLoading(false);
        }
    };

    const handleCopyReference = async () => {
        if (!createdTemplate) {
        return;
        }

        try {
        setCopying(true);

        await navigator.clipboard.writeText(
            createdTemplate.referenceNumber,
        );

        addToast({
            type: 'success',
            title: 'Reference copied',
            message: `${createdTemplate.referenceNumber} was copied to your clipboard.`,
        });
        } catch (error) {
        console.error(error);

        addToast({
            type: 'error',
            title: 'Copy failed',
            message: 'The reference number could not be copied.',
        });
        } finally {
        setCopying(false);
        }
    };

    const handleCreateAnother = () => {
        setForm(initialForm);
        setErrors({});
        setCreatedTemplate(null);
    };

    const labelStyle: CSSProperties = {
        display: 'block',
        marginBottom: 8,
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-primary)',
        fontFamily: 'Inter, system-ui, sans-serif',
    };

    const errorStyle: CSSProperties = {
        marginTop: 4,
        fontSize: 11,
        color: 'var(--color-danger)',
        fontFamily: 'Inter, system-ui, sans-serif',
    };

    return (
        <AppLayout
        activePath={activePath}
        onNavigate={onNavigate}
        title="Create Email Template"
        subtitle="Create a reusable phishing email for phishing waves"
        breadcrumbs={[
            {
            label: 'Emails',
            path: '/emails',
            },
            {
            label: 'Create Email Template',
            },
        ]}
        >
        <div style={{ maxWidth: 760 }}>
            {!createdTemplate ? (
            <Card style={{ padding: '24px 28px' }}>
                <div style={{ marginBottom: 20 }}>
                <h2
                    style={{
                    marginBottom: 8,
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                >
                    Email details
                </h2>

                <p
                    style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    lineHeight: 1.5,
                    }}
                >
                    This email will be added to the mailing database and
                    assigned a unique PHISH reference number. 
                </p>
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
                    gridTemplateColumns:
                        'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                    }}
                >
                    <Input
                    label='Sender email'
                    type="email"
                    placeholder="eg. test@capstone-five-guys.dns.net.za"
                    value={form.sender}
                    onChange={(event) =>
                        setField('sender', event.target.value)
                    }
                    error={errors.sender}
                    required
                    />

                    <Input
                    label="Display name (optional)"
                    placeholder="Alias"
                    value={form.alias}
                    onChange={(event) =>
                        setField('alias', event.target.value)
                    }
                    />
                </div>

                <Input
                    label="Email subject"
                    value={form.subject}
                    onChange={(event) =>
                    setField('subject', event.target.value)
                    }
                    error={errors.subject}
                    required
                />

                <div>
                    <label style={labelStyle}>
                    Email body{' '}
                    <span style={{ color: 'var(--color-danger)' }}>
                        *
                    </span>
                    </label>

                    <p
                        style={{
                            marginBottom: 8,
                            fontSize: 11,
                            color: 'var(--text-muted)',
                        }}
                    >
                        Insert a placeholder:
                    </p>

                    <div
                        style={{
                            display:'flex',
                            gap: 8,
                            marginBottom: 8,
                            flexWrap: 'wrap'
                        }}
                    >
                        {placeholders.map((placeholder) => (
                            <Button
                                key={placeholder.value}
                                type="button"
                                size="sm"
                                onClick={() => insertPlaceholder(placeholder.value)}
                            >
                                {placeholder.label}
                            </Button>
                        ))}
                    </div>

                    <textarea
                    ref={contentRef}
                    rows={10}
                    placeholder="Enter the HTML or text content of the phishing email..."
                    value={form.content}
                    onChange={(event) =>
                        setField('content', event.target.value)
                    }
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: `1.5px solid ${
                        errors.content
                            ? 'var(--color-danger)'
                            : 'var(--border)'
                        }`,
                        borderRadius: 8,
                        outline: 'none',
                        resize: 'vertical',
                        background: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        lineHeight: 1.6,
                        fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                    />

                    {errors.content && (
                    <p style={errorStyle}>{errors.content}</p>
                    )}
                </div>

                <Select
                    label="Difficulty"
                    value={form.difficulty}
                    onChange={(event) =>
                    setField(
                        'difficulty',
                        event.target.value as EmailDifficulty,
                    )
                    }
                    options={DIFFICULTY_OPTIONS}
                />
                </div>

                <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    marginTop: 24,
                }}
                >
                <Button
                    variant="ghost"
                    onClick={() => onNavigate('/emails/templates')}
                    style={{
                        minWidth: 72,
                        paddingLeft: 16,
                        paddingRight: 16,
                    }}
                >
                    Cancel
                </Button>

                <Button
                    loading={loading}
                    disabled={loading}
                    onClick={() => {
                    void handleCreate();
                    }}
                    style={{
                        minWidth: 72,
                        paddingLeft: 16,
                        paddingRight: 16,
                    }}
                >
                    Create Email Template
                </Button>
                </div>
            </Card>
            ) : (
            <Card style={{ padding: '24px 28px' }}>
                <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    marginBottom: 16,
                    borderRadius: '50%',
                    background: 'var(--color-success-light)',
                    color: 'var(--color-success)',
                    fontSize: 22,
                    fontWeight: 800,
                }}
                >
                ✓
                </div>

                <h2
                style={{
                    marginBottom: 8,
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                }}
                >
                Email template created
                </h2>

                <p
                style={{
                    marginBottom: 24,
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                }}
                >
                The template has been saved and can now be used when
                sending emails or phishing waves.
                </p>

                <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    padding: 16,
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    background: 'var(--bg-hover)',
                }}
                >
                <div>
                    <p
                    style={{
                        marginBottom: 3,
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                    >
                    Reference number
                    </p>

                    <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                    }}
                    >
                    <code
                        style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                        }}
                    >
                        {createdTemplate.referenceNumber}
                    </code>

                    <Button
                        variant="ghost"
                        size="sm"
                        loading={copying}
                        onClick={() => {
                        void handleCopyReference();
                        }}
                    >
                        Copy Reference
                    </Button>
                    </div>
                </div>

                {[
                    {
                    label: 'Subject',
                    value: createdTemplate.subject,
                    },
                    {
                    label: 'Sender',
                    value: createdTemplate.alias
                        ? `${createdTemplate.alias} <${createdTemplate.sender}>`
                        : createdTemplate.sender,
                    },
                    {
                    label: 'Difficulty',
                    value: createdTemplate.difficulty,
                    },
                    {
                    label: 'Created',
                    value: new Date(
                        createdTemplate.createdAt,
                    ).toLocaleString('en-ZA', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                    }),
                    },
                ].map((item) => (
                    <div key={item.label}>
                    <p
                        style={{
                        marginBottom: 2,
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        }}
                    >
                        {item.label}
                    </p>

                    <p
                        style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        textTransform:
                            item.label === 'Difficulty'
                            ? 'capitalize'
                            : undefined,
                        }}
                    >
                        {item.value}
                    </p>
                    </div>
                ))}
                </div>

                <div
                style={{
                    marginTop: 16,
                }}
                >
                <p
                    style={{
                    marginBottom: 8,
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                >
                    Email preview
                </p>

                <div
                    style={{
                    maxHeight: 260,
                    overflow: 'auto',
                    padding: '12px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                >
                    {createdTemplate.content}
                </div>
                </div>

                <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    marginTop: 24,
                    flexWrap: 'wrap',
                }}
                >
                <Button
                    variant="ghost"
                    onClick={() => onNavigate('/emails/templates')}
                    style={{
                        minWidth: 72,
                        paddingLeft: 16,
                        paddingRight: 16,
                    }}
                >
                    Manage Templates
                </Button>

                <div
                    style={{
                    display: 'flex',
                    gap: 10,
                    flexWrap: 'wrap',
                    }}
                >
                    <Button
                    variant="ghost"
                    onClick={handleCreateAnother}
                    style={{
                        minWidth: 72,
                        paddingLeft: 16,
                        paddingRight: 16,
                    }}
                    >
                    Create Another
                    </Button>

                    <Button
                    onClick={() =>
                        onNavigate('/waves/send-email')
                    }
                    style={{
                        minWidth: 72,
                        paddingLeft: 16,
                        paddingRight: 16,
                    }}
                    >
                    Send an Email
                    </Button>
                </div>
                </div>
            </Card>
            )}
        </div>
        </AppLayout>
    );
}