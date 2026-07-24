import { useState, type ReactNode } from 'react';
import { AppLayout } from '../../components/layout/app-layout';
import { Card } from '../../components/ui';

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
]