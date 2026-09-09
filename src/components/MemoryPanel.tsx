import type { Simulation } from "../core/types";
import { allocated, capacity, reserved } from "../core/simulation";
import type { T } from "./i18n";
import { num } from "./i18n";
export function MemoryPanel({ s, t }: { s: Simulation; t: T }) {
  const { model: m, hardware: h } = s.config;
  const used = allocated(s) * m.kvMiBPerToken;
  const held = reserved(s) * m.kvMiBPerToken;
  const kvBudget = capacity(s) * m.kvMiBPerToken;
  const fixed = m.weightMiB + h.runtimeMiB + h.safetyMiB;
  const sections = [
    {
      name: t("Model weights", "Model ağırlıkları"),
      value: m.weightMiB,
      cls: "weights",
    },
    {
      name: t("Runtime / workspace", "Çalışma alanı"),
      value: h.runtimeMiB,
      cls: "runtime",
    },
    {
      name: t("Safety reserve", "Güvenlik payı"),
      value: h.safetyMiB,
      cls: "safety",
    },
    { name: t("KV written", "KV yazıldı"), value: used, cls: "kv" },
    {
      name: t("KV reserved, unwritten", "KV ayrıldı, yazılmadı"),
      value: held - used,
      cls: "kv-reserve",
    },
  ];
  return (
    <section className="experiment-panel memory-panel">
      <div className="panel-heading">
        <div>
          <h2>
            {t(
              "Weights are not the whole memory story.",
              "Bellek yalnızca ağırlıklardan ibaret değildir.",
            )}
          </h2>
          <p>
            {t(
              "Conceptual accelerator budget · all sizes are synthetic",
              "Kavramsal hızlandırıcı bütçesi · tüm boyutlar sentetiktir",
            )}
          </p>
        </div>
        <b className="mono">{h.memoryMiB / 1024} GiB</b>
      </div>
      <div className="memory-budget">
        {sections.map((x) => (
          <span
            key={x.cls}
            className={x.cls}
            style={{
              width: `${(x.value / Math.max(h.memoryMiB, fixed + held)) * 100}%`,
            }}
            title={`${x.name}: ${num(x.value, 1)} MiB`}
          />
        ))}
      </div>
      <dl className="memory-breakdown">
        {sections.map((x) => (
          <div key={x.cls}>
            <dt>
              <i className={x.cls} />
              {x.name}
            </dt>
            <dd>{num(x.value, 1)} MiB</dd>
          </div>
        ))}
        <div>
          <dt>{t("Effective KV budget", "Etkin KV bütçesi")}</dt>
          <dd>{num(kvBudget)} MiB</dd>
        </div>
      </dl>
      <p>
        {t(
          "Effective KV capacity is the smaller of the configured cache limit and memory left after fixed allocations. Admission reserves prompt + maximum output; KV grows only as tokens are processed.",
          "Etkin KV kapasitesi, ayarlanan önbellek sınırı ile sabit tahsislerden kalan belleğin küçük olanıdır. Kabul, istem + azami çıktıyı ayırır; KV yalnızca tokenlar işlendikçe büyür.",
        )}
      </p>
      {fixed >= h.memoryMiB && (
        <p className="warning" role="status">
          {t(
            "MODEL / FIXED MEMORY DOES NOT FIT: no capacity remains for requests. Choose a smaller synthetic model or larger memory.",
            "MODEL / SABİT BELLEK SIĞMIYOR: isteklere yer kalmıyor. Daha küçük sentetik model veya büyük bellek seç.",
          )}
        </p>
      )}
      <details>
        <summary>
          {t("Why no real GPU numbers?", "Neden gerçek GPU sayıları yok?")}
        </summary>
        <p>
          {t(
            "KV uses 0.125 MiB per processed token in this model. Real footprints depend on layers, KV heads, head dimension, precision, allocator and attention architecture. The last emitted token has no KV state until processed. This budget is a teaching abstraction.",
            "Bu modelde KV, işlenen token başına 0,125 MiB kullanır. Gerçek boyutlar; katman, KV başlığı, başlık boyutu, hassasiyet, tahsisçi ve dikkat mimarisine bağlıdır. Son iletilen token işlenene kadar KV durumuna sahip değildir. Bu bütçe eğitimsel bir soyutlamadır.",
          )}
        </p>
      </details>
    </section>
  );
}
