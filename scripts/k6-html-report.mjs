import k6HtmlReporter from 'k6-html-reporter';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const [, , inputArg, outputArg] = process.argv;

if (!inputArg) {
  console.error('Usage: node scripts/k6-html-report.mjs <summary.json> [output.html]');
  process.exit(1);
}

const inputPath = resolve(inputArg);
const outputPath = resolve(
  outputArg || inputPath.replace(/\.json$/i, '.html'),
);

mkdirSync(dirname(outputPath), { recursive: true });

const summaryJson = JSON.parse(readFileSync(inputPath, 'utf-8'));

async function run() {
  // v3+ style: createHtmlReport
  if (typeof k6HtmlReporter === 'function') {
    const html = k6HtmlReporter(summaryJson);
    writeFileSync(outputPath, html);
    console.log(`HTML report generated: ${outputPath}`);
    return;
  }
  if (k6HtmlReporter && typeof k6HtmlReporter.createHtmlReport === 'function') {
    const html = k6HtmlReporter.createHtmlReport(summaryJson);
    writeFileSync(outputPath, html);
    console.log(`HTML report generated: ${outputPath}`);
    return;
  }
  if (k6HtmlReporter && k6HtmlReporter.default && typeof k6HtmlReporter.default.createHtmlReport === 'function') {
    const html = k6HtmlReporter.default.createHtmlReport(summaryJson);
    writeFileSync(outputPath, html);
    console.log(`HTML report generated: ${outputPath}`);
    return;
  }
  // v1 style: generateSummaryReport(options) where options = { jsonFile, output }
  if (k6HtmlReporter && typeof k6HtmlReporter.generateSummaryReport === 'function') {
    // For v1, the reporter reads the JSON file from disk and writes report.html into the output directory
    const outputDir = dirname(outputPath);
    // Write the summary to a temp file if inputPath isn't already a JSON file on disk
    // In our flow inputPath is a real file created by k6 --summary-export
    await k6HtmlReporter.generateSummaryReport({
      jsonFile: inputPath,
      output: outputDir,
    });
    console.log(`HTML report generated: ${resolve(outputDir, 'report.html')}`);
    return;
  }

  console.error('Unsupported k6-html-reporter export shape. Detected keys:', Object.keys(k6HtmlReporter || {}));
  process.exit(1);
}

run();


