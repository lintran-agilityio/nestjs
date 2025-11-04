// k6-side HTML report generation using benc-uk/k6-reporter
// This runs inside k6 runtime and produces rich HTML with metrics & charts
// See: https://github.com/benc-uk/k6-reporter
// Import URL must be static string literal for k6
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

export function handleSummaryFactory(reportBaseName: string) {
  return (data: any) => {
    const outPath = `test/loadTest/reports/${reportBaseName}-report.html`;
    return { [outPath]: htmlReport(data) };
  };
}


