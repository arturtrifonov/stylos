export const REPORT_VERSION = 2;
export const REPORT_LIMIT = 2_000_000;
const rerun = "Run npm run ui:verify:browser and record fresh browser checks.";

export function validateReport(report, manifest, complete = false) {
  if (!report || report.schemaVersion !== REPORT_VERSION || !Array.isArray(report.errors) ||
      !Array.isArray(report.a11y) || !Array.isArray(report.incomplete) ||
      !Number.isInteger(report.rendered) || report.rendered < 0 || report.rendered > manifest.cases * 2 ||
      typeof report.userAgent !== "string" || !report.userAgent || !Number.isFinite(Date.parse(report.generatedAt))) {
    throw new Error(`Browser evidence has an invalid or outdated format. ${rerun}`);
  }
  if (report.components !== manifest.components.length || report.expected !== manifest.cases * 2 ||
      report.sourceFingerprint !== manifest.sourceFingerprint) throw new Error(`Browser evidence is stale. ${rerun}`);
  if (complete && (report.rendered !== report.expected || report.errors.length || report.a11y.length)) {
    throw new Error(`Browser acceptance failed or is incomplete. ${rerun}`);
  }
}

// Buffer complete UTF-8 bytes before decoding; drain oversized requests without
// destroying the socket, so the caller can return a useful 413 response.
export function readReportBody(req, limit = REPORT_LIMIT) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    let bytes = 0;
    req.on("data", chunk => {
      bytes += chunk.length;
      if (bytes > limit) {
        chunks = [];
        reject(Object.assign(new Error(`Browser report exceeds ${limit} bytes.`), { status: 413 }));
      } else chunks.push(chunk);
    });
    req.on("end", () => { if (bytes <= limit) resolve(Buffer.concat(chunks).toString("utf8")); });
    req.on("error", reject);
  });
}
