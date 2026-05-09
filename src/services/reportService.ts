import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { InvestigationState } from '../types';

// Extend jsPDF with autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateInvestigationReport = (state: InvestigationState) => {
  const doc = new jsPDF();
  const timestamp = new Date().toLocaleString();
  const filename = `RUNEOSINT_Report_${new Date().toISOString().split('T')[0]}.pdf`;

  // --- Title Page ---
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(228, 227, 224); // bg color
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('RUNEOSINT // INVESTIGATION REPORT', 15, 25);
  
  doc.setFontSize(10);
  doc.setFont('courier', 'normal');
  doc.text(`GENERATED: ${timestamp}`, 15, 35);

  let y = 50;

  // --- Executive Summary ---
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('I. EXECUTIVE SUMMARY', 15, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const mainTarget = state.targets.domains[0] || state.targets.names[0] || state.targets.usernames[0] || 'Unknown';
  const summaryText = `This report summarizes the current state of the OSINT investigation targeting ${mainTarget} and associated entities. The investigation has identified ${state.intelTargets.length} intel targets, ${state.entities.length} entities, and ${state.relationships.length} relationships across various categories including infrastructure, social correlation, and threat intelligence.`;
  const splitSummary = doc.splitTextToSize(summaryText, 180);
  doc.text(splitSummary, 15, y);
  y += splitSummary.length * 5 + 5;

  // --- Context & Notes ---
  doc.setFont('helvetica', 'bold');
  doc.text('Context:', 15, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Industry: ${state.context.industry}`, 20, y);
  y += 5;
  doc.text(`Relationships: ${state.context.relationships}`, 20, y);
  y += 10;

  if (state.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Investigator Notes:', 15, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(state.notes, 180);
    doc.text(splitNotes, 15, y);
    y += splitNotes.length * 5 + 10;
  }

  // --- Target Data ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('II. TARGET DATA', 15, y);
  y += 10;

  const targetRows = [
    ['Domains', state.targets.domains.join(', ') || 'None'],
    ['Usernames', state.targets.usernames.join(', ') || 'None'],
    ['Emails', state.targets.emails.join(', ') || 'None'],
    ['Names', state.targets.names.join(', ') || 'None'],
    ['Crypto', state.targets.crypto.join(', ') || 'None'],
  ];

  doc.autoTable({
    startY: y,
    head: [['Category', 'Values']],
    body: targetRows,
    theme: 'grid',
    headStyles: { fillColor: [20, 20, 20] },
    styles: { fontSize: 8, font: 'courier' },
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // --- Intel Targets ---
  if (state.intelTargets.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('III. INTEL TARGETS', 15, y);
    y += 10;

    const intelRows = state.intelTargets.map(t => [t.username, t.status, t.source, t.timestamp]);

    doc.autoTable({
      startY: y,
      head: [['Username', 'Status', 'Source', 'Timestamp']],
      body: intelRows,
      theme: 'grid',
      headStyles: { fillColor: [20, 20, 20] },
      styles: { fontSize: 8, font: 'courier' },
    });
    y = (doc as any).lastAutoTable.finalY + 15;
  }

  // Check for page break
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  // --- Breach History ---
  if (state.breachHistory.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('IV. BREACH HISTORY', 15, y);
    y += 10;

    const breachRows = state.breachHistory.map(b => [b.target, b.source, b.details.join(', '), b.timestamp]);

    doc.autoTable({
      startY: y,
      head: [['Target', 'Source', 'Details', 'Timestamp']],
      body: breachRows,
      theme: 'grid',
      headStyles: { fillColor: [20, 20, 20] },
      styles: { fontSize: 8, font: 'courier' },
    });
    y = (doc as any).lastAutoTable.finalY + 15;
  }

  // Check for page break
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  // --- Task Management ---
  if (state.tasks.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('V. TASK MANAGEMENT', 15, y);
    y += 10;

    const taskRows = state.tasks.map(t => [t.title, t.status, t.priority, `${t.progress}%`, t.assignee]);

    doc.autoTable({
      startY: y,
      head: [['Task', 'Status', 'Priority', 'Progress', 'Assignee']],
      body: taskRows,
      theme: 'grid',
      headStyles: { fillColor: [20, 20, 20] },
      styles: { fontSize: 8, font: 'courier' },
    });
    y = (doc as any).lastAutoTable.finalY + 15;
  }

  // --- Footer ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`RUNEOSINT CONFIDENTIAL // PAGE ${i} OF ${pageCount}`, 105, 290, { align: 'center' });
  }

  doc.save(filename);
};
