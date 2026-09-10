import { readServing, executionLink } from "./ils/handoff";
import { buildReturnLearningLink } from "@aserdargun/lab-core";
import { learningGraph } from "./ils/graph";
import "./ils/handoff.css";
import { useState, useEffect, useCallback } from "react";
import { ArrowRight, Send, Plus, Download, Layers } from "lucide-react";
import {
  createSimulation,
  step,
  finished,
  addRequests,
  tokenize,
  TICK_MS,
} from "./core/simulation";
import {
  scenario,
  scenarioConfig,
  scenarioRequests,
  scenarios,
} from "./core/scenarios";
import type { ScenarioId, Simulation } from "./core/types";
import { ServingWorld } from "./visualization/ServingWorld";
import { Inspector } from "./components/Inspector";
import { Playback } from "./components/Playback";
import { LessonPanel } from "./components/LessonPanel";
import {
  ScenarioControls,
  type ExperimentDraft,
} from "./components/ScenarioControls";
import { MemoryPanel } from "./components/MemoryPanel";
import { MetricsPanel } from "./components/MetricsPanel";
import { ContextPanel } from "./components/ContextPanel";
import { exportSimulation } from "./core/export";
import { ExportDialog } from "./components/ExportDialog";
import { lessons } from "./lessons/lessons";
import { lessonCheckpoint } from "./lessons/checkpoint";
import type { Locale } from "./components/i18n";
import { LabShell, LearningContextNotice } from "@aserdargun/lab-ui";
import { manifest, experiments } from "./ils/catalog";
import { readTflContext, contextExplanation, gpuHandoff } from "./ils/context";
import { readEntry } from "./ils/routing";
type Mode = "follow" | "load" | "memory" | "scheduler" | "metrics" | "labs";
const modes: { id: Mode; name: [string, string] }[] = [
  { id: "follow", name: ["Follow", "İzle"] },
  { id: "load", name: ["Load", "Yük"] },
  { id: "memory", name: ["Memory", "Bellek"] },
  { id: "scheduler", name: ["Scheduler", "Zamanlayıcı"] },
  { id: "metrics", name: ["Metrics", "Ölçütler"] },
  { id: "labs", name: ["Labs", "Deneyler"] },
];
const newDraft = (id: ScenarioId): ExperimentDraft => ({
  scenarioId: id,
  config: scenarioConfig(id),
  count: scenario(id).count,
  promptTokens: scenario(id).promptTokens,
  output: scenario(id).output,
});
const initialLocale = (): Locale => {
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "tr" || q === "en") return q;
  try {
    return localStorage.getItem("tfl-language") === "tr" ? "tr" : "en";
  } catch {
    return "en";
  }
};
function replaySnapshot(next: Simulation) {
  return createSimulation(
    next.config,
    next.requests.map(({ id, prompt, promptTokens, maxOutput, arrival }) => ({
      id,
      prompt,
      promptTokens,
      maxOutput,
      arrival,
    })),
  );
}
export default function App() {
  const [incoming] = useState(() => readServing(new URL(location.href)));
  const [entry] = useState(() => readEntry(new URL(location.href)));
  const [learningContext] = useState(() =>
    readTflContext(new URL(location.href)),
  );
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const t = (en: string, tr: string) => (locale === "en" ? en : tr);
  const [s, setS] = useState(() =>
    incoming ? createSimulation(incoming.draft.config,scenarioRequests(incoming.draft.scenarioId,incoming.draft.count,incoming.draft.promptTokens,incoming.draft.output)) : entry.chapter !== null
      ? lessonCheckpoint(entry.chapter)
      : createSimulation(
          scenarioConfig(entry.experiment),
          new URL(location.href).searchParams.has("experiment")
            ? scenarioRequests(entry.experiment)
            : [],
        ),
  );
  const [initial, setInitial] = useState<Simulation>(() =>
    entry.chapter !== null ? replaySnapshot(s) : structuredClone(s),
  );
  const [selected, select] = useState(s.requests[0]?.id ?? "");
  const [playing, play] = useState(false);
  const canAdvance = s.requests.length > 0 && !finished(s);
  const [speed, setSpeed] = useState(1);
  const [prompt, setPrompt] = useState("What is a world model?");
  const [mode, setMode] = useState<Mode>(
    entry.chapter !== null || entry.experiment === "single"
      ? "follow"
      : entry.experiment === "kv"
        ? "memory"
        : "load",
  );
  const [resourceView, setResourceView] = useState(false);
  const [activeExperiment, setActiveExperiment] = useState<ScenarioId>(
    incoming?.draft.scenarioId ?? (entry.chapter !== null ? "single" : entry.experiment),
  );
  const [draft, setDraft] = useState(() =>
    incoming?.draft ?? newDraft(entry.chapter !== null ? "single" : entry.experiment),
  );
  const [appliedDraft, setAppliedDraft] = useState(draft);
  const draftChanged = JSON.stringify(draft) !== JSON.stringify(appliedDraft);
  const [chapter, setChapter] = useState(entry.chapter ?? 0);
  const [guided, setGuided] = useState(!incoming && entry.chapter !== null);
  const [exportData, setExportData] = useState<string | null>(null);
  const reset = useCallback(() => {
    play(false);
    setGuided(false);
    setS(structuredClone(initial));
    select(initial.requests[0]?.id ?? "");
  }, [initial]);
  const tick = useCallback(() => {
    play(false);
    setS((p) => step(p));
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setS((p) => step(p)), 200 / speed);
    return () => clearInterval(timer);
  }, [playing, speed]);
  useEffect(() => {
    if (finished(s)) play(false);
  }, [s]);
  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem("tfl-language", locale);
    } catch {
      /* unavailable storage does not prevent use */
    }
    const url = new URL(location.href);
    url.searchParams.set("lang", locale);
    history.replaceState(null, "", url);
  }, [locale]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.target instanceof Element &&
        e.target.closest(
          "input,textarea,select,button,a,summary,dialog,[contenteditable=true]",
        )
      )
        return;
      if (
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.repeat ||
        document.querySelector("dialog[open]")
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        if (canAdvance) play((v) => !v);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (canAdvance) tick();
      }
    };
    const hidden = () => {
      if (document.hidden) play(false);
    };
    window.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [canAdvance, tick]);
  function install(d: ExperimentDraft, autoplay = true) {
    const next = createSimulation(
      d.config,
      scenarioRequests(
        d.scenarioId,
        d.count,
        d.promptTokens,
        d.output,
        d.config.seed,
      ),
    );
    setS(next);
    setInitial(structuredClone(next));
    select(next.requests[0]?.id ?? "");
    play(autoplay && !matchMedia("(prefers-reduced-motion: reduce)").matches);
    setDraft(d);
    setAppliedDraft(d);
    setActiveExperiment(d.scenarioId);
    setGuided(false);
  }
  function preset(id: ScenarioId) {
    const d = newDraft(id);
    install(d, false);
  }
  function send() {
    if (!prompt.trim() || s.requests.length >= 128) return;
    const id = `REQ-${String(s.requests.length + 1).padStart(3, "0")}`;
    const next = addRequests(s, [
      {
        id,
        prompt,
        promptTokens: Math.max(1, tokenize(prompt).length),
        maxOutput: appliedDraft.output,
        arrival: s.tick * TICK_MS,
      },
    ]);
    setS(next);
    setInitial(replaySnapshot(next));
    select(id);
    play(!matchMedia("(prefers-reduced-motion: reduce)").matches);
    setGuided(false);
  }
  function addLoad() {
    const count = Math.min(
      s.requests.length ? 15 : 16,
      128 - s.requests.length,
    );
    if (count <= 0) return;
    const next = addRequests(
      s,
      scenarioRequests(
        "burst",
        count,
        Math.min(appliedDraft.promptTokens, 512),
        appliedDraft.output,
        s.config.seed,
        s.tick * TICK_MS,
        s.requests.length + 1,
      ),
    );
    setS(next);
    setInitial(replaySnapshot(next));
    if (!selected) select(next.requests[0].id);
    play(!matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMode("load");
    setResourceView(true);
    setGuided(false);
  }
  function checkpoint() {
    play(false);
    setGuided(true);
    const next = lessonCheckpoint(chapter);
    setS(next);
    setInitial(replaySnapshot(next));
    setDraft(newDraft("single"));
    setAppliedDraft(newDraft("single"));
    setActiveExperiment("single");
    select(next.requests[0]?.id ?? "");
  }
  function exportEvents() {
    play(false);
    setExportData(exportSimulation(s));
  }
  const hasControls = mode !== "follow";
  return (
    <>
      <a className="skip-link" href="#laboratory">
        {t("Skip to laboratory", "Laboratuvara geç")}
      </a>
      <header>
        <a className="brand" href="/">
          <b>TFL</b>
          <span>/</span>
          <span>TOKEN FLOW LABORATORY</span>
        </a>
        <span className="simulation-label">
          {t("Educational Simulation", "Eğitim Simülasyonu")}
        </span>
        <nav
          className="ecosystem"
          aria-label={t("Learning ecosystem", "Öğrenme ekosistemi")}
        >
          <a
            href={`https://llm.aserdargun.com/${locale}`}
            target="_blank"
            rel="noreferrer"
          >
            LLM Atlas
          </a>
          <ArrowRight />
          <b>TFL</b>
          <ArrowRight />
          <a
            href={`https://gex.aserdargun.com/gex/anatomy?lang=${locale}`}
            target="_blank"
            rel="noreferrer"
          >
            GEX
          </a>
        </nav>
        <div className="locale">
          {(["en", "tr"] as const).map((l) => (
            <button
              key={l}
              aria-pressed={locale === l}
              onClick={() => setLocale(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      <main>
        <section className="hero">
          <h1>
            {t(
              "Follow a request from prompt to next token.",
              "Bir isteği istemden sonraki tokena kadar izle.",
            )}
          </h1>
          <p>
            {t(
              "One model. Many requests. Finite resources.",
              "Tek model. Çok sayıda istek. Sınırlı kaynaklar.",
            )}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <div className="send-form">
              <input
                aria-label={t("Prompt", "İstem")}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                maxLength={500}
              />
              <button
                className="primary"
                disabled={!prompt.trim() || s.requests.length >= 128}
              >
                <Send />
                {t("Send", "Gönder")}
              </button>
            </div>
            <small>
              {t(
                "Local educational tokenization · no prompt leaves this browser.",
                "Yerel eğitimsel tokenlaştırma · istem bu tarayıcıdan çıkmaz.",
              )}
              {s.requests.length >= 128 && (
                <span className="warning">
                  {" "}
                  {t(
                    "Request limit reached (128). Load a new scenario to continue.",
                    "İstek sınırına ulaşıldı (128). Devam etmek için yeni senaryo yükle.",
                  )}
                </span>
              )}
            </small>
          </form>
        </section>
        <nav
          className="mode-nav"
          aria-label={t("Laboratory modes", "Laboratuvar kipleri")}
        >
          {modes.map((x) => (
            <button
              key={x.id}
              aria-pressed={mode === x.id}
              onClick={() => setMode(x.id)}
            >
              {t(...x.name)}
            </button>
          ))}
        </nav>
        {mode === "labs" && (
          <div className="scenario-catalog">
            {scenarios
              .filter((s) => s.id !== "single")
              .map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => preset(sc.id)}
                  aria-pressed={draft.scenarioId === sc.id}
                >
                  <span>{t(...sc.title)}</span>
                  <small>{t(...sc.description)}</small>
                  <ArrowRight />
                </button>
              ))}
          </div>
        )}
        {hasControls && (
          <ScenarioControls
            draft={draft}
            onDraft={setDraft}
            onPreset={(id) => setDraft(newDraft(id))}
            onRun={() => install(draft)}
            t={t}
            dirty={draftChanged}
          />
        )}
        <div className="experiment-status" aria-live="polite">
          <span>
            {t("Loaded experiment", "Yüklü deney")}:{" "}
            <b>{t(...scenario(activeExperiment).title)}</b>
          </span>
          <span>
            {s.requests.length} {t("requests", "istek")} ·{" "}
            {s.requests.filter((r) => r.state === "completed").length}{" "}
            {t("completed", "tamamlandı")} ·{" "}
            {s.requests.filter((r) => r.state === "rejected").length}{" "}
            {t("rejected", "reddedildi")}
          </span>
          {draftChanged && (
            <span className="warning">
              {t(
                "Unapplied changes — run the scenario to apply.",
                "Uygulanmamış değişiklikler — uygulamak için senaryoyu çalıştır.",
              )}
            </span>
          )}
        </div>
        <div className="lab-toolbar">
          <span>
            {t(
              "MODEL INFERENCE ≠ MODEL SERVING",
              "MODEL ÇIKARIMI ≠ MODEL SUNUMU",
            )}
          </span>
          <div>
            <button onClick={addLoad} disabled={s.requests.length >= 128}>
              <Plus />
              {t("Add load", "Yük ekle")}
            </button>
            <button
              onClick={() => {
                preset("long");
                setMode("load");
              }}
            >
              {t("32K context", "32K bağlam")}
            </button>
            <button
              onClick={() => {
                preset("kv");
                setMode("memory");
              }}
            >
              {t("Memory pressure", "Bellek baskısı")}
            </button>
            <button
              aria-pressed={resourceView}
              onClick={() => setResourceView(!resourceView)}
            >
              <Layers />
              {resourceView
                ? t("Resource view", "Kaynak görünümü")
                : t("Request view", "İstek görünümü")}
            </button>
          </div>
        </div>
        {incoming && <section className="semantic-handoff" data-testid="serving-context">
          <strong>{t("Starting context from", "Başlangıç bağlamı:")} {incoming.context.sourceLab.toUpperCase()}</strong>
          <p data-testid="serving-projection">{incoming.draft.config.model.name} · {incoming.draft.promptTokens} {t("prompt tokens", "istem tokenı")} · {incoming.draft.count} {t("requests", "istek")} · {incoming.draft.config.maxActive} {t("active slots", "etkin yer")}</p>
          <p>{incoming.context.profile==='serving-workload' ? t("Typical context becomes the illustrative input length; average concurrency becomes active slots and peak concurrency becomes the arriving cohort. Weight storage is calculated from the model class and bit width. KV/token, a 75% cohort reservation budget, memory pool and timings are TFL assumptions, not the DCL hardware. Supported bounds: 32K context, 16 active slots, 64 arrivals.", "Tipik bağlam örnek girdi uzunluğuna, ortalama eşzamanlılık etkin yerlere, tepe eşzamanlılık gelen istek grubuna dönüşür. Ağırlık belleği model sınıfı ve bit genişliğinden hesaplanır. KV/token, grubun %75’i için rezervasyon bütçesi, bellek havuzu ve süreler TFL varsayımlarıdır; DCL donanımı değildir. Sınırlar: 32K bağlam, 16 etkin yer, 64 istek.") : t("ARL’s context pressure class maps to 128 or 8192 illustrative input tokens. Priority is descriptive; TFL does not implement per-request priority scheduling. This is a new request, with no agent content or authority.", "ARL’nin bağlam baskısı sınıfı 128 veya 8192 örnek girdi tokenına eşlenir. Öncelik betimseldir; TFL istek başına öncelik zamanlaması uygulamaz. Bu, ajan içeriği veya yetkisi taşımayan yeni bir istektir.")}</p>
          <p>{t("This describes the imported starting profile. Current controls and replay remain authoritative.", "Bu bilgi içe aktarılan başlangıç profilini açıklar. Güncel kontroller ve tekrar oynatım belirleyicidir.")}</p>
          <a data-testid="return-source" href={buildReturnLearningLink(learningGraph,incoming.context,locale) ?? undefined}>{t("Return to", "Geri dön:")} {incoming.context.sourceLab.toUpperCase()}</a>
        </section>}
        {new URL(location.href).searchParams.has('ils') && !incoming && !learningContext && <section className="semantic-handoff" role="status">{t("This learning context is unavailable or outside the supported scenario range. The standard experiment is ready.", "Bu öğrenme bağlamı kullanılamıyor veya desteklenen senaryo aralığı dışında. Standart deney hazır.")}</section>}
        {learningContext && (
          <LearningContextNotice
            source="GEX"
            explanation={contextExplanation}
            locale={locale}
          />
        )}
        <div className="lab-layout" id="laboratory" tabIndex={-1}>
          <div className="world-column">
            <ServingWorld
              s={s}
              selected={selected}
              onSelect={select}
              t={t}
              locale={locale}
              resourceView={resourceView}
              highlight={guided ? lessons[chapter].focus : undefined}
              sourceExperiment={activeExperiment}
            />
            <Playback
              locale={locale}
              t={t}
              playing={playing}
              disabled={!canAdvance}
              time={s.time}
              speed={speed}
              onPlay={() => play(!playing)}
              onStep={tick}
              onReset={reset}
              onSpeed={setSpeed}
            />
          </div>
          <Inspector s={s} selected={selected} t={t} />
        </div>
        {mode === "memory" && <MemoryPanel s={s} t={t} />}
        {mode === "scheduler" && (
          <section className="experiment-panel scheduler-explainer">
            <h2>
              {t(
                "The scheduler makes a choice at every opportunity.",
                "Zamanlayıcı her fırsatta bir seçim yapar.",
              )}
            </h2>
            <div>
              <p>
                <b>{t("Static batch-like", "Sabit grup benzeri")}</b>
                {t(
                  "Admit a cohort, then wait until its last request finishes. A completed slot stays held by the cohort.",
                  "Bir grubu kabul et, sonra son isteğin bitmesini bekle. Tamamlanan yer grup tarafından tutulur.",
                )}
              </p>
              <p>
                <b>
                  {t("Continuous-batching-like", "Sürekli gruplama benzeri")}
                </b>
                {t(
                  "Refill free slots as requests finish, subject to memory and active limits. Work visits requests in arrival order.",
                  "İstekler bitince bellek ve etkinlik sınırlarına göre boş yerleri doldur. İş, geliş sırasıyla isteklere uğrar.",
                )}
              </p>
              <p>
                <b>{t("Fairness-oriented", "Adalet odaklı")}</b>
                {t(
                  "Rotate the first request receiving compute each tick. Admission still respects memory and slots; this is not a starvation guarantee.",
                  "Her adımda hesaplamayı ilk alan isteği döndür. Kabul bellek ve yer sınırlarına uyar; bu, aç kalmama garantisi değildir.",
                )}
              </p>
            </div>
            <button
              onClick={() => {
                preset("batching");
                setMode("metrics");
              }}
            >
              {t("Open batching comparison", "Gruplama karşılaştırmasını aç")}
              <ArrowRight />
            </button>
          </section>
        )}
        {mode === "metrics" && (
          <MetricsPanel
            s={s}
            selected={selected}
            t={t}
            draft={draft}
            onSelect={select}
          />
        )}
        <LessonPanel
          s={s}
          index={chapter}
          onIndex={(i) => {
            play(false);
            setChapter(i);
            setGuided(false);
          }}
          onCheckpoint={checkpoint}
          t={t}
          locale={locale}
        />
        <section className="semantic-handoff">
          <strong>{t("Serve → Execute", "Sun → Yürüt")}</strong>
          <p>{t("Open a GPU teaching scene for the phase you want to inspect. This transfers a compute/access pattern, never an exact kernel trace.", "İncelemek istediğiniz aşama için GPU eğitim sahnesini açın. Hesaplama/erişim örüntüsü aktarılır; kesin kernel izi aktarılmaz.")}</p>
          <a data-testid="tfl-to-gex-prefill" href={executionLink('prefill',activeExperiment,locale)}>{t("Prefill: dive into matrix execution → GEX", "Prefill: matris yürütmesine in → GEX")}</a>
          <a data-testid="tfl-to-gex-decode" href={executionLink('decode',activeExperiment,locale)}>{t("Decode: inspect GPU memory → GEX", "Decode: GPU belleğini incele → GEX")}</a>
        </section>
        <LabShell
          manifest={manifest}
          experiment={experiments.find((x) => x.id === activeExperiment)!}
          locale={locale}
          relatedLabs={manifest.related.labs!.map((link) =>
            link.id === "gex"
              ? {
                  ...link,
                  url: gpuHandoff(
                    chapter === 6 ? "decode" : "prefill",
                    locale,
                    activeExperiment,
                    s.requests[0]?.promptTokens,
                    s.requests.length,
                  ),
                }
              : link,
          )}
        />
        <ContextPanel t={t} locale={locale} />
        <footer>
          <span>
            {t(
              "Synthetic timings. Conceptual memory. No hardware benchmark.",
              "Sentetik süreler. Kavramsal bellek. Donanım kıyaslaması değildir.",
            )}
            <br />
            {t(
              "Keyboard: Space to play/pause · Right arrow to step.",
              "Klavye: Boşluk oynat/duraklat · Sağ ok bir adım.",
            )}{" "}
            <a href="https://aserdargun.com" target="_blank" rel="noreferrer">
              AI Learning System
            </a>
          </span>
          <button onClick={exportEvents} disabled={!s.events.length}>
            <Download />
            {t("Export simulated events", "Simüle olayları dışa aktar")}
          </button>
        </footer>
      </main>
      {exportData !== null && (
        <ExportDialog
          data={exportData}
          onClose={() => setExportData(null)}
          t={t}
        />
      )}
    </>
  );
}
