import React, { useState } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card, Badge, Button, Modal } from '../../components/ui';
//import { useAuth } from '../../context/auth-context';
import { useToast } from '../../context/toast-context';
import type { TrainingStatus } from '../../types';

interface TrainingProps {
  onNavigate: (path: string) => void;
  activePath: string;
}

interface Module {
  id: string;
  title: string;
  desc: string;
  status: TrainingStatus;
  score: number | null;
  dueDate: string | null;
  estimatedMinutes: number;
  lessons: number;
  quiz: boolean;
}

const MODULES: Module[] = [
  { id: '1', title: 'Introduction to Social Engineering', desc: 'Understand the psychology behind social engineering and how attackers exploit human trust.', status: 'in_progress', score: null, dueDate: '2025-05-20', estimatedMinutes: 25, lessons: 4, quiz: true },
  { id: '2', title: 'Spear Phishing Awareness', desc: 'Learn to identify targeted phishing attacks that use personal information to appear legitimate.', status: 'not_started', score: null, dueDate: '2025-05-27', estimatedMinutes: 20, lessons: 3, quiz: true },
  { id: '3', title: 'Phishing in Microsoft Outlook', desc: 'Hands-on training for identifying and reporting suspicious emails directly within Outlook.', status: 'completed', score: 92, dueDate: null, estimatedMinutes: 15, lessons: 3, quiz: true },
  { id: '4', title: 'Password Security & MFA', desc: 'Best practices for creating strong passwords and enabling multi-factor authentication.', status: 'completed', score: 85, dueDate: null, estimatedMinutes: 18, lessons: 5, quiz: true },
];

const STATUS_CONFIG: Record<TrainingStatus, { label: string; badge: React.ReactNode }> = {
  not_started: { label: 'Not Started', badge: <Badge variant="neutral">Not Started</Badge> },
  in_progress: { label: 'In Progress', badge: <Badge variant="warning">In Progress</Badge> },
  completed:   { label: 'Completed',   badge: <Badge variant="success">Completed</Badge> },
};

// Simple quiz modal
function QuizModal({ module: mod, isOpen, onClose, onComplete }: {
  module: Module; isOpen: boolean; onClose: () => void; onComplete: (score: number) => void;
}) {
  const QUESTIONS = [
    { q: 'Which of the following is a common sign of a phishing email?', options: ['Poor grammar and spelling', 'Sent from a known colleague', 'Contains no links', 'Has a professional signature'], correct: 0 },
    { q: 'What should you do if you receive a suspicious email?', options: ['Click the link to check if it\'s real', 'Forward it to all colleagues', 'Report it using the PhishShield add-in', 'Delete it without reporting'], correct: 2 },
    { q: 'Spear phishing differs from regular phishing because it:', options: ['Uses images instead of text', 'Is targeted at specific individuals using personal info', 'Is always sent via SMS', 'Is easier to detect'], correct: 1 },
  ];
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? Math.round((QUESTIONS.filter((q, i) => answers[i] === q.correct).length / QUESTIONS.length) * 100)
    : 0;

  const handleSubmit = () => {
    if (Object.keys(answers).length < QUESTIONS.length) return;
    setSubmitted(true);
  };

  const handleFinish = () => { onComplete(score); setAnswers({}); setSubmitted(false); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Quiz — ${mod.title}`} maxWidth={560}>
      {submitted ? (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
            background: score >= 70 ? 'var(--color-success-light)' : 'var(--color-danger-light)',
            border: `2px solid ${score >= 70 ? 'var(--color-success)' : 'var(--color-danger)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: score >= 70 ? 'var(--color-success)' : 'var(--color-danger)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            {score}%
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'Inter, system-ui, sans-serif' }}>
            {score >= 70 ? 'Well done!' : 'Keep practising'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
            {score >= 70 ? `You scored ${score}% and earned +120 XP.` : `You scored ${score}%. A score of 70% or above is required. You can retry.`}
          </p>
          <Button fullWidth onClick={handleFinish}>
            {score >= 70 ? 'Finish & Claim XP' : 'Try Again'}
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {QUESTIONS.map((q, qi) => (
            <div key={qi}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>
                {qi + 1}. {q.q}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {q.options.map((opt, oi) => (
                  <button key={oi} onClick={() => setAnswers(p => ({ ...p, [qi]: oi }))} style={{
                    textAlign: 'left', padding: '9px 13px', borderRadius: 8, cursor: 'pointer',
                    fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif',
                    border: `1.5px solid ${answers[qi] === oi ? 'var(--color-primary)' : 'var(--border)'}`,
                    background: answers[qi] === oi ? 'var(--color-primary-light)' : 'var(--bg-hover)',
                    color: answers[qi] === oi ? 'var(--color-primary)' : 'var(--text-secondary)',
                    fontWeight: answers[qi] === oi ? 600 : 400, transition: 'all 0.12s',
                  }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Button fullWidth disabled={Object.keys(answers).length < QUESTIONS.length} onClick={handleSubmit}>
            Submit Answers
          </Button>
        </div>
      )}
    </Modal>
  );
}

export function Training({ onNavigate, activePath }: TrainingProps) {
  //const { canAccess } = useAuth();
  const { addToast } = useToast();
  const [quizModule, setQuizModule] = useState<Module | null>(null);
  const [modules, setModules] = useState<Module[]>(MODULES);
  const [filter, setFilter] = useState<TrainingStatus | 'all'>('all');

  const handleComplete = (score: number) => {
    if (!quizModule) return;
    if (score >= 70) {
      setModules(prev => prev.map(m =>
        m.id === quizModule.id
          ? { ...m, status: 'completed', score }
          : m
      ));
      addToast({ type: 'success', title: 'Module completed!', message: `+120 XP earned. Score: ${score}%` });
    }
  };

  const displayed = modules.filter(m => filter === 'all' || m.status === filter);

  const completed = modules.filter(m => m.status === 'completed').length;
  const avgScore = modules.filter(m => m.score !== null).reduce((sum, m) => sum + (m.score ?? 0), 0) /
                   Math.max(modules.filter(m => m.score !== null).length, 1);

  return (
    <AppLayout activePath={activePath} onNavigate={onNavigate} title="Training"
      subtitle={`${completed}/${modules.length} modules completed`} securityScore={72}>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { lbl: 'Completed', val: `${completed}/${modules.length}`, color: 'var(--color-success)' },
          { lbl: 'Average Score', val: `${Math.round(avgScore)}%`, color: 'var(--color-primary)' },
          { lbl: 'XP from Training', val: '360', color: 'var(--text-primary)' },
        ].map(s => (
          <Card key={s.lbl} style={{ padding: '16px 18px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'Inter, system-ui, sans-serif' }}>{s.lbl}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'Inter, system-ui, sans-serif' }}>{s.val}</p>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg-card)', borderRadius: 10, padding: 4, border: '1px solid var(--border)', width: 'fit-content' }}>
        {(['all', 'not_started', 'in_progress', 'completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif',
            background: filter === f ? 'var(--color-primary)' : 'transparent',
            color: filter === f ? '#fff' : 'var(--text-secondary)',
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>
            {f === 'not_started' ? 'Not Started' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Module cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {displayed.map(m => (
          <Card key={m.id} style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>{m.title}</h3>
                  {STATUS_CONFIG[m.status].badge}
                  {m.score !== null && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: m.score >= 70 ? 'var(--color-success)' : 'var(--color-danger)', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      Score: {m.score}%
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8, fontFamily: 'Inter, system-ui, sans-serif' }}>{m.desc}</p>
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Inter, system-ui, sans-serif', flexWrap: 'wrap' }}>
                  <span>{m.lessons} lessons</span>
                  <span>{m.estimatedMinutes} min</span>
                  {m.quiz && <span>Includes quiz</span>}
                  {m.dueDate && <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>Due {new Date(m.dueDate).toLocaleDateString('en-ZA')}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                {m.status !== 'not_started' && (
                  <Button size="sm" variant="ghost" style={{ border: '1px solid var(--border)' }}
                    onClick={() => addToast({ type: 'info', title: 'Course material', message: 'Course viewer coming in Demo 2.' })}>
                    {m.status === 'completed' ? 'Review' : 'Continue'}
                  </Button>
                )}
                {m.status === 'not_started' && (
                  <Button size="sm"
                    onClick={() => {
                      setModules(prev => prev.map(mod =>
                        mod.id === m.id ? { ...mod, status: 'in_progress' } : mod
                      ));
                      addToast({ type: 'info', title: 'Module started', message: m.title });
                    }}
                    style={{
                      minWidth: 72,
                      paddingLeft: 16,
                      paddingRight: 16,
                    }}
                    >
                    Start
                  </Button>
                )}
                {m.quiz && m.status === 'in_progress' && (
                  <Button size="sm" variant="secondary" onClick={() => setQuizModule(m)}>
                    Take Quiz
                  </Button>
                )}
                {m.status === 'completed' && m.quiz && (
                  <Button size="sm" variant="secondary" onClick={() => setQuizModule(m)}>
                    Retake Quiz
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {quizModule && (
        <QuizModal module={quizModule} isOpen={!!quizModule}
          onClose={() => setQuizModule(null)} onComplete={handleComplete} />
      )}
    </AppLayout>
  );
}
