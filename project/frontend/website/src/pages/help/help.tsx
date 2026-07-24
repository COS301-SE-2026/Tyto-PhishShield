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