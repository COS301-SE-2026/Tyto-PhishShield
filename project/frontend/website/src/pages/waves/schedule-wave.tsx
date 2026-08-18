import { useState, useMemo, type CSSProperties, useEffect, useCallback } from "react";
import { AppLayout } from "../../components/layout/app-layout";
import { Button, Card, Input, Select, Badge } from "../../components/ui";
import { useToast } from "../../context/toast-context";
import {
  sendBatchRandomDifferentEmail,
  sendBatchRandomSameEmail,
  type EmailDifficulty,
} from "../../services/send-batch-email";
import { getUsers, type User } from "../../services/user";

interface ScheduleWaveProps {
  readonly onNavigate: (path: string) => void;
  readonly activePath: string;
}

type EmailDistribution = "same" | "different";

interface WaveForm {
  waveName: string;
  emailDistribution: EmailDistribution;
  difficulty: EmailDifficulty;
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
  scheduledFrom: "",
  scheduledTo: "",
  randomisedTimes: true,
};

export function ScheduleWave({
  onNavigate,
  activePath,
}: ScheduleWaveProps) {
  const { addToast } = useToast();

  const [form, setForm] = useState<WaveForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [scheduling, setScheduling] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedAuth0Ids, setSelectedAuth0Ids] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [userLoading, setUserLoading] = useState(true);

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

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

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

    if (selectedAuth0Ids.length === 0) {
      nextErrors.recipients = "Select at least one recipient.";
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
        selectedAuth0Ids,
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
          `"${form.waveName.trim()}" was scheduled for ${selectedAuth0Ids.length} recipient${selectedAuth0Ids.length === 1 ? "" : "s"}.`,
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
      securityScore={72}
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
              <label style={labelStyle}>
                Recipients{" "}
                <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>

              <p style={supportingTextStyle}>
                Search for users or select recipients by department.
              </p>

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
                  gridTemplateColumns: 'minmax(180px, 1fr) auto',
                  gap: 12,
                  alignItems: 'end',
                }}
                >
                  <Select
                    label="Department"
                    value={selectedDepartment}
                    onChange={(event) => setSelectedDepartment(event?.target.value)}
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
                    <p style={{...supportingTextStyle, padding: 16}}>
                      Loading users...
                    </p>
                  ) : filteredUsers.length === 0 ? (
                    <p style={{...supportingTextStyle, padding: 16}}>
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
              disabled={scheduling || userLoading || selectedAuth0Ids.length === 0}
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
