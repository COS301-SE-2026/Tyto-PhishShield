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
import { getUsers, type User } from "../../services/user";

interface SendEmailProps {
  onNavigate: (path: string) => void;
  activePath: string;
}

interface FormErrors {
  referenceNumber?: string;
  recipients?: string;
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
  const [sending, setSending] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedAuth0Ids, setSelectedAuth0Ids] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [userLoading, setUserLoading] = useState(true);

  const [errors, setErrors] = useState<FormErrors>({});

  const fetchUsers = useCallback(async () => {
    setUserLoading(true);

    try{
      const availableUsers = await getUsers();

      setUsers(
        availableUsers.filter((user) => user.isActive)
      );
    } catch (error) {
      console.error(error);

      addToast({
        type: 'error',
        title: 'Could not load users',
        message: error instanceof Error ? error.message : 'Users could not be loaded',
      });
    } finally {
      setUserLoading(false);
    }
  }, [addToast]);

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

  useEffect(() => {//call both on page load
    void fetchEmailTemplates();
    void fetchUsers();
  }, [fetchEmailTemplates, fetchUsers]);

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

  const departments = useMemo(
    () =>
    [...new Set(
      users.map((user) => user.department).filter((department): department is string => Boolean(department))
    )].sort(),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();

    return users.filter((user) => 
      !search || user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search) || user.auth0Id.toLowerCase().includes(search)
    );
  }, [users, userSearch]);

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

  const toggleUserSelection = (auth0Id: string) => {
    setSelectedAuth0Ids((previous) => previous.includes(auth0Id) 
      ? previous.filter((id) => id !== auth0Id)
      : [...previous, auth0Id]
    );

    setErrors((previous) => ({
      ...previous,
      recipients: undefined,
    }));
  };

  const selectDepartmentUsers = () => {
    if (!selectedDepartment) {
      return;
    }

    const departmentAuth0Ids = users.filter((user) => user.department === selectedDepartment).map((user) => user.auth0Id);

    setSelectedAuth0Ids((previous) => [
      ...new Set([...previous, ...departmentAuth0Ids]),
    ]);

    setSelectedDepartment('');

    setErrors((previous) => ({
      ...previous,
      recipients: undefined,
    }));
  };

  const clearRecipients = () => {
    setSelectedAuth0Ids([]);
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!selectedEmail) {
      nextErrors.referenceNumber = "Select or find an email template.";
    }

    if (selectedAuth0Ids.length === 0) {
      nextErrors.recipients = "Select at least one recipient.";
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
        selectedAuth0Ids,
      );

      addToast({
        type: "success",
        title: "Email sent",
        message: `${selectedEmail.referenceNumber} was sent to ${selectedAuth0Ids.length} recipient${selectedAuth0Ids.length === 1 ? "" : "s"}.`,
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
      securityScore={72}
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
                Search for users or select recipients by department.
              </p>
            </div>

                <div
                  style={{
                    display:'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      display:'grid',
                      gridTemplateColumns: 'minmax(180px, 1fr) auto',
                      gap: 12,
                      alignItems: 'end',
                    }}
                  >
                    <Select
                      label="Department"
                      value={selectedDepartment}
                      onChange={(event) => setSelectedDepartment(event.target.value)}
                      disabled={userLoading}
                      options={[
                        { value: "", label: "All departments" },
                        ...departments.map((department) => ({
                          value: department,
                          label: department,
                        })),
                      ]}
                    />

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!selectedDepartment || userLoading}
                      onClick={selectDepartmentUsers}
                    >
                      Select Department
                    </Button>
                  </div>

                  <Input
                    label="Search users"
                    placeholder="Search by name, email or auth0Id"
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    disabled={userLoading}
                  />

                  {errors.recipients && <p style={errorStyle}>{errors.recipients}</p>}

                  <div
                    style={{
                      display:'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <Badge variant={selectedAuth0Ids.length > 0 ? 'success': 'neutral'}>
                      {selectedAuth0Ids.length}{" "}
                      {selectedAuth0Ids.length === 1 ? "recipient" : "recipients"} selected
                    </Badge>

                    {selectedAuth0Ids.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRecipients}
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  <div
                    style={{
                      maxHeight: 280,
                      overflowY: 'auto',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                    }}
                  >
                    {userLoading ? (
                      <p style={{...sectionTextStyle, padding: 16}}>
                        Loading users...
                      </p>
                    ) : filteredUsers.length === 0 ? (
                      <p style={{...sectionTextStyle, padding: 16}}>
                        No users found.
                      </p>
                    ) : (
                      filteredUsers.map((user) => (
                        <label
                          key={user.auth0Id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: 12,
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAuth0Ids.includes(user.auth0Id)}
                            onChange={() => toggleUserSelection(user.auth0Id)}
                          />

                          <div style={{minWidth: 0}}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--text-primary)'
                              }}
                            >
                              {user.name}
                            </div>

                            <div
                              style={{
                                fontSize: 11,
                                color: 'var(--text-secondary)',
                                marginTop:4,
                              }}
                            >
                              {user.email}
                              {user.department && `  -${user.department}`}
                            </div>
                          </div>
                        </label>
                      ))
                    )
                    }
                  </div>
                </div>
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
                userLoading ||
                selectedAuth0Ids.length === 0
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