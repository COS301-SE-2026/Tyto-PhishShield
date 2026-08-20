import { useState, useMemo, type CSSProperties } from "react";
import { AppLayout } from "../../components/layout/app-layout";
import { Button, Card, Input, Select, Badge } from "../../components/ui";
import { useToast } from "../../context/toast-context";
import {
  sendBatchRandomDifferentEmail,
  sendBatchRandomSameEmail,
  type EmailDifficulty,
} from "../../services/send-batch-email";

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i; //regex validates email. got it from https://dirask.com/posts/TypeScript-validate-email-with-regex-Dn40Ej.

interface ScheduleWaveProps {
  readonly onNavigate: (path: string) => void;
  readonly activePath: string;
}

type EmailDistribution = "same" | "different";

interface WaveForm {
  waveName: string;
  emailDistribution: EmailDistribution;
  difficulty: EmailDifficulty;
  recipientsInput: string;
  scheduledFrom: string;
  scheduledTo: string;
  randomisedTimes: boolean;
}

interface FormErrors {
  waveName?: string;
  recipients?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
}

const DISTRIBUTION_OPTIONS = [
  { value: "same", label: "Same email for all recipients" },
  { value: "different", label: "Recipients will receive different emails" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const initialForm: WaveForm = {
  waveName: "",
  emailDistribution: "same",
  difficulty: "medium",
  recipientsInput: "",
  scheduledFrom: "",
  scheduledTo: "",
  randomisedTimes: true,
};

function parseRecipients(value: string): string[] {
  const recipients = value
    .split(/[,;]+/) //recipients email addresses can be seperated by a comma or a semicolon
    .map((recipient) => recipient.trim())
    .filter(Boolean);

  const uniqueRecipients = new Map<string, string>();

  recipients.forEach((recipient) => {
    const normalisedRecipient = recipient.toLowerCase();

    if (!uniqueRecipients.has(normalisedRecipient)) {
      uniqueRecipients.set(normalisedRecipient, recipient);
    }
  });
  return [...uniqueRecipients.values()];
}

function formatInvalidRecipients(recipients: string[]): string {
  return `Invalid email address${recipients.length === 1 ? "" : "es"}: ${recipients.join(", ")}`;
}

export function ScheduleWave({
  onNavigate,
  activePath,
}: ScheduleWaveProps) {
  const { addToast } = useToast();

  const [form, setForm] = useState<WaveForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [scheduling, setScheduling] = useState(false);

  const parsedRecipients = useMemo(
    () => parseRecipients(form.recipientsInput),
    [form.recipientsInput],
  );

  const invalidRecipients = useMemo(
    () =>
      parsedRecipients.filter((recipient) => !EMAIL_PATTERN.test(recipient)),
    [parsedRecipients],
  );

  const setField = <K extends keyof WaveForm>(
    field: K,
    value: WaveForm[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (field === "waveName") {
      setErrors((previous) => ({
        ...previous,
        waveName: undefined,
      }));
    }

    if (field === "recipientsInput") {
      setErrors((previous) => ({
        ...previous,
        recipients: undefined,
      }));
    }

    if (field === "scheduledFrom") {
      setErrors((previous) => ({
        ...previous,
        scheduledFrom: undefined,
        scheduledTo: undefined,
      }));
    }

    if (field === "scheduledTo") {
      setErrors((previous) => ({
        ...previous,
        scheduledTo: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!form.waveName.trim()) {
      nextErrors.waveName = "Wave name required.";
    }

    if (parsedRecipients.length === 0) {
      nextErrors.recipients = "Enter at least one recipient email address.";
    } else if (invalidRecipients.length > 0) {
      nextErrors.recipients = formatInvalidRecipients(invalidRecipients);
    }

    if (!form.scheduledFrom) {
      nextErrors.scheduledFrom = "Schedule-from date required";
    }

    if (!form.scheduledTo) {
      nextErrors.scheduledTo = "Schedule-to date required";
    }

    const scheduledTo = form.scheduledTo ? new Date(form.scheduledTo) : null;
    const scheduledFrom = form.scheduledFrom
      ? new Date(form.scheduledFrom)
      : null;

    if (
      scheduledFrom &&
      !Number.isNaN(scheduledFrom.getTime()) &&
      scheduledFrom.getTime() <= Date.now()
    ) {
      nextErrors.scheduledFrom = "Schedule-from must be in the future.";
    }

    if (
      scheduledFrom &&
      scheduledTo &&
      !Number.isNaN(scheduledFrom.getTime()) &&
      !Number.isNaN(scheduledTo.getTime()) &&
      scheduledTo.getTime() < scheduledFrom.getTime()
    ) {
      nextErrors.scheduledFrom = "Schedule-from must be before Schedule-to.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleScheduleWave = async () => {
    if (!validateForm()) {
      addToast({
        type: "error",
        title: "Wave validation failed",
        message: "Correct the highlighted field before scheduling the Wave",
      });

      return;
    }
    setScheduling(true);

    try {
      const scheduledFrom = new Date(form.scheduledFrom).toISOString();

      const scheduledTo = new Date(form.scheduledTo).toISOString();

      const sendBatch =
        form.emailDistribution === "same"
          ? sendBatchRandomSameEmail
          : sendBatchRandomDifferentEmail;

      const response = await sendBatch(
        parsedRecipients,
        form.difficulty,
        scheduledFrom,
        scheduledTo,
        form.randomisedTimes,
      );

      addToast({
        type: "success",
        title: "Wave scheduled",
        message:
          response.message ||
          `"${form.waveName.trim()}" was scheduled for ${parsedRecipients.length} recipient${parsedRecipients.length === 1 ? "" : "s"}.`,
      });

      onNavigate("/waves");
    } catch (error) {
      console.error(error);

      addToast({
        type: "error",
        title: "Wave scheduling failed",
        message: "The Wave could not be scheduled.",
      });
    } finally {
      setScheduling(false);
    }
  };

  const labelStyle: CSSProperties = {
    display: "block",
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-primary)",
    fontFamily: "Inter, system-ui, sans-serif",
  };

  const errorStyle: CSSProperties = {
    marginBottom: 8,
    fontSize: 11,
    color: "var(--color-danger)",
    fontFamily: "Inter, system-ui, sans-serif",
    lineHeight: 1.5,
  };

  const supportingTextStyle: CSSProperties = {
    marginBottom: 8,
    fontSize: 11,
    color: "var(--text-muted)",
    fontFamily: "Inter, system-ui, sans-serif",
    lineHeight: 1.5,
  };

  return (
    <AppLayout
      activePath={activePath}
      onNavigate={onNavigate}
      title="Scehdule Wave"
      subtitle="Schedule generated phishing emails for recipients"
      breadcrumbs={[
        {
          label: "Waves",
          path: "/waves",
        },
        {
          label: "Schedule Wave",
        },
      ]}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 824,
        }}
      >
        <Card style={{ padding: "24px 28px" }}>
          <div style={{ marginBottom: 24 }}>
            <h2
              style={{
                marginBottom: 8,
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-primary)",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              Wave Details
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <Input
              label="Wave name"
              placeholder="Enter Wave name"
              required
              value={form.waveName}
              error={errors.waveName}
              onChange={(event) => setField("waveName", event.target.value)}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              <Select
                label="Email distribution"
                value={form.emailDistribution}
                options={DISTRIBUTION_OPTIONS}
                onChange={(event) =>
                  setField(
                    "emailDistribution",
                    event.target.value as EmailDistribution,
                  )
                }
              />

              <Select
                label="Difficulty"
                value={form.difficulty}
                options={DIFFICULTY_OPTIONS}
                onChange={(event) =>
                  setField("difficulty", event.target.value as EmailDifficulty)
                }
              />
            </div>

            <div>
              <label htmlFor="wave-recipients" style={labelStyle}>
                Recipients{" "}
                <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>

              <textarea
                id="wave-recipients"
                rows={5}
                placeholder="user1@example.com, user2@example.com"
                value={form.recipientsInput}
                style={{
                  display: "block",
                  width: "100%",
                  minHeight: 170,
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
                onChange={(event) =>
                  setField("recipientsInput", event.target.value)
                }
              />

              {errors.recipients && (
                <p style={errorStyle}>{errors.recipients}</p>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 8,
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

              {invalidRecipients.length > 0 && (
                <p style={errorStyle}>
                  {formatInvalidRecipients(invalidRecipients)}
                </p>
              )}

              <p style={supportingTextStyle}>
                Duplicate addresses are removed automatically. <br />
                Separate addresses with commas or semicolons.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              <Input
                label="Shedule from"
                type="datetime-local"
                required
                value={form.scheduledFrom}
                error={errors.scheduledFrom}
                onChange={(event) =>
                  setField("scheduledFrom", event.target.value)
                }
              />

              <Input
                label="Shedule to"
                type="datetime-local"
                required
                value={form.scheduledTo}
                error={errors.scheduledTo}
                onChange={(event) =>
                  setField("scheduledTo", event.target.value)
                }
              />
            </div>

            <label
              htmlFor="randomised-times"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 16,
                padding: "14px 16px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                background: "var(--bg-hover)",
                cursor: "pointer",
              }}
            >
              <Input
                label="randomised-times"
                type="checkbox"
                checked={form.randomisedTimes}
                onChange={(event) =>
                  setField("randomisedTimes", event.target.checked)
                }
                style={{
                  width: 16,
                  height: 16,
                  marginTop: 1,
                  accentColor: "var(--color-primary)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />

              <span
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                Randomised delivery times
              </span>

              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  fontFamily: "Inter, system-ui, sans-serif",
                  lineHeight: 1.5,
                }}
              >
                Spread email delivery randomly across the scheduled Wave
                period.
              </span>
            </label>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
            }}
          >
            <Button
              variant="ghost"
              disabled={scheduling}
              onClick={() => onNavigate("/waves")}
              style={{
                minWidth: 72,
              }}
            >
              Cancel
            </Button>

            <Button
              loading={scheduling}
              disabled={scheduling}
              onClick={() => {
                void handleScheduleWave();
              }}
              style={{
                minWidth: 160,
              }}
            >
              Schedule Wave
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
