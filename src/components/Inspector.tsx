import type { Simulation } from "../core/types";
import { requestMetrics } from "../core/metrics";
import { num, ms, stateName, reasonName, eventName, type T } from "./i18n";
export function Inspector({
  s,
  selected,
  t,
}: {
  s: Simulation;
  selected: string;
  t: T;
}) {
  const r = s.requests.find((r) => r.id === selected);
  const m = r ? requestMetrics(s, r) : null;
  const ev = s.events.filter(
    (e) =>
      e.requestId === selected &&
      !["CACHE_ALLOCATED", "TOKEN_DECODE_STARTED", "TOKEN_SAMPLED"].includes(
        e.type,
      ),
  );
  return (
    <aside
      className="inspector"
      aria-label={t("Request inspector", "İstek inceleyici")}
    >
      <div className="inspector-heading">
        <h2>{t("Request inspector", "İstek inceleyici")}</h2>
        <span className="mono">{r?.id ?? "—"}</span>
      </div>
      {r && m ? (
        <>
          <dl>
            <dt>{t("State", "Durum")}</dt>
            <dd>
              <span
                className={`state-badge ${r.state}`}
                data-testid="request-state"
              >
                {t(...stateName[r.state])}
              </span>
            </dd>
            <dt>{t("Arrival", "Geliş")}</dt>
            <dd>
              {m.arrival === undefined
                ? t("Not yet", "Henüz değil")
                : ms(m.arrival)}
            </dd>
            <dt>{t("Prompt tokens", "İstem tokenı")}</dt>
            <dd>{num(r.promptTokens)}</dd>
            <dt>{t("Output tokens", "Çıktı tokenı")}</dt>
            <dd data-testid="output-count">
              {r.generated} / {r.maxOutput}
            </dd>
            <dt>{t("Queue time", "Kuyruk süresi")}</dt>
            <dd>{ms(m.queue)}</dd>
            <dt>{t("Prefill duration", "Ön doldurma süresi")}</dt>
            <dd>{ms(m.prefill)}</dd>
            <dt>
              <abbr
                title={t(
                  "Time from arrival to first delivered token",
                  "Gelişten ilk iletilen tokena kadar geçen süre",
                )}
              >
                TTFT
              </abbr>
            </dt>
            <dd data-testid="ttft">{ms(m.ttft)}</dd>
            <dt>
              <abbr
                title={t(
                  "Mean interval between delivered tokens",
                  "İletilen tokenlar arasındaki ortalama süre",
                )}
              >
                ITL
              </abbr>
            </dt>
            <dd>{ms(m.itl)}</dd>
            <dt>{t("End-to-end", "Uçtan uca")}</dt>
            <dd>{ms(m.e2e)}</dd>
            <dt>{t("KV written", "KV yazıldı")}</dt>
            <dd>{num(r.kvTokens * s.config.model.kvMiBPerToken, 1)} MiB</dd>
          </dl>
          {r.reason && <p className="decision">{t(...reasonName[r.reason])}</p>}
          <p className="inspector-caption">
            {t(
              "All times use the simulation clock. TTFT freezes at first delivery; ITL averages observed intervals.",
              "Tüm süreler simülasyon saatindedir. TTFT ilk iletimde sabitlenir; ITL gözlenen aralıkların ortalamasıdır.",
            )}
          </p>
          <Timeline s={s} selected={selected} t={t} />
          <details className="event-details" open={ev.length < 8}>
            <summary>
              {t("Event log", "Olay kaydı")} · {ev.length}
            </summary>
            <ol className="event-log">
              {ev.map((e) => (
                <li key={e.id}>
                  <time>{num(e.at)} ms</time>
                  <span>
                    {t(...eventName[e.type])}
                    {e.type === "TOKEN_EMITTED" ? ` #${e.value}` : ""}
                  </span>
                </li>
              ))}
            </ol>
          </details>
          <details>
            <summary>
              {t("Advanced request details", "Gelişmiş istek ayrıntıları")}
            </summary>
            <p className="mono">{r.prompt}</p>
            <p>
              {t("Reserved token slots", "Ayrılan token yeri")}:{" "}
              {r.reservedTokens}
              <br />
              {t(
                "Decode steps completed",
                "Tamamlanan çözümleme adımları",
              )}: {Math.max(0, r.kvTokens - r.promptTokens, r.generated - 1)}
              <br />
              {t("Completion", "Tamamlanma")}: {ms(m.end)}
            </p>
          </details>
        </>
      ) : (
        <div className="inspector-empty">
          <span className="empty-id">REQ—</span>
          <h3>
            {t("Every request has a story.", "Her isteğin bir hikâyesi var.")}
          </h3>
          <p>
            {t(
              "Send a prompt, then select a request to inspect its timing, tokens and memory.",
              "Bir istem gönder; sürelerini, tokenlarını ve belleğini incelemek için bir istek seç.",
            )}
          </p>
          <ol>
            <li>{t("Arrive & wait", "Geliş ve bekleme")}</li>
            <li>{t("Prefill & KV", "Ön doldurma ve KV")}</li>
            <li>{t("Decode & stream", "Çözümleme ve akış")}</li>
          </ol>
        </div>
      )}
    </aside>
  );
}
export function Timeline({
  s,
  selected,
  t,
}: {
  s: Simulation;
  selected: string;
  t: T;
}) {
  const r = s.requests.find((r) => r.id === selected);
  if (!r) return null;
  const m = requestMetrics(s, r);
  if (m.arrival === undefined) return null;
  const end = m.end ?? m.rejectedAt ?? s.time;
  const duration = Math.max(1, end - m.arrival);
  const start = m.arrival;
  const segments = [
    {
      name: t("Queue", "Kuyruk"),
      start,
      end: m.admitted ?? end,
      cls: "queue-seg",
    },
    {
      name: t("Schedule", "Zamanlama"),
      start: m.admitted,
      end: m.prefillStart ?? end,
      cls: "schedule-seg",
    },
    {
      name: t("Prefill", "Ön doldurma"),
      start: m.prefillStart,
      end: m.prefillEnd ?? end,
      cls: "prefill-seg",
    },
    {
      name: t("Generate / deliver", "Üret / ilet"),
      start: m.prefillEnd,
      end,
      cls: "decode-seg",
    },
  ].filter((x) => x.start !== undefined && x.end > x.start!);
  return (
    <div className="timeline">
      <h3>{t("Execution timeline", "Yürütme zaman çizelgesi")}</h3>
      <div className="timeline-track">
        {segments.map((x) => (
          <span
            key={x.name}
            className={x.cls}
            style={{ width: `${((x.end - x.start!) / duration) * 100}%` }}
            title={`${x.name}: ${x.end - x.start!} ms`}
          />
        ))}
        {m.first !== undefined && (
          <i
            className="first-token"
            style={{ left: `${((m.first - start) / duration) * 100}%` }}
            title={`TTFT: ${m.ttft} ms`}
          />
        )}
      </div>
      <div className="timeline-axis">
        <span>{num(start)} ms</span>
        <span>{num(end)} ms</span>
      </div>
      <div className="timeline-legend">
        {segments.map((x) => (
          <span key={x.name}>
            <i className={x.cls} />
            {x.name} {num(x.end - x.start!)} ms
          </span>
        ))}
      </div>
      {m.first !== undefined && (
        <p className="mint">
          ● {t("First token", "İlk token")}: {num(m.first)} ms · TTFT{" "}
          {ms(m.ttft)}
        </p>
      )}
    </div>
  );
}
