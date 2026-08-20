import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  type CSSProperties,
} from "react";
import { AppLayout } from "../../components/layout/app-layout";
import { Button, Card, Input, Select, Badge } from "../../components/ui";
import { useToast } from "../../context/toast-context";
import {
  getEmailTemplate,
  getEmailTemplates,
  type EmailTemplate,
} from "../../services/email-template";
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
  return [
    ...new Set(
      value
        .split(/[,;]+/) //recipients email addresses can be seperated by a comma or a semicolon
        .map((recipient) => recipient.trim())
        .filter(Boolean),
    ),
  ];
}

function formatSender(template: EmailTemplate): string {
  if (template.alias) {
    return `${template.alias} <${template.sender}>`;
  }

  return template.sender;
}

function getDifficultyVariant(
  difficulty: EmailTemplate["difficulty"],
): "success" | "warning" | "danger" {
  if (difficulty === "easy") {
    return "success";
  }

  if (difficulty === "medium") {
    return "warning";
  }

  return "danger";
}

export function SendEmail({ onNavigate, activePath }: SendEmailProps) {
  const { addToast } = useToast();

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [referenceInput, setReferenceInput] = useState("");
  const [selectedReference, setSelectedReference] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailTemplate | null>(
    null,
  );
  const [recipientsInput, setRecipientsInput] = useState("");
  const [sending, setSending] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  const [errors, setErrors] = useState<FormErrors>({});

  const parsedRecipients = useMemo(
    () => parseRecipients(recipientsInput),
    [recipientsInput],
  );

  const invalidRecipients = useMemo(
    () =>
      parsedRecipients.filter((recipient) => !EMAIL_PATTERN.test(recipient)),
    [parsedRecipients],
  );

  const templateOptions = useMemo(
    () => [
      {
        value: "",
        label: "Please select an available email template",
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
          type: "warning",
          title: "No email templates available",
          message: "Create a template before attempting to send an email.",
        });
      }
    } catch (error) {
      console.error(error);

      addToast({
        type: "error",
        title: "Could not load email templates",
        message:
          error instanceof Error
            ? error.message
            : "Available email templates could not be loaded.",
      });
    } finally {
      setTemplatesLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void fetchEmailTemplates();
  }, [fetchEmailTemplates]);

  const handleTemplateSelection = (referenceNumber: string) => {
    setSelectedReference(referenceNumber);
    setReferenceInput(referenceNumber);

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

    if (!template) {
      setSelectedEmail(null);

      setErrors((previous) => ({
        ...previous,
        referenceNumber: "The selected email template not found.",
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
        referenceNumber: "Enter a reference number.",
      }));

      return;
    }

    setTemplateLoading(true);

    try {
      const template = await getEmailTemplate(cleanedReference);

      setSelectedEmail(template);
      setSelectedReference(template.referenceNumber);
      setReferenceInput(template.referenceNumber);

      setErrors((previous) => ({
        ...previous,
        referenceNumber: undefined,
      }));

      if (
        !emailTemplates.some(
          (emailTemplate) =>
            emailTemplate.referenceNumber === template.referenceNumber,
        )
      ) {
        setEmailTemplates((previous) => [...previous, template]);
      }

      addToast({
        type: "success",
        title: "Email template found",
        message: `${template.referenceNumber} is ready to use.`,
      });
    } catch (error) {
      console.error(error);

      setSelectedEmail(null);
      setSelectedReference("");

      const message =
        error instanceof Error
          ? error.message
          : `No template was found for ${cleanedReference}.`;

      setErrors((previous) => ({
        ...previous,
        referenceNumber: message,
      }));

      addToast({
        type: "error",
        title: "Email template not found",
        message,
      });
    } finally {
      setTemplateLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!selectedEmail) {
      nextErrors.referenceNumber = "Select or find an email template.";
    }

    if (parsedRecipients.length === 0) {
      nextErrors.recipients = "Enter at least one recipient email address.";
    } else if (invalidRecipients.length > 0) {
      nextErrors.recipients = `Invalid email address${
        invalidRecipients.length === 1 ? "" : "es"
      }: ${invalidRecipients.join(", ")}`;
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSend = async () => {
    if (!validateForm() || !selectedEmail) {
      return;
    }

    setSending(true);

    try {
      await sendBatchWithReference(
        selectedEmail.referenceNumber,
        parsedRecipients,
      );

      addToast({
        type: "success",
        title: "Email sent",
        message: `${selectedEmail.referenceNumber} was sent to ${parsedRecipients.length} recipient${parsedRecipients.length === 1 ? "" : "s"}.`,
      });
    } catch (error) {
      console.error(error);

      addToast({
        type: "error",
        title: "Email sending failed",
        message:
          error instanceof Error
            ? error.message
            : "The email could not be sent.",
      });
    } finally {
      setSending(false);
    }
  };

  const sectionHeadingStyle: CSSProperties = {
    marginBottom: 8,
    fontSize: 15,
    fontWeight: 700,
    color: "var(--text-primary)",
    fontFamily: "Inter, system-ui, sans-serif",
  };

  const sectionTextStyle: CSSProperties = {
    fontSize: 12,
    color: "var(--text-secondary)",
    fontFamily: "Inter, system-ui, sans-serif",
    lineHeight: 1.5,
  };

  const detailLabelStyle: CSSProperties = {
    marginBottom: 4,
    fontSize: 10,
    fontWeight: 500,
    color: "var(--text-muted)",
    fontFamily: "Inter, system-ui, sans-serif",
  };

  const sectionValueStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-primary)",
    fontFamily: "Inter, system-ui, sans-serif",
    lineHeight: 1.5,
    wordBreak: "break-word",
  };

  const errorStyle: CSSProperties = {
    marginTop: 8,
    fontSize: 11,
    color: "var(--color-danger)",
    fontFamily: "Inter, system-ui, sans-serif",
  };

  return (
    <AppLayout
      activePath={activePath}
      onNavigate={onNavigate}
      title="Send Email with Reference Number"
      subtitle="Send a saved email to one or more recipients"
      breadcrumbs={[
        {
          label: "Phishing Waves",
          path: "/waves",
        },
        {
          label: "Send Existing Email",
        },
      ]}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          alignItems: "start",
          gap: 24,
          width: "100%",
          maxWidth: 1180,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            minWidth: 0,
          }}
        >
          <Card style={{ padding: "24px 28px" }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={sectionHeadingStyle}>Email Template</h2>

              <p style={sectionTextStyle}>
                Select a template or find one using its reference number.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <Select
                label="Available email templates"
                value={selectedReference}
                onChange={(event) =>
                  handleTemplateSelection(event.target.value)
                }
                options={templateOptions}
                disabled={templateLoading || templatesLoading}
              />

              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={templatesLoading}
                  disabled={templatesLoading}
                  onClick={() => void fetchEmailTemplates()}
                >
                  Refresh Templates
                </Button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                margin: "24px 0",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "var(--border)",
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Or
              </span>

              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "var(--border)",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "minmax(220px, 1fr) auto",
                alignItems: "end",
              }}
            >
              <Input
                label="Find by reference number"
                placeholder=""
                value={referenceInput}
                error={errors.referenceNumber}
                onChange={(event) => {
                  setReferenceInput(event.target.value.toUpperCase());
                  setErrors((previous) => ({
                    ...previous,
                    referenceNumber: undefined,
                  }));
                }}
              />

              <Button
                variant="ghost"
                loading={templateLoading}
                disabled={templateLoading || !referenceInput.trim()}
                onClick={() => void handleReferenceLookup()}
                style={{
                  minWidth: 112,
                  paddingLeft: 16,
                  paddingRight: 16,
                }}
              >
                Find Template
              </Button>
            </div>
          </Card>

          <Card style={{ padding: "24px 28px" }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={sectionHeadingStyle}>Recipients</h2>
              <p style={sectionTextStyle}>
                Separate addresses with commas or semicolons.
              </p>
            </div>

            <textarea
              id="recipients"
              rows={5}
              placeholder="user1@example.com, user2@example.com"
              value={recipientsInput}
              onChange={(event) => {
                setRecipientsInput(event.target.value);

                setErrors((previous) => ({
                  ...previous,
                  recipients: undefined,
                }));
              }}
              style={{
                display: "block",
                width: "100%",
                minHeight: 150,
                padding: "10px 12px",
                border: `1.5px solid ${
                  errors.recipients ? "var(--color-danger)" : "var(--border)"
                }`,
                borderRadius: 8,
                outline: "none",
                resize: "vertical",
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            />

            {errors.recipients && <p style={errorStyle}>{errors.recipients}</p>}

            {parsedRecipients.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                <Badge
                  variant={invalidRecipients.length > 0 ? "danger" : "success"}
                >
                  {parsedRecipients.length}{" "}
                  {parsedRecipients.length === 1 ? "recipient" : "recipients"}
                </Badge>

                {invalidRecipients.length > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--color-danger)",
                    }}
                  >
                    {invalidRecipients.length} invalid
                  </span>
                )}
              </div>
            )}
          </Card>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <Button
              variant="ghost"
              onClick={() => onNavigate("/waves")}
              style={{
                minWidth: 72,
                paddingLeft: 16,
                paddingRight: 16,
              }}
            >
              Cancel
            </Button>

            <Button
              loading={sending}
              disabled={
                sending ||
                templateLoading ||
                !selectedEmail ||
                parsedRecipients.length === 0 ||
                invalidRecipients.length > 0
              }
              onClick={() => void handleSend()}
              style={{
                minWidth: 112,
                paddingLeft: 16,
                paddingRight: 16,
              }}
            >
              Send Email
            </Button>
          </div>
        </div>

        <Card
          style={{
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h2 style={sectionHeadingStyle}>Email Preview</h2>

            <p style={sectionTextStyle}>Review the selected template</p>
          </div>

          <div style={{ padding: 24 }}>
            {templateLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 300,
                }}
              >
                <p style={sectionTextStyle}>Loading template...</p>
              </div>
            ) : selectedEmail ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <p style={detailLabelStyle}>Reference Number</p>

                    <code
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--color-primary)",
                      }}
                    >
                      {selectedEmail.referenceNumber}
                    </code>
                  </div>
                </div>

                <div>
                  <Badge
                    variant={getDifficultyVariant(selectedEmail.difficulty)}
                  >
                    {selectedEmail.difficulty.charAt(0).toUpperCase() +
                      selectedEmail.difficulty.slice(1)}
                  </Badge>
                </div>

                <div>
                  <p style={detailLabelStyle}>Sender</p>

                  <p style={sectionValueStyle}>{formatSender(selectedEmail)}</p>
                </div>

                <div>
                  <p style={detailLabelStyle}>Subject</p>

                  <p style={sectionValueStyle}>{selectedEmail.subject}</p>
                </div>

                <div
                  style={{
                    paddingTop: 16,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <p
                    style={{
                      ...detailLabelStyle,
                      marginBottom: 8,
                    }}
                  >
                    Email body
                  </p>
                  <div
                    style={{
                      minHeight: 220,
                      maxHeight: 430,
                      overflow: "auto",
                      padding: "14px 16px",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      background: "var(--bg-hover)",
                      color: "var(--text-secondary)",
                      fontSize: 12,
                      lineHeight: 1.65,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontFamily: "Inter, system-ui, sans-serif",
                    }}
                  >
                    {selectedEmail.content}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 300,
                  padding: 24,
                  border: "1px dashed var(--border)",
                  borderRadius: 8,
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    marginBottom: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  No template selected
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}