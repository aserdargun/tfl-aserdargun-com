import { useEffect, useState } from "react";
import type { Config, ScenarioId, Policy } from "../core/types";
import { scenarios, scenario } from "../core/scenarios";
import type { T } from "./i18n";
import { num } from "./i18n";
export interface ExperimentDraft {
  scenarioId: ScenarioId;
  config: Config;
  count: number;
  promptTokens: number;
  output: number;
}
export function ScenarioControls({
  draft,
  onDraft,
  onPreset,
  onRun,
  t,
}: {
  draft: ExperimentDraft;
  onDraft: (d: ExperimentDraft) => void;
  onPreset: (id: ScenarioId) => void;
  onRun: () => void;
  t: T;
}) {
  const [expanded, setExpanded] = useState(
    () => !matchMedia("(max-width: 650px)").matches,
  );
  useEffect(() => {
    const mq = matchMedia("(max-width: 650px)");
    const change = () => setExpanded(!mq.matches);
    mq.addEventListener("change", change);
    return () => mq.removeEventListener("change", change);
  }, []);
  const c = draft.config;
  const config = (v: Partial<Config>) =>
    onDraft({ ...draft, config: { ...c, ...v } });
  return (
    <details
      className="scenario-controls"
      open={expanded}
      onToggle={(e) => setExpanded(e.currentTarget.open)}
    >
      <summary>
        {t("Experiment controls", "Deney kontrolleri")}
        <span>
          {t(
            "Changes apply when you run a new scenario.",
            "Değişiklikler yeni senaryo çalıştırıldığında uygulanır.",
          )}
        </span>
      </summary>
      <div className="control-grid">
        <label>
          {t("Scenario", "Senaryo")}
          <select
            value={draft.scenarioId}
            onChange={(e) => onPreset(e.target.value as ScenarioId)}
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {t(...s.title)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("Requests", "İstekler")}
          <select
            value={draft.count}
            onChange={(e) => onDraft({ ...draft, count: +e.target.value })}
          >
            {[1, 2, 4, 8, 16, 32, 64].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label>
          {t("Prompt tokens", "İstem tokenı")}
          <select
            value={draft.promptTokens}
            onChange={(e) =>
              onDraft({ ...draft, promptTokens: +e.target.value })
            }
          >
            {[6, 32, 64, 128, 512, 2048, 8192, 32768].map((n) => (
              <option key={n} value={n}>
                {num(n)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("Max output tokens", "Azami çıktı tokenı")}
          <select
            value={draft.output}
            onChange={(e) => onDraft({ ...draft, output: +e.target.value })}
          >
            {[16, 24, 32, 48, 64, 128, 256].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label>
          {t("Scheduling policy", "Zamanlama politikası")}
          <select
            value={c.policy}
            onChange={(e) => config({ policy: e.target.value as Policy })}
          >
            <option value="continuous">
              {t("Continuous-batching-like", "Sürekli gruplama benzeri")}
            </option>
            <option value="static">
              {t("FIFO / static batch-like", "FIFO / sabit grup benzeri")}
            </option>
            <option value="fair">
              {t("Fairness-oriented", "Adalet odaklı")}
            </option>
          </select>
        </label>
        <label>
          {t("Max active requests", "Azami etkin istek")}
          <select
            value={c.maxActive}
            onChange={(e) => config({ maxActive: +e.target.value })}
          >
            {[1, 2, 4, 8, 16].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label>
          {t("Max batch tokens / tick", "Adım başına azami grup tokenı")}
          <select
            value={c.maxBatchTokens}
            onChange={(e) => config({ maxBatchTokens: +e.target.value })}
          >
            {[16, 32, 64, 128, 256, 512].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label>
          {t("KV capacity (token slots)", "KV kapasitesi (token yeri)")}
          <select
            value={c.kvCapacityTokens}
            onChange={(e) => config({ kvCapacityTokens: +e.target.value })}
          >
            {[128, 256, 600, 1200, 4096, 16384, 40000].map((n) => (
              <option key={n} value={n}>
                {num(n)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("Workload seed", "İş yükü tohumu")}
          <input
            type="number"
            min="0"
            max="999999"
            step="1"
            value={c.seed}
            onChange={(e) =>
              config({
                seed: Math.max(
                  0,
                  Math.min(999999, Math.floor(Number(e.target.value))),
                ),
              })
            }
          />
        </label>
        <label>
          {t("Weight footprint (synthetic)", "Ağırlık boyutu (sentetik)")}
          <select
            value={c.model.weightMiB}
            onChange={(e) =>
              config({ model: { ...c.model, weightMiB: +e.target.value } })
            }
          >
            <option value="2048">{t("Small", "Küçük")} · 2 GiB</option>
            <option value="4096">{t("Medium", "Orta")} · 4 GiB</option>
            <option value="8192">{t("Large", "Büyük")} · 8 GiB</option>
          </select>
        </label>
        <label>
          {t(
            "Accelerator memory (synthetic)",
            "Hızlandırıcı belleği (sentetik)",
          )}
          <select
            value={c.hardware.memoryMiB}
            onChange={(e) =>
              config({
                hardware: { ...c.hardware, memoryMiB: +e.target.value },
              })
            }
          >
            {[4096, 8192, 12288, 16384].map((n) => (
              <option key={n} value={n}>
                {n / 1024} GiB
              </option>
            ))}
          </select>
        </label>
        <button
          className="primary run-scenario"
          onClick={() => {
            onRun();
            if (matchMedia("(max-width: 650px)").matches) setExpanded(false);
          }}
        >
          {t("Run scenario", "Senaryoyu çalıştır")}
        </button>
      </div>
      <p>
        {t(...scenario(draft.scenarioId).description)}{" "}
        {t(
          "Seed varies output lengths within the limit. Long Context mixes one long prompt with short requests.",
          "Tohum, çıktı uzunluklarını sınır içinde değiştirir. Uzun Bağlam, uzun bir istemi kısa isteklerle karıştırır.",
        )}
      </p>
    </details>
  );
}
