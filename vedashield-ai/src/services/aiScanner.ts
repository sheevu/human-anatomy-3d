import { TestRow } from '../types';
import { organFor, rangeStatus } from './medicalRules';

export interface ScanResult {
  title: string;
  date: string;
  labName: string;
  rows: TestRow[];
  extractedText: string;
}

export async function parseMedicalDocument(fileOrBase64: File | string, fileName?: string): Promise<ScanResult> {
  // Attempt to call server backend if available
  try {
    const formData = new FormData();
    if (typeof fileOrBase64 === 'string') {
      formData.append('text', fileOrBase64);
    } else {
      formData.append('file', fileOrBase64);
    }
    const res = await fetch('/api/ai/scan', {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(30000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.rows && data.rows.length > 0) {
        return {
          title: data.title || fileName || 'Lab Test Report',
          date: data.date || '',
          labName: data.labName || '',
          rows: data.rows.map((r: any, idx: number) => ({
            id: `row-${Date.now()}-${idx}`,
            name: r.name,
            value: String(r.value),
            numericValue: parseFloat(String(r.value).replace(/,/g, '')),
            unit: r.unit || '',
            range: r.range || '',
            status: rangeStatus({ value: String(r.value), range: r.range || '' }),
            organ: organFor(r.name)
          })),
          extractedText: data.extractedText || ''
        };
      }
    }
  } catch (err) {
    console.info('Backend scanner unavailable, using local OCR regex parser.');
  }

  if (typeof fileOrBase64 !== 'string') throw new Error('Document extraction unavailable. No results were generated.');
  return extractRowsFromText(fileOrBase64, fileName || 'Medical Report');
}

export function extractRowsFromText(text: string, title = 'Uploaded Medical Report'): ScanResult {
  const rows: TestRow[] = [];
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Pattern: [Test Name]  [Numeric Value]  [Unit]  [Ref Range]
    // Example: "Fasting Glucose 108 mg/dL 70-99"
    // Example: "Total Cholesterol 212 mg/dL <200"
    const match = line.match(/^([A-Za-z][A-Za-z0-9 ()/%.,-]{1,60}?)\s+([-+]?\d*\.?\d+)\s+([a-zA-Zµμ%/\d.^]+)\s+(<?=?\s*\d*\.?\d+\s*[-–—]\s*\d*\.?\d+|[<>≤≥]=?\s*\d*\.?\d+)\s*$/);
    if (match) {
      const name = match[1].trim();
      const val = match[2].trim();
      const unit = match[3].trim();
      const range = match[4].trim();
      const status = rangeStatus({ value: val, range });
      const organ = organFor(name);

      rows.push({
        id: `extracted-${Date.now()}-${rows.length}`,
        name,
        value: val,
        numericValue: parseFloat(val),
        unit,
        range,
        status,
        organ
      });
    }
  }

  if (!rows.length) throw new Error('No readable laboratory results found.');

  return {
    title,
    date: new Date().toISOString().slice(0, 10),
    labName: 'Processed Medical Document',
    rows,
    extractedText: text
  };
}
