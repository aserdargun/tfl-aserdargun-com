import { useEffect, useRef, useState } from "react";
import type { Simulation, Policy } from "../core/types";
import { metrics, requestMetrics } from "../core/metrics";
import { Timeline } from "./Inspector";
import { ms, num, type T } from "./i18n";
import type { ExperimentDraft } from "./ScenarioControls";
interface Row {
  policy: Policy;
  slots: number;
  ttft: number | null;
  itl: number | null;
  e2e: number | null;
  throughput: number;
  completed: number;
  rejected: number;
  duration: number;
}
export function MetricsPanel({
  s,
  selected,
  t,
  draft,
  onSelect,
}: {
  s: Simulation;
  selected: string;
  t: T;
  draft: ExperimentDraft;
  onSelect: (id: string) => void;
}) {
  const m = metrics(s);
  const r = s.requests.find((r) => r.id === selected);
  const rm = r ? requestMetrics(s, r) : null;
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const worker = useRef<Worker | null>(null);
  const [snapshot, setSnapshot] = useState<ExperimentDraft | null>(null);
  const stale =
    snapshot !== null && JSON.stringify(snapshot) !== JSON.stringify(draft);
  useEffect(() => () => worker.current?.terminate(), []);
  function compare() {
    worker.current?.terminate();
    setBusy(true);
    setError("");
    setRows([]);
    setSnapshot(structuredClone(draft));
    try {
      const w = new Worker(
        new URL("../core/comparison.worker.ts", import.meta.url),
        { type: "module" },
      );
      worker.current = w;
      w.onmessage = (e) => {
        setRows(e.data.result ?? []);
        setError(e.data.error ?? "");
        setBusy(false);
        w.terminate();
      };
      w.onerror = () => {
        setError(
          t(
            "Comparison worker could not run.",
            "Karşılaştırma işçisi çalışamadı.",
          ),
        );
        setBusy(false);
        w.terminate();
      };
      w.postMessage(draft);
    } catch {
      worker.current?.terminate();
      setError(
        t(
          "Comparison could not start. Try again.",
          "Karşılaştırma başlatılamadı. Yeniden dene.",
        ),
      );
      setBusy(false);
    }
  }
  return (
    <section className="experiment-panel metrics-panel">
      <div className="panel-heading">
        <div>
          <h2>
            {t(
              "Latency belongs to a request. Throughput belongs to the system.",
              "Gecikme bir isteğe, verim sisteme aittir.",
            )}
          </h2>
          <p>
            {t(
              "SIMULATED · cumulative since first arrival · unfinished TTFT/E2E values are excluded",
              "SİMÜLE · ilk gelişten itibaren birikimli · oluşmamış TTFT/uçtan uca değerler hariç",
            )}
          </p>
        </div>
      </div>
      <div className="metric-row">
        {[
          [t("Mean TTFT", "Ort. TTFT"), ms(m.ttft)],
          [t("Mean ITL", "Ort. ITL"), ms(m.itl)],
          [t("Mean end-to-end", "Ort. uçtan uca"), ms(m.e2e)],
          [
            t("Token throughput", "Token verimi"),
            `${num(m.throughput, 1)} tok/s`,
          ],
          [
            t("Mean queue (admitted)", "Ort. kuyruk (kabul edilen)"),
            ms(m.queue),
          ],
          [
            t("Request throughput", "İstek verimi"),
            `${num(m.requestThroughput, 2)} req/s`,
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <b>{value}</b>
          </div>
        ))}
      </div>
      {r && (
        <div className="latency-detail">
          <Timeline s={s} selected={selected} t={t} />
          <div>
            <h3>
              {t("Inter-token experience", "Tokenlar arası deneyim")} · {r.id}
            </h3>
            <div
              className="itl-chart"
              role="img"
              aria-label={t(
                `Token intervals: ${rm?.intervals.join(", ")} milliseconds`,
                `Token aralıkları: ${rm?.intervals.join(", ")} milisaniye`,
              )}
            >
              {rm?.intervals.slice(-32).map((v, i) => (
                <div key={i} title={`${v} ms`}>
                  <span
                    style={{
                      height: `${Math.max(3, (v / Math.max(...rm.intervals, 1)) * 64)}px`,
                    }}
                  />
                  <small>{v}</small>
                </div>
              ))}
            </div>
            {!rm?.intervals.length && (
              <p>
                {t(
                  "Deliver at least two tokens to observe an interval.",
                  "Bir aralık gözlemlemek için en az iki token iletilmeli.",
                )}
              </p>
            )}
            <p>
              {t(
                "Each bar is an observed delivery interval, in simulated ms.",
                "Her çubuk simülasyon milisaniyesiyle gözlenen bir iletim aralığıdır.",
              )}
            </p>
          </div>
        </div>
      )}
      <details>
        <summary>
          {t("Request latency distribution", "İstek gecikme dağılımı")}
        </summary>
        <div className="request-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>TTFT</th>
                <th>ITL</th>
                <th>{t("End-to-end", "Uçtan uca")}</th>
              </tr>
            </thead>
            <tbody>
              {s.requests.map((r) => {
                const m = requestMetrics(s, r);
                return (
                  <tr key={r.id}>
                    <td>
                      <button onClick={() => onSelect(r.id)}>{r.id}</button>
                    </td>
                    <td>{ms(m.ttft)}</td>
                    <td>{ms(m.itl)}</td>
                    <td>{ms(m.e2e)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
      <div className="comparison-head">
        <div>
          <h3>
            {t(
              "Same workload. Different scheduling.",
              "Aynı iş yükü. Farklı zamanlama.",
            )}
          </h3>
          <p>
            {t(
              "Runs the current experiment controls to completion in an isolated simulator. Your live request is preserved.",
              "Geçerli deney ayarlarını ayrı bir simülatörde sonuna kadar çalıştırır. Canlı isteğin korunur.",
            )}
          </p>
        </div>
        <button onClick={compare} disabled={busy}>
          {busy
            ? t("Simulating…", "Simüle ediliyor…")
            : t("Compare policies", "Politikaları karşılaştır")}
        </button>
      </div>
      {busy && (
        <button
          onClick={() => {
            worker.current?.terminate();
            setBusy(false);
            setSnapshot(null);
          }}
        >
          {t("Cancel comparison", "Karşılaştırmayı iptal et")}
        </button>
      )}
      {snapshot && (
        <p className="mono">
          {snapshot.count} {t("requests", "istek")} · {snapshot.promptTokens}{" "}
          {t("prompt tokens", "istem tokenı")} · ≤{snapshot.output}{" "}
          {t("output tokens", "çıktı tokenı")} · {t("seed", "tohum")}{" "}
          {snapshot.config.seed}
        </p>
      )}
      {stale && (
        <p className="warning" role="status">
          {t(
            "Controls changed. These results describe the previous comparison; run again to update.",
            "Ayarlar değişti. Bu sonuçlar önceki karşılaştırmaya ait; güncellemek için yeniden çalıştır.",
          )}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {rows.length > 0 && (
        <>
          <div className="request-table">
            <table data-testid="comparison">
              <thead>
                <tr>
                  <th>{t("Policy / active slots", "Politika / etkin yer")}</th>
                  <th>TTFT</th>
                  <th>ITL</th>
                  <th>{t("End-to-end", "Uçtan uca")}</th>
                  <th>{t("Duration", "Süre")}</th>
                  <th>tok/s</th>
                  <th>{t("Done / rejected", "Biten / red")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>
                      {r.policy === "static"
                        ? t("Static-like", "Sabit benzeri")
                        : r.policy === "continuous"
                          ? t("Continuous-like", "Sürekli benzeri")
                          : t("Fairness-oriented", "Adalet odaklı")}{" "}
                      · {r.slots}
                    </td>
                    <td>{ms(r.ttft)}</td>
                    <td>{ms(r.itl)}</td>
                    <td>{ms(r.e2e)}</td>
                    <td>{ms(r.duration)}</td>
                    <td>{num(r.throughput, 1)}</td>
                    <td>
                      {r.completed} / {r.rejected}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            {t(
              "These are simulator outcomes, not engine benchmarks. A larger batch may change throughput and individual latency differently; inspect both.",
              "Bunlar simülatör sonuçlarıdır, motor kıyaslamaları değildir. Büyük grup, verimi ve bireysel gecikmeyi farklı etkileyebilir; ikisini de incele.",
            )}
          </p>
        </>
      )}
    </section>
  );
}
