// Guided Orca walkthrough: one scenario per page load, so each starts from a freshly
// mounted composition and its checks run in order on it. Answers stay in this browser's localStorage until the summary is sent.
import { mount } from "svelte";
import Case from "./Case.svelte";
import { cheatsheet, scenarios } from "./orca-plan.mjs";
import "@stylos/ui/tokens.css";
import "@stylos/ui/fonts.css";
import "@stylos/ui/text.css";

const app = document.querySelector("#app");
const manifest = await (await fetch("/manifest.json")).json();
// Answers belong to the build they were given on: a rebuilt source starts empty
// rather than inheriting answers and reporting them under its own identity.
const KEY = `stylos-orca-walkthrough:${manifest.sourceFingerprint}`;
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) ?? {}; } catch { return {}; } };
const store = Object.assign({ results: {}, orca: "50.3" }, load());
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch {} };
const RESULTS = { pass: "Работает как описано", fail: "Есть проблема", skip: "Не смог проверить" };
const chrome = navigator.userAgent.match(/Chrome\/([\d.]+)/)?.[1] ?? navigator.userAgent;

const escape = text => String(text).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const keys = text => escape(text).replace(/\[([^\]]+)\]/g, "<kbd>$1</kbd>");
const list = (tag, items) => `<${tag}>${items.map(item => `<li>${keys(item)}</li>`).join("")}</${tag}>`;
const go = target => { location.hash = target; location.reload(); };

function buildLine() {
  const b = manifest.build ?? {};
  const line = `Сборка ${b.commit ?? "?"} · ветка ${b.branch ?? "?"}${b.changed ? " · есть несохранённые изменения" : ""}`;
  const stale = b.master && !b.containsMaster;
  return `<p class="build">${escape(line)}</p>${stale ? `<div class="warn" role="alert"><strong>Это не текущий master.</strong>
    Страница собрана из ${escape(b.path ?? "")} (${escape(b.branch ?? "")}), в которой нет коммита master ${escape(b.master)}.
    Результаты проверки на ней недействительны — закрой страницу и сообщи об этом.</div>` : ""}`;
}

const checks = scenarios.flatMap(scenario => scenario.checks.map(check => ({ ...check, scenario })));

function checkCard(check) {
  const answer = store.results[check.id] ?? {};
  return `<section class="card" aria-labelledby="t-${check.id}" data-check="${check.id}">
    <h2 id="t-${check.id}">${check.id} · ${escape(check.title)}</h2>
    <h3>Что делать</h3>${list("ol", check.steps)}
    <h3>Что должен сказать Orca</h3>${list("ul", check.expect)}
    ${check.known ? `<p class="known"><strong>Подозрение:</strong> ${keys(check.known)} Подтверди или опровергни.</p>` : ""}
    <div class="result"><fieldset style="border:0;padding:0;margin:12px 0 0"><legend class="visually-hidden">Результат ${check.id}</legend>
      ${Object.entries(RESULTS).map(([value, label]) => `<label><input type="radio" name="r-${check.id}" value="${value}"${answer.result === value ? " checked" : ""}> ${label}</label>`).join("")}
    </fieldset>
    <label for="n-${check.id}" class="visually-hidden">Комментарий к ${check.id}</label>
    <textarea id="n-${check.id}" placeholder="Что услышал или что не так">${escape(answer.note ?? "")}</textarea></div>
  </section>`;
}

function scenarioPage(index) {
  const scenario = scenarios[index];
  const done = checks.filter(check => store.results[check.id]?.result).length;
  app.innerHTML = `
    <h1>Проверка Stylos с Orca</h1>${buildLine()}
    <div class="bar">
      <span>Сценарий ${index + 1} из ${scenarios.length}</span><progress max="${checks.length}" value="${done}"></progress><span>проверок отвечено ${done} из ${checks.length}</span>
      <label>Перейти: <select id="jump">${scenarios.map((s, i) => `<option value="${i}"${i === index ? " selected" : ""}>${escape(s.title)}${s.checks.every(c => store.results[c.id]?.result) ? " ✓" : ""}</option>`).join("")}</select></label>
      <button type="button" id="summary">Итог</button>
    </div>
    <details class="card"${index === 0 ? " open" : ""}><summary><strong>Шпаргалка Orca</strong> — клавиши и режимы</summary>${list("ul", cheatsheet)}</details>
    <section class="card" aria-labelledby="scenario-title">
      <h2 id="scenario-title">${escape(scenario.title)}</h2><p>${keys(scenario.intro)}</p>
      <p>Проверки ниже идут подряд на одном примере — каждая продолжает предыдущую. Начни с кнопки <strong>«К примеру»</strong>: фокус встанет прямо перед примером, следующий <kbd>Tab</kbd> попадёт в его первый элемент. Если сбился — «Начать сценарий заново».</p>
    </section>
    <div class="sample-head"><button type="button" id="focus">К примеру</button><button type="button" id="restart">Начать сценарий заново</button></div>
    <h2 id="sample-start" class="sample-title" tabindex="-1">Пример</h2>
    <section id="sample" lang="en" aria-labelledby="sample-start"></section>
    <div class="checks">${scenario.checks.map(checkCard).join("")}</div>
    <div class="nav">
      <button type="button" id="back"${index === 0 ? " disabled" : ""}>Предыдущий сценарий</button>
      <button type="button" class="primary" id="next">${index === scenarios.length - 1 ? "К итогу" : "Следующий сценарий"}</button>
    </div>`;

  const record = () => {
    for (const check of scenario.checks) {
      const result = app.querySelector(`input[name="r-${check.id}"]:checked`)?.value;
      const note = app.querySelector(`#n-${check.id}`).value.trim();
      if (result || note) store.results[check.id] = { result, note }; else delete store.results[check.id];
    }
    save();
  };
  app.addEventListener("change", record);
  app.addEventListener("input", record);
  app.querySelector("#jump").addEventListener("change", event => { record(); go(scenarios[event.target.value].id); });
  app.querySelector("#summary").addEventListener("click", () => { record(); go("summary"); });
  app.querySelector("#back").addEventListener("click", () => { record(); go(scenarios[index - 1].id); });
  app.querySelector("#next").addEventListener("click", () => { record(); go(index === scenarios.length - 1 ? "summary" : scenarios[index + 1].id); });
  const component = manifest.components.find(entry => entry.name === scenario.sample);
  mount(Case, { target: app.querySelector("#sample"), props: { name: scenario.sample, args: component?.cases[0] ?? {} } });
  app.querySelector("#focus").addEventListener("click", () => app.querySelector("#sample-start").focus());
  app.querySelector("#restart").addEventListener("click", () => { record(); location.reload(); });
}

function summaryText() {
  const b = manifest.build ?? {};
  const lines = [`# Orca walkthrough — ${new Date().toISOString().slice(0, 10)}`, "",
    `Build ${b.commit} (${b.branch}), source ${manifest.sourceFingerprint.slice(0, 12)}${b.changed ? ", uncommitted changes" : ""}${b.master && !b.containsMaster ? ` — NOT current master ${b.master}` : ""}`,
    `Chrome ${chrome}; Orca ${store.orca}; ${navigator.platform}`, ""];
  for (const step of checks) {
    const answer = store.results[step.id] ?? {};
    lines.push(`- ${step.id} ${step.scenario.title} / ${step.title}: ${answer.result ?? "no answer"}${answer.note ? ` — ${answer.note.replace(/\s+/g, " ")}` : ""}`);
  }
  return lines.join("\n");
}

function summaryPage() {
  const count = kind => checks.filter(step => (store.results[step.id]?.result ?? "none") === kind).length;
  const order = { fail: 0, skip: 1, none: 2, pass: 3 };
  const rows = checks.map((step, index) => ({ step, index, answer: store.results[step.id] ?? {} }))
    .sort((a, b) => order[a.answer.result ?? "none"] - order[b.answer.result ?? "none"] || a.index - b.index);
  app.innerHTML = `
    <h1>Итог проверки</h1>${buildLine()}
    <p>Chrome ${escape(chrome)} · <label>Orca <input id="orca" value="${escape(store.orca)}" size="8"></label> (в терминале: orca --version)</p>
    <p><span class="s-fail">Проблем: ${count("fail")}</span> · <span class="s-skip">Не проверено: ${count("skip")}</span> ·
      <span class="s-none">Без ответа: ${count("none")}</span> · <span class="s-pass">Работает: ${count("pass")}</span></p>
    <p><button type="button" class="primary" id="copy">Скопировать итог</button> <span id="copied"></span>
      <button type="button" id="resume">Вернуться к шагам</button> <button type="button" id="clear">Очистить все ответы</button></p>
    <table><thead><tr><th>Шаг</th><th>Результат</th><th>Комментарий</th></tr></thead><tbody>
      ${rows.map(({ step, answer }) => `<tr><td><a href="#${step.scenario.id}" data-step="${step.scenario.id}">${step.id} · ${escape(step.scenario.title)} / ${escape(step.title)}</a></td>
        <td class="s-${answer.result ?? "none"}">${answer.result ? RESULTS[answer.result] : "без ответа"}</td><td>${escape(answer.note ?? "")}</td></tr>`).join("")}
    </tbody></table>
    <h2>Текст для отправки</h2><pre id="text">${escape(summaryText())}</pre>`;
  app.querySelector("#orca").addEventListener("input", event => { store.orca = event.target.value.trim(); save(); app.querySelector("#text").textContent = summaryText(); });
  app.querySelector("#copy").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(summaryText()); app.querySelector("#copied").textContent = "Скопировано"; }
    catch { app.querySelector("#copied").textContent = "Не вышло — выдели текст ниже и скопируй вручную"; }
  });
  app.querySelector("#resume").addEventListener("click", () => go((checks.find(step => !store.results[step.id]?.result) ?? checks[0]).scenario.id));
  app.querySelector("#clear").addEventListener("click", () => { if (confirm("Удалить все ответы?")) { store.results = {}; save(); go(scenarios[0].id); } });
  for (const link of app.querySelectorAll("a[data-step]")) link.addEventListener("click", event => { event.preventDefault(); go(link.dataset.step); });
}

const target = location.hash.slice(1);
if (target === "summary") summaryPage();
else scenarioPage(Math.max(0, scenarios.findIndex(scenario => scenario.id === target)));
