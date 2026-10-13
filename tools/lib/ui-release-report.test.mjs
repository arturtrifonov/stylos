import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { REPORT_VERSION, validateReport, readReportBody } from "./ui-release-report.mjs";

const manifest = { components: [{ id: "Example" }], cases: 2, sourceFingerprint: "current" };
const report = { schemaVersion: REPORT_VERSION, components: 1, expected: 4, rendered: 4,
  sourceFingerprint: "current", userAgent: "Test browser", generatedAt: "2026-10-14T00:00:00Z", errors: [], a11y: [], incomplete: [] };

test("old, incomplete and failing browser evidence cannot be accepted", () => {
  validateReport(report, manifest, true);
  for (const changed of [{ incomplete: undefined }, { rendered: undefined }, { schemaVersion: 1 }]) {
    assert.throws(() => validateReport({ ...report, ...changed }, manifest, true), /invalid or outdated/);
  }
  assert.throws(() => validateReport({ ...report, sourceFingerprint: "previous" }, manifest, true), /stale/);
  assert.throws(() => validateReport({ ...report, rendered: 3 }, manifest, true), /incomplete/);
  assert.throws(() => validateReport({ ...report, errors: [{ error: "async action failed" }] }, manifest, true), /failed/);
});

test("split UTF-8 request chunks preserve non-ASCII report text", async () => {
  const req = new EventEmitter();
  const body = readReportBody(req);
  const input = Buffer.from('{"text":"Žλ🙂"}');
  for (const byte of input) req.emit("data", Buffer.from([byte]));
  req.emit("end");
  assert.deepEqual(JSON.parse(await body), { text: "Žλ🙂" });
});

test("oversized reports return 413 without destroying the request socket", async () => {
  const req = new EventEmitter();
  req.destroy = () => assert.fail("must not destroy the socket");
  const body = readReportBody(req, 3);
  req.emit("data", Buffer.from("four"));
  req.emit("end");
  await assert.rejects(body, error => error.status === 413);
});
