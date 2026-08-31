import { useState, type ReactNode } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card } from '../../components/ui';
import { LayoutDashboard,BookOpen, Trophy, Mail, BookMarked, Library } from 'lucide-react';

interface HelpProps {
  onNavigate: (path: string) => void;
  activePath: string;
}

interface QuickLink {
  label: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}

interface Tutorial {
  title: string;
  intro: string;
  steps: string[];
}

interface Faq {
  question: string;
  answer: string;
}

const TUTORIALS: Tutorial[] = [
  {
    title: 'How to report a phishing email',
    intro: 'The fastest way to earn XP and help protect the organisation or company.',
    steps: [
      'Open the suspicious email in Outlook.',
      'Click the PhishShield button in the ribbon.',
      'Confirm the report. You will get a notification once processed.',
      'Check the Dashboard or Leaderboard to see your updated XP.',
    ],
  },
  {
    title: 'Understanding XP and the Leaderboard',
    intro: 'XP reflects how consistently you spot and correctly handle simulated phishing emails.',
    steps: [
      'Reporting a simulated phishing email earns you XP.',
      'Your total XP and rank are shown on the Leaderboard page.',
      'The Departments tab compares total and average XP across teams.',
      'Interaction with a simulation will reduce your XP. The goal is accuracy, not just activity.',
      'Note that failure to report simulations may also reduce your XP.',
      'If interaction with simulations occurred, appropriate training modules are released for your completion. Upon successful completion, some XP may be gained again.',
    ],
  },
  {
    title: 'Completing a training module',
    intro: 'Training modules are assigned after certain simulations to help you spot similar attacks in future.',
    steps: [
      'Go to the Training page from the sidebar.',
      'Open a module marked "Not Started" or "In Progress".',
      'Work through the material and any quiz questions.',
      'Completed modules are marked done and stay visible for reference.',
    ],
  },
  {
    title: 'Updating your profile and password',
    intro: 'Keep your account details current from the Settings page.',
    steps: [
      'Click your avatar in the top right, or open Settings from the sidebar.',
      'Update your name or email under Profile.',
      'Use the password section to set a new password.',
      'Changes save immediately. There is no need to log out and back in.',
    ],
  },
];

const FAQs: Faq[] = [
  {
    question: 'Why did I not I receive XP for a report I submitted?',
    answer: 'XP is awarded once your report has been processed, which is not necessarily instant. Also note the possibility that you might have wrongfully marked a "safe" email as spam, and therefore not earn yourself any XP. If it has been a while and your XP total still has not updated, let your admin know.',
  },
  {
    question: 'How do I change my password?',
    answer: 'Go to Settings and use the password section there. If you are logged out and cannot log in at all, use "Forgot password?" on the login page instead.',
  },
  {
    question: 'I did not receive my verification email. What do I do?',
    answer: 'Check your spam folder first. If it never arrived, contact your admin below. Please also note that email delivery for verification may be delayed at times.',
  },
  {
    question: 'Can I see how my department compares to others?',
    answer: 'Yes, the Departments tab on the Leaderboard ranks teams by total or average XP, and lets you filter by team size.',
  },
  {
    question: 'Who do I contact if I think a real (non-simulated) phishing email reach me?',
    answer: 'Report it the same way you would a simulation (via the Outlook add-in) and separately flag it to your IT/security team directly, since real threats need a faster response than the simulation pipeline provides.',
  },
];

function SectionHeading({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {children}
    </h2>
  );
}

function QuickLinkCard({ link }: Readonly<{ link: QuickLink }>) {
  return (
    <button type="button"
      onClick={link.onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', flex: '1 1 220px', padding: '14px 16px', borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--border)', background: 'var(--bg-card)', cursor: 'pointer', transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8, background: 'var(--color-primary-light)',
        color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {link.icon}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>
          {link.label}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1, fontFamily: 'Inter, system-ui, sans-serif' }}>
          {link.description}
        </div>
      </div>
    </button>
  );
}

function TutorialAccordionItem({ tutorial }: Readonly<{ tutorial: Tutorial }>) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          width: '100%', padding: '14px 4px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{tutorial.title}</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ margin: '0 4px 16px' }}>
          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>
            {tutorial.intro}
          </p>
          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tutorial.steps.map(step => (
              <li key={step} style={{ fontSize: 12.5, color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.5 }}>
                {step}
              </li>
            ))}
          </ol>
          {/* Leaving space here for screenshots to drop in; need <img> tags inside this div */}
        </div>
      )}
    </div>
  );
}

function FaqAccordionItem({ faq }: Readonly<{ faq: Faq }>) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          width: '100%', padding: '14px 4px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left', fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{faq.question}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 4px 16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
          {faq.answer}
        </p>
      )}
    </div>
  );
}

export function Help({ onNavigate, activePath }: Readonly<HelpProps>) {
  const quickLinks: QuickLink[] = [
    {
      label: 'Dashboard',
      description: 'Your overview, XP, and recent activity',
      onClick: () => onNavigate('/dashboard'),
      icon: <LayoutDashboard size={16} />
    },
    {
      label: 'Training',
      description: 'Work through your assigned training modules',
      onClick: () => onNavigate('/training'),
      icon: <BookOpen size={16} />
    },
    {
      label: 'Leaderboard',
      description: 'See your rank and how departments compare',
      onClick: () => onNavigate('/leaderboard'),
      icon: <Trophy size={16} />
    },
    {
      label: 'Contact Support',
      description: 'Email the Tyto support team for anything else not covered here',
      onClick: () => { window.location.href = 'mailto:support@tyto.co.za'; },
      icon: <Mail size={16} />
    },
    {
      label: 'User Guide',
      description: 'A continuously updated manual of using the website and its features',
      onClick: () => { window.open('https://github.com/COS301-SE-2026/Tyto-PhishShield/wiki/User-Manual', '_blank', 'noopener,noreferrer'); },
      icon: <BookMarked size={16} />
    },
    {
      label: 'Wiki and other documentation',
      description: 'Setup guides and (technical) service references',
      onClick: () => { window.open('https://github.com/COS301-SE-2026/Tyto-PhishShield/wiki', '_blank', 'noopener,noreferrer'); },
      icon: <Library size={16} />
    },
  ];

  return (
    <AppLayout activePath={activePath} onNavigate={onNavigate} title="Help Centre" subtitle="Guides, tutorials, and answers to common questions">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <section>
          <SectionHeading>Quick Links</SectionHeading>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {quickLinks.map(link => <QuickLinkCard key={link.label} link={link} />)}
          </div>
        </section>

        <section>
          <SectionHeading>Tutorials</SectionHeading>
          <Card style={{ padding: '4px 20px', gap: 14 }}>
            {TUTORIALS.map(tutorial => <TutorialAccordionItem key={tutorial.title} tutorial={tutorial} />)}
          </Card>
        </section>

        <section>
          <SectionHeading>Frequently Asked Questions</SectionHeading>
          <Card style={{ padding: '4px 20px' }}>
            {FAQs.map(faq => <FaqAccordionItem key={faq.question} faq={faq} />)}
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}