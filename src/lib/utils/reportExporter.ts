/**
 * Client-side report generation utility.
 * Allows generating and downloading reports in CSV (Excel-compatible),
 * TXT (Document-compatible), or JSON formats directly on the local machine.
 */

export interface ReportColumn {
  header: string;
  key: string;
}

export function downloadReportFile({
  title,
  data,
  columns,
  format,
  fileNamePrefix = 'report'
}: {
  title: string;
  data: any[];
  columns: ReportColumn[];
  format: 'excel' | 'document' | 'json';
  fileNamePrefix?: string;
}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${fileNamePrefix}_${timestamp}`;

  if (format === 'json') {
    const content = JSON.stringify({ title, generatedAt: new Date().toISOString(), data }, null, 2);
    triggerDownload(content, 'application/json', `${filename}.json`);
    return;
  }

  if (format === 'excel') {
    // Generate CSV representing Excel spreadsheet
    const headers = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = data.map(item => {
      return columns.map(c => {
        const val = item[c.key] !== undefined && item[c.key] !== null ? String(item[c.key]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',');
    });
    const csvContent = '\uFEFF' + [headers, ...rows].join('\n'); // Add UTF-8 BOM for Excel compatibility
    triggerDownload(csvContent, 'text/csv;charset=utf-8;', `${filename}.csv`);
    return;
  }

  if (format === 'document') {
    // Generate clean text-formatted document report
    let textContent = `${'='.repeat(60)}\n`;
    textContent += `${title.toUpperCase()}\n`;
    textContent += `Generated: ${new Date().toLocaleString()}\n`;
    textContent += `${'='.repeat(60)}\n\n`;

    data.forEach((item, index) => {
      textContent += `Record #${index + 1}\n`;
      columns.forEach(c => {
        const val = item[c.key] !== undefined && item[c.key] !== null ? String(item[c.key]) : 'N/A';
        textContent += `  ${c.header}: ${val}\n`;
      });
      textContent += `-\n`;
    });

    triggerDownload(textContent, 'text/plain;charset=utf-8;', `${filename}.txt`);
    return;
  }
}

function triggerDownload(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
