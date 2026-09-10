import {
  ArrowRight,
  ArrowDown,
  CornerDownRight,
  ExternalLink,
} from "lucide-react";
import type { ServingRequest, Simulation } from "../core/types";
import { active, allocated, capacity, reserved } from "../core/simulation";
import {
  num,
  reasonName,
  stateName,
  type T,
  type Locale,
} from "../components/i18n";
import { gpuHandoff } from "../ils/context";
const colors = [
  "#79deba",
  "#dfb45e",
  "#90bafa",
  "#c5a1e5",
  "#e9a195",
  "#aed383",
];
export const requestColor = (id: string) =>
  colors[(Number(id.split("-")[1]) - 1) % colors.length];
export function RequestChip({
  r,
  selected,
  onSelect,
  t,
}: {
  r: ServingRequest;
  selected: string;
  onSelect: (id: string) => void;
  t: T;
}) {
  return (
    <button
      className={`request-chip ${selected === r.id ? "selected" : ""} ${r.state}`}
      style={{ "--request-color": requestColor(r.id) } as React.CSSProperties}
      onClick={() => onSelect(r.id)}
      aria-pressed={selected === r.id}
    >
      <span>{r.id}</span>
      <small>{t(...stateName[r.state])}</small>
    </button>
  );
}
export function ServingWorld({
  s,
  selected,
  onSelect,
  t,
  locale,
  resourceView,
  highlight,
  sourceExperiment,
}: {
  s: Simulation;
  selected: string;
  onSelect: (id: string) => void;
  t: T;
  locale: Locale;
  resourceView: boolean;
  highlight?: string;
  sourceExperiment: string;
}) {
  const waiting = s.requests.filter((r) => r.state === "waiting");
  const live = s.requests.filter(active);
  const r = s.requests.find((r) => r.id === selected);
  const cap = capacity(s),
    used = allocated(s),
    held = reserved(s);
  const done = s.requests.filter(
    (r) => r.state === "completed" || r.state === "rejected",
  );
  const pending = s.requests.filter((r) => r.state === "pending");
  const state = r?.state;
  const tokens = r?.promptTokens ?? 6;
  return (
    <section
      className="world"
      aria-label={t("Serving system", "Sunum sistemi")}
    >
      <div className="panel-heading">
        <div>
          <h2>
            {t("Serving system", "Sunum sistemi")}{" "}
            <span>
              {t(
                "One model. Finite resources.",
                "Tek model. Sınırlı kaynaklar.",
              )}
            </span>
          </h2>
          <p>
            {t(
              "Every request, token and allocation follows the simulation.",
              "Her istek, token ve tahsis simülasyonu izler.",
            )}
          </p>
        </div>
        <div className="world-meta">
          {t("Synthetic weight profile", "Sentetik ağırlık profili") +
            " · " +
            s.config.model.weightMiB / 1024 +
            " GiB"}
          <br />
          {t("Active", "Etkin")}{" "}
          <b>
            {live.length} / {s.config.maxActive}
          </b>
        </div>
      </div>
      <div className="pipeline">
        <div
          className={`chamber queue ${highlight === "queue" ? "lesson-highlight" : ""}`}
        >
          <h3>
            <span>01</span> {t("Request gate / queue", "İstek girişi / kuyruk")}{" "}
            <b>{waiting.length}</b>
          </h3>
          <div className="request-list">
            {waiting.map((r) => (
              <RequestChip
                key={r.id}
                r={r}
                selected={selected}
                onSelect={onSelect}
                t={t}
              />
            ))}
            {!waiting.length && (
              <div className="quiet-state">
                <span className="queue-lines" />
                {t("The queue is clear.", "Kuyruk boş.")}
                <small>
                  {pending.length
                    ? t(
                        `${pending.length} scheduled arrivals`,
                        `${pending.length} planlanmış geliş`,
                      )
                    : t(
                        "Send a prompt to begin.",
                        "Başlamak için bir istem gönder.",
                      )}
                </small>
              </div>
            )}
          </div>
          <p className="chamber-foot">
            {t("Arrival → waiting time", "Geliş → bekleme süresi")}
          </p>
        </div>
        <ArrowRight className="connector" />
        <div
          className={`chamber scheduler ${highlight === "scheduler" ? "lesson-highlight" : ""}`}
        >
          <h3>
            <span>02</span> {t("Scheduler", "Zamanlayıcı")}
          </h3>
          <span className="policy-label">
            {s.config.policy === "static"
              ? t("FIFO / static batch-like", "FIFO / sabit grup benzeri")
              : s.config.policy === "fair"
                ? t("Fairness-oriented", "Adalet odaklı")
                : t("Continuous-batching-like", "Sürekli gruplama benzeri")}
          </span>
          <div className="request-list">
            {live.map((r) => (
              <RequestChip
                key={r.id}
                r={r}
                selected={selected}
                onSelect={onSelect}
                t={t}
              />
            ))}
            {!live.length && (
              <div className="quiet-state">
                {t("No active batch", "Etkin grup yok")}
                <small>
                  {t(
                    "Slots open on admission.",
                    "Yerler kabul sırasında açılır.",
                  )}
                </small>
              </div>
            )}
          </div>
          <div className="slot-track">
            {Array.from({ length: s.config.maxActive }, (_, i) => (
              <span key={i} className={i < live.length ? "occupied" : ""} />
            ))}
          </div>
          <p className="chamber-foot">
            {s.config.policy === "static" && s.batch.length > live.length
              ? t(
                  `${s.batch.length - live.length} finished slot(s) held by cohort`,
                  `${s.batch.length - live.length} biten yer grup için tutuluyor`,
                )
              : t(
                  "Admission needs a slot + KV budget.",
                  "Kabul için yer + KV bütçesi gerekir.",
                )}
          </p>
        </div>
        <ArrowRight className="connector" />
        <div
          className={`chamber engine ${highlight === "engine" ? "lesson-highlight" : ""}`}
        >
          <h3>
            <span>03</span> {t("Model engine", "Model motoru")}
            <small>{r?.id ?? t("Selected request", "Seçili istek")}</small>
          </h3>
          <div className="engine-phases">
            <div
              className={`phase prefill ${state === "prefill" ? "phase-active" : ""}`}
            >
              <h4>
                <CornerDownRight />
                PREFILL
              </h4>
              <p>{t("Process the input sequence", "Giriş dizisini işle")}</p>
              <div className="token-cells" aria-hidden="true">
                {Array.from({ length: Math.min(tokens, 12) }, (_, i) => (
                  <span
                    key={i}
                    className={
                      r && r.prefilled / tokens > i / Math.min(tokens, 12)
                        ? "filled"
                        : ""
                    }
                  />
                ))}
              </div>
              <span className="mono">
                {num(r?.prefilled ?? 0)} / {num(tokens)}{" "}
                {t("prompt tokens", "istem tokenı")}
              </span>
              <progress
                max={tokens}
                value={r?.prefilled ?? 0}
                aria-label={t("Prefill progress", "Ön doldurma ilerlemesi")}
              />
            </div>
            <div
              className={`phase decode ${state === "decode" ? "phase-active" : ""}`}
            >
              <h4>
                <CornerDownRight />
                DECODE
              </h4>
              <p>
                {t(
                  "One generation step at a time",
                  "Her seferinde bir üretim adımı",
                )}
              </p>
              <div className="token-cells" aria-hidden="true">
                {Array.from(
                  { length: Math.min(r?.maxOutput ?? 16, 12) },
                  (_, i) => (
                    <span
                      key={i}
                      className={
                        r &&
                        r.generated / r.maxOutput >
                          i / Math.min(r.maxOutput, 12)
                          ? "filled"
                          : ""
                      }
                    />
                  ),
                )}
              </div>
              <span className="mono">
                {r?.generated ?? 0} / {r?.maxOutput ?? 16}{" "}
                {t("output tokens", "çıktı tokenı")}
              </span>
              <progress
                max={r?.maxOutput ?? 16}
                value={r?.generated ?? 0}
                aria-label={t("Generation progress", "Üretim ilerlemesi")}
              />
            </div>
          </div>
          <div
            className={`sampler ${state === "sampling" || state === "streaming" ? "lit" : ""}`}
          >
            <span>{t("Token scores", "Token skorları")}</span>
            <ArrowRight />
            <b>{t("Sampler", "Örnekleyici")}</b>
            <ArrowRight />
            <span>{t("Selected token", "Seçilen token")}</span>
          </div>
          <div className="stream">
            <div>
              <span>{t("Streaming output", "Çıktı akışı")}</span>
              <small>
                {r?.generated ?? 0} {t("delivered", "iletildi")}
              </small>
            </div>
            <p data-testid="token-stream">
              {r?.tokens.length ? (
                r.tokens.map((token, i) => (
                  <span
                    className="stream-token"
                    key={`${r.id}-${i}`}
                    title={`${r.tokenTimes[i]} ms`}
                  >
                    {token}{" "}
                  </span>
                ))
              ) : (
                <span className="stream-placeholder">
                  {t(
                    "The first token has not arrived.",
                    "İlk token henüz gelmedi.",
                  )}
                </span>
              )}
            </p>
            <small>
              {t(
                "Scripted educational token text; no language model is running.",
                "Eğitim için hazırlanmış token metni; bir dil modeli çalışmıyor.",
              )}
            </small>
          </div>
          <a
            className="compute-link"
            href={gpuHandoff(
              state === "prefill" ||
                (highlight === "engine" && (r?.generated ?? 0) === 0)
                ? "prefill"
                : "decode",
              locale,
              sourceExperiment,
              tokens,
              s.requests.length,
            )}
            target="_blank"
            rel="noreferrer"
          >
            {t("Explore GPU execution", "GPU yürütmesini keşfet")}
            <ExternalLink />
          </a>
        </div>
      </div>
      <div className="down-rail">
        <ArrowDown />
        <span>
          {t(
            "Prompt states are written; later decode steps extend the cache.",
            "İstem durumları yazılır; sonraki çözümleme adımları önbelleği büyütür.",
          )}
        </span>
        <ArrowDown />
      </div>
      <div
        className={`cache chamber ${highlight === "memory" ? "lesson-highlight" : ""}`}
      >
        <div className="cache-heading">
          <h3>
            <span>04</span> KV CACHE{" "}
            <small>{t("Finite shared memory", "Sonlu ortak bellek")}</small>
          </h3>
          <span className="mono" data-testid="kv-usage">
            {num(used)} / {num(cap)}{" "}
            {t("token slots written", "token yeri yazıldı")}
          </span>
        </div>
        <div
          className="cache-bar"
          role="img"
          aria-label={t(
            `KV cache: ${used} of ${cap} token slots written, ${held} reserved`,
            `KV önbellek: ${cap} token yerinin ${used} adedi yazıldı, ${held} ayrıldı`,
          )}
        >
          {live
            .filter((r) => r.kvTokens > 0)
            .map((r) => (
              <button
                key={r.id}
                style={{
                  width: `${(r.kvTokens / Math.max(cap, 1)) * 100}%`,
                  background: requestColor(r.id),
                }}
                onClick={() => onSelect(r.id)}
                aria-label={`${r.id} KV: ${r.kvTokens}`}
                title={`${r.id}: ${r.kvTokens}`}
              />
            ))}
          <span
            className="reserved-space"
            style={{
              width: `${(Math.max(0, held - used) / Math.max(cap, 1)) * 100}%`,
            }}
          />
        </div>
        <div className="cache-legend">
          {live.map((r) => (
            <button key={r.id} onClick={() => onSelect(r.id)}>
              <i style={{ background: requestColor(r.id) }} />
              {r.id}
              <span>{num(r.kvTokens)}</span>
            </button>
          ))}
          <span>
            {t("Written", "Yazılmış")}{" "}
            {num(used * s.config.model.kvMiBPerToken, 1)} MiB ·{" "}
            {t("Reserved", "Ayrılmış")} {num(held)} / {num(cap)}
          </span>
        </div>
        {r && active(r) && (
          <div className="selected-kv">
            <span>
              {r.id} · {t("written / reserved", "yazılan / ayrılan")}
            </span>
            <progress
              max={r.reservedTokens || 1}
              value={r.kvTokens}
              aria-label={`${r.id} KV progress`}
            />
            <span>
              {r.kvTokens} / {r.reservedTokens}
            </span>
          </div>
        )}
        <p className="cache-note">
          {waiting.some((r) => r.reason === "kv") ? (
            <strong className="warning">
              {t(
                "CAPACITY PRESSURE · New admissions are waiting for KV reservations to be released.",
                "KAPASİTE BASKISI · Yeni istekler KV rezervasyonlarının bırakılmasını bekliyor.",
              )}
            </strong>
          ) : (
            t(
              "Hatching = reserved but not written. Blocks are conceptual, not a physical memory layout.",
              "Tarama = ayrılmış ama yazılmamış. Bloklar kavramsaldır; fiziksel bellek düzeni değildir.",
            )
          )}
        </p>
      </div>
      {resourceView && (
        <div className="resource-strip">
          <span>
            {t("System state", "Sistem durumu")}{" "}
            <b>
              {s.requests.some((r) => r.reason === "queue")
                ? t("Overload: queue rejections", "Aşırı yük: kuyruk reddi")
                : waiting.some((r) => r.reason === "kv")
                  ? t("Memory-limited", "Bellekle sınırlı")
                  : waiting.length && live.length >= s.config.maxActive
                    ? t("Active slots saturated", "Etkin yerler doygun")
                    : t("Within admission capacity", "Kabul kapasitesi içinde")}
            </b>
          </span>
          <span>
            {t("Compute work this tick", "Bu adımdaki hesaplama")}{" "}
            <b>{num(s.compute * 100)}%</b>
          </span>
          <span>
            {t("Token work this tick", "Bu adımdaki token işi")}{" "}
            <b>
              {s.processedTokens}/{s.config.maxBatchTokens}
            </b>
          </span>
          <span>
            {t("Waiting", "Bekleyen")} <b>{waiting.length}</b>
          </span>
        </div>
      )}
      {r?.reason && (
        <p className="decision" role="status">
          <b>{r.id}</b> {t(...reasonName[r.reason])}
        </p>
      )}
      {done.length > 0 && (
        <details className="history">
          <summary>
            {t("Request history", "İstek geçmişi")} · {done.length}
          </summary>
          <div className="history-list">
            {done.map((r) => (
              <RequestChip
                key={r.id}
                r={r}
                selected={selected}
                onSelect={onSelect}
                t={t}
              />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
