import test from "node:test";
import assert from "node:assert/strict";
import { alertMessage } from "../packages/ui/src/behaviors/alert.ts";

test("an alert announces its heading, then its content, as one message", () => {
  assert.equal(alertMessage("Workspace imported", "Your workspace is ready."), "Workspace imported. Your workspace is ready.");
  assert.equal(alertMessage(" Saved! ", " Changes were kept. "), "Saved! Changes were kept.");
  assert.equal(alertMessage("Сохранено…", "Готово."), "Сохранено… Готово.");
});

test("an alert without a heading or content announces what it has", () => {
  assert.equal(alertMessage("Workspace archived", ""), "Workspace archived");
  assert.equal(alertMessage("", "Your workspace is ready."), "Your workspace is ready.");
  assert.equal(alertMessage(" ", " "), "");
});
