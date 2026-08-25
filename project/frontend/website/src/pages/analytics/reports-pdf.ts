import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { GeneratedReport } from './reports.service';

function formatDate(value: string): string {
  return new Date(value).toLocaleString('en-ZA');
}

function finalY(doc: jsPDF, fallback: number): number {
  const withTable = doc as unknown as { lastAutoTable?: { finalY: number } };
  return withTable.lastAutoTable?.finalY ?? fallback;
}

function addHeader(doc: jsPDF, title: string, subtitle: string, generatedAt: string): number {
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(subtitle, 14, 25);
  doc.text(`Generated ${formatDate(generatedAt)}`, 14, 30);
  doc.setTextColor(0);
  return 38;
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function filenameFor(report: GeneratedReport): string {
  const date = report.generatedAt.slice(0, 10);
  switch (report.type) {
    case 'organisation': return `organisation-report-${date}`;
    case 'user': return `user-report-${slugify(report.user.name)}-${date}`;
    case 'wave': return `wave-report-${slugify(report.wave.waveName)}-${date}`;
    case 'department': return `department-report-${slugify(report.department)}-${date}`;
  }
}

export function exportReportToPdf(report: GeneratedReport): void {
  const doc = new jsPDF();

  switch (report.type) {
    case 'organisation': {
      const startY = addHeader(doc, 'Organisation Report', `Period: last ${report.period}`, report.generatedAt);
      autoTable(doc, {
        startY,
        head: [['Metric', 'Value']],
        body: [
          ['Detection rate', `${report.summary.detectionRate}%`],
          ['Total simulations', String(report.summary.totalSimulations)],
          ['Training completion', `${report.summary.trainingCompletionRate}%`],
          ['Education assigned', String(report.summary.educationAssigned)],
          ['Education completed', String(report.summary.educationCompleted)],
        ],
      });
      autoTable(doc, {
        startY: finalY(doc, startY) + 10,
        head: [['Date', 'Reports', 'Emails sent', 'XP given']],
        body: report.series.map(p => [p.date, String(p.reports), String(p.emailsSent), String(p.xpGiven)]),
      });
      autoTable(doc, {
        startY: finalY(doc, startY) + 10,
        head: [['Rank', 'Email', 'Confirmed reports', 'Total XP']],
        body: report.leaderboard.map((u, i) => [String(i + 1), u.email, String(u.reportCount), String(u.totalXp)]),
      });
      break;
    }
    case 'user': {
      const startY = addHeader(doc, 'User Report', `${report.user.name} — ${report.user.email}`, report.generatedAt);
      autoTable(doc, {
        startY,
        head: [['Field', 'Value']],
        body: [
          ['Department', report.user.department ?? '—'],
          ['Role', report.user.role],
          ['Reports submitted', String(report.stats.reports)],
          ['Confirmed phishing', String(report.stats.confirmed)],
          ['False positives', String(report.stats.falsePositive)],
          ['Total XP', String(report.stats.totalXp)],
          ['Education completed', String(report.stats.educationCompleted)],
          ['Security score', String(report.stats.securityScore)],
        ],
      });
      break;
    }
    case 'wave': {
      const startY = addHeader(doc, 'Wave Report', report.wave.waveName, report.generatedAt);
      autoTable(doc, {
        startY,
        head: [['Field', 'Value']],
        body: [
          ['Scheduled from', formatDate(report.wave.scheduledFrom)],
          ['Scheduled to', formatDate(report.wave.scheduledTo)],
          ['Recipients', String(report.recipients.length)],
        ],
      });
      autoTable(doc, {
        startY: finalY(doc, startY) + 10,
        head: [['Name', 'Email', 'Department', 'Scheduled at', 'Engagement']],
        body: report.recipients.map(r => [r.name, r.email, r.department ?? '—', formatDate(r.scheduledAt), 'Pending']),
      });
      break;
    }
    case 'department': {
      const startY = addHeader(doc, 'Department Report', report.department, report.generatedAt);
      autoTable(doc, {
        startY,
        head: [['Name', 'Email', 'Role']],
        body: report.employees.map(e => [e.name, e.email, e.role]),
      });
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text('Department-level engagement stats are not available yet — pending analytics-service work.', 14, finalY(doc, startY) + 10);
      doc.setTextColor(0);
      break;
    }
  }

  doc.save(`${filenameFor(report)}.pdf`);
}
