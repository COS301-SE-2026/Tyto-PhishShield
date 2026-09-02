import { AppLayout } from '../../components/layout/app-layout';
import { Button, Card, Badge, Input, Select } from '../../components/ui';
import { useState, type CSSProperties } from 'react';
import { useToast } from '../../context/toast-context';
import { createEmailTemplate } from '../../services/email-template';
import { generateTemplates, type Difficulty, type Department, type MessageType, type MessageTone, type TemplateVariable, type GeneratedTemplate } from '../../services/llm-template';

interface GenerateEmailProps {
  readonly onNavigate: (path: string) => void;
  readonly activePath: string;
}

interface GenerateEmailForm {
  sender: string;
  alias: string;
  difficulty: Difficulty;
  tone: MessageTone;
  messageType: MessageType;
  senderDepartment: Department | '';
  count: number;
}

interface FormErrors {
  sender?: string;
  templateVariable?: string;
}

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i; //regex validates email. got it from https://dirask.com/posts/TypeScript-validate-email-with-regex-Dn40Ej.

const DIFFICULTY_OPTIONS = [
    { value: 'easy', label: 'Easy'},
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
];

const TONE_OPTIONS = [
    { value: 'professional', label: 'Professional'},
    { value: 'friendly', label: 'Friendly' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'authoritative', label: 'Authoritative'},
    { value: 'neutral', label: 'Neutral' },
    { value: 'apologetic', label: 'Apologetic' },
];

const MESSAGE_TYPE_OPTIONS = [
    { value: 'announcement', label: 'Announcement'},
    { value: 'it_security_alert', label: 'IT Security alert' },
    { value: 'finance_voucher', label: 'Finance Voucher' },
    { value: 'document_request', label: 'Document Request'},
    { value: 'emergency', label: 'Emergency' },
    { value: 'executive_request', label: 'Executive Request' },
    { value: 'meeting_invite', label: 'Meeting Invite'},
    { value: 'it_support', label: 'IT Support' },
    { value: 'question', label: 'Question' },
];

const DEPARTMENT_OPTIONS = [
    { value: '', label: 'No Sender Department'},
    { value: 'it_&_security', label: 'IT & Security' },
    { value: 'finance', label: 'Finance' },
    { value: 'human_resources', label: 'Human Resources'},
    { value: 'legal_&_compliance', label: 'Legal & Compliance' },
    { value: 'operations', label: 'Operations' },
    { value: 'executive', label: 'Executive' },
];

const COUNT_OPTIONS = Array.from({length: 6 }, (_, index) => ({
  value: String(index + 1),
  label: `${index + 1} template${index === 0 ? '' : 's'}`
}));

const INITIAL_FORM: GenerateEmailForm = {
  sender: '',
  alias: '',
  difficulty: 'easy',
  tone: 'professional',
  messageType: 'announcement',
  senderDepartment: '',
  count: 1,
}

export function GenerateEmail({ onNavigate, activePath}: GenerateEmailProps){
  const { addToast } = useToast();

  const [form, setForm] = useState<GenerateEmailForm>(INITIAL_FORM);
  const [templateVariables, setTemplateVariables] = useState<TemplateVariable[]>(['name']);
  const [templates, setTemplates] = useState<GeneratedTemplate[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [generatedDifficulty, setGeneratedDifficulty] = useState<Difficulty | null>(null);

  const setField = <K extends keyof GenerateEmailForm>(field: K, value: GenerateEmailForm[K]): void => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (field === 'sender') {
      setErrors((previous) => ({
        ...previous,
        sender: undefined,
      }));
    }
  };

  const toggleTemplateVariable = (variable: TemplateVariable): void => {
    setTemplateVariables((previous) =>
      previous.includes(variable) ? previous.filter((item) => item !== variable) : [...previous, variable]
    );

    setErrors((previous) => ({
      ...previous,
      templateVariable: undefined,
    }));
  };

  const toggleTemplateSelection = (id: string): void => {
    setSelectedTemplateIds((previous) =>
      previous.includes(id) ? previous.filter((templateId) => templateId !== id) : [...previous, id]
    );
  }

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!form.sender.trim()) {
      nextErrors.sender = 'Sender email required.';
    }else if (!EMAIL_PATTERN.test(form.sender.trim())) {
      nextErrors.sender = 'Enter a valid sender email address.';
    }

    if (templateVariables.length === 0) {
      nextErrors.templateVariable = 'Select at least one template variable.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleGenerate = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }
    setGenerating(true);

    try {
      const result = await generateTemplates({
        difficulty: form.difficulty,
        tone: form.tone,
        messageType: form.messageType,
        templateVariable: templateVariables,
        count: form.count,
        senderDepartment: form.senderDepartment || undefined
      });

      setTemplates(result.templates);
      setSelectedTemplateIds(result.templates.map((template) => template.id));
      setGeneratedDifficulty(form.difficulty);

      if (result.failed > 0) {
        addToast({
          type: 'warning',
          title: 'Some templates could not be generated',
          message: `${result.generated} of ${result.requested} templates were generated successfully`,
        });
      } else {
        addToast({
          type: 'success',
          title: 'Templates generated',
          message: `${result.generated} template${result.generated === 1 ? '' : 's'} generated successfully`,
        });
      }
    } catch (error) {
      console.error(error);

      addToast({
          type: 'error',
          title: 'Templates generation failed',
          message: error instanceof Error ? error.message : 'Templates generation has failed'
        });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveSelected = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    const selectedTemplates = templates.filter((template) =>
      selectedTemplateIds.includes(template.id),
    );

    if (selectedTemplates.length === 0){
      addToast({
        type: 'warning',
        title: 'No templates selected',
        message: 'Select at least one template to save.'
      });

      return;
    }

    setSaving(true);

    try {
      const results = await Promise.allSettled(
        selectedTemplates.map((template) => 
          createEmailTemplate({
            sender: form.sender.trim(),
            alias: form.alias.trim() || undefined,
            subject: template.subject,
            content: template.body,
            difficulty: generatedDifficulty ?? form.difficulty,
          }),
        )
      );

      const savedCount = results.filter((result) => result.status === 'fulfilled').length;
      const failedCount = results.length - savedCount;

      if (savedCount === 0) {
        throw new Error('None of the selected templates could be saved.')
      }

      if (failedCount > 0) {
        const failedTemplateIds = results.flatMap(
          (result, index) => 
            result.status === 'rejected' 
            ? [selectedTemplates[index].id]
            : [],
        );

        setTemplates((previous) => 
          previous.filter((template) =>
            failedTemplateIds.includes(template.id)
          )
        );

        setSelectedTemplateIds(failedTemplateIds);

        addToast({
          type: 'warning',
          title: 'Some templates could not be saved',
          message: `${savedCount} template${savedCount === 1 ? '' : 's'} saved and ${failedCount} failed. Only the failed templates remain.`
        });

        return;
      }

      addToast({
        type: 'success',
        title: 'Templates saved',
        message: `${savedCount} template${savedCount === 1 ? '' : 's'} added to email templates database.`
      });

      onNavigate('/emails')
    } catch (error) {
      console.error(error);

      addToast({
        type: 'error',
        title: 'Could not save templates',
        message: error instanceof Error ? error.message : 'The selected templates could not be saved'
      });
    }finally {
      setSaving(false);
    }
  };

  const labelStyle: CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 8,
    color: 'var(--text-primary)',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const errorStyle: CSSProperties = {
    fontSize: 11,
    marginBottom: 8,
    color: 'var(--color-danger)',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const sectionHeadingStyle: CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 8,
    color: 'var(--text-primary)',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const sectionTextStyle: CSSProperties = {
    fontSize: 12,
    lineHeight: 1.5,
    color: 'var(--text-secondary)',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  return(
    <AppLayout
      activePath={activePath}
      onNavigate={onNavigate}
      title='Generate Email Templates'
      subtitle='Generate phishing email templates with help from an LLM'
      breadcrumbs={[
        {label: 'Emails', path: '/emails'},
        {label: 'Generate Templates'},
      ]}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          width: '100%',
          maxWidth: 1000,
        }}
      >
        <Card style={{padding: 24}}>
          <div style={{marginBottom: 24}}>
            <h2 style={sectionHeadingStyle}>
              Generation details
            </h2>
            <p style={sectionTextStyle}>
              Choose how the generated phishing templates should be written
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              <Input
                label='Sender email'
                type='email'
                placeholder='test@capstone-five-guys.dns.net.za'
                value={form.sender}
                error={errors.sender}
                required
                onChange={(event) => setField('sender', event.target.value)}
              />

              <Input
                label='Display name (Optional)'
                placeholder='IT Support'
                value={form.alias}
                onChange={(event) => setField('alias', event.target.value)}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12
              }}
            >
              <Select
                label='Difficulty'
                value={form.difficulty}
                options={DIFFICULTY_OPTIONS}
                onChange={(event) => setField('difficulty', event.target.value as Difficulty)}
              />

              <Select
                label='Tone'
                value={form.tone}
                options={TONE_OPTIONS}
                onChange={(event) => setField('tone', event.target.value as MessageTone)}
              />

              <Select
                label='Message type'
                value={form.messageType}
                options={MESSAGE_TYPE_OPTIONS}
                onChange={(event) => setField('messageType', event.target.value as MessageType)}
              />

              <Select
                label='Number of templates'
                value={String(form.count)}
                options={COUNT_OPTIONS}
                onChange={(event) => setField('count', Number(event.target.value))}
              />
            </div>

            <Select
              label='Sender department (Optional)'
              value={form.senderDepartment}
              options={DEPARTMENT_OPTIONS}
              onChange={(event) => setField('senderDepartment', event.target.value as Department | '')}
            />

            <div>
              <label style={labelStyle}>
                Template variables{' '}
                <span style={{color: 'var(--color-danger)'}}>*</span>
              </label>

              <p 
                style={{
                  ...sectionTextStyle,
                  marginBottom: 12,
                }}
              >
                Select the placeholders that should be included in the generated email.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                {[
                  {value: 'name' as TemplateVariable, label: 'Recipient name'},
                  {value: 'department' as TemplateVariable, label: 'Recipient department'},
                ].map((option) => (
                  <label
                    key={option.value}
                    style={{
                      display:'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: 12,
                      fontSize: 12,
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: 'var(--bg-hover)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <input
                      type='checkbox'
                      onChange={() => toggleTemplateVariable(option.value)}
                      checked={templateVariables.includes(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>

              {errors.templateVariable && (
                <p style={errorStyle}>
                  {errors.templateVariable}
                </p>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              marginTop: 24,
            }}
          >
            <Button
              variant='ghost'
              onClick={() => onNavigate('/emails')}
            >
              Cancel
            </Button>

            <Button
              loading={generating}
              disabled={generating || saving}
              onClick={() => void handleGenerate()}
            >
              {templates.length > 0 ? 'Generate Again' : 'Generate Templates'}
            </Button>
          </div>
        </Card>

        {templates.length > 0 && (
          <Card style={{ padding: 24 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 24,
              }}
            >
              <div>
                <h2 style={sectionHeadingStyle}>
                  Generated templates
                </h2>

                <p style={sectionTextStyle}>
                  Select the templates you want to save. 
                </p>
              </div>

              <Badge
                variant={selectedTemplateIds.length > 0 ? 'success' : 'neutral'}
              >
                {selectedTemplateIds.length} selected
              </Badge>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {templates.map((template, index) => {
                const selected = selectedTemplateIds.includes(template.id);

                return (
                  <div
                    key={template.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: 16,
                      border: `1.5px solid ${selected ? 'var(--color-primary)' : 'var(--border)'}`,
                      borderRadius: 8,
                      background: selected ? 'var(--color-primary-light)' : 'var(--bg-hover)'
                    }}
                  >
                    <input
                      type='checkbox'
                      checked={selected}
                      onChange={() => toggleTemplateSelection(template.id)}
                      style={{ marginTop: 4 }}
                    />

                    <div 
                      style={{ 
                        flex: 1,
                        minWidth: 0
                      }}
                    >
                      <p
                        style={{
                          marginBottom: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                        }}
                      >
                        Template {index + 1}: {template.subject}
                      </p>

                      <p
                        style={{
                          marginBottom: 8,
                          fontSize: 11,
                          lineHeight: 1.5,
                          color: 'var(--text-muted)'
                        }}
                      >
                        For security reasons, links are not rendered.
                      </p>

                      <div
                        style={{
                          padding: 12,
                          maxHeight: 240,
                          fontSize: 12,
                          lineHeight: 1.5,
                          overflow: 'auto',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          background: 'var(--bg-card)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <div 
                          onClick={(event) => {
                            const target = event.target as HTMLElement;
                            const link = target.closest('a');
                            if (link) {
                              event.preventDefault();
                            }
                          }}
                          dangerouslySetInnerHTML={{ __html: template.body, }} 
                        />
                      </div>
                      <div
                        style={{
                          padding: 12,
                          maxHeight: 240,
                          fontSize: 12,
                          lineHeight: 1.5,
                          overflow: 'auto',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          background: 'var(--bg-card)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <pre
                          style={{
                            margin: 4,
                            fontSize: 12,
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'anywhere',
                            fontFamily: 'Inter, system-ui, sans-serif'
                          }}
                        >
                          {template.body}
                        </pre>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                marginTop: 24,
              }}
            >
              <Button
                variant='ghost'
                disabled={saving}
                onClick={() => setSelectedTemplateIds([])}
              >
                Clear Selection
              </Button>

              <Button
                loading={saving}
                disabled={saving || generating || selectedTemplateIds.length === 0}
                onClick={() => void handleSaveSelected()}
              >
                Save Selected Templates
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}