import { ExternalLink } from "lucide-react";
import { atlasLink, relatedConcepts } from "../integrations/links";
import type { T, Locale } from "./i18n";
export function ContextPanel({ t, locale }: { t: T; locale: Locale }) {
  return (
    <section className="context-panel">
      <details>
        <summary>
          {t("Where am I in the stack?", "Yığının neresindeyim?")}
        </summary>
        <p>
          {t(
            "TFL connects request scheduling in Model Servers & Serving Frameworks (SRV) to execution and KV state in Inference Engines & Runtimes (INF). These are distinct Atlas categories, not a universal implementation boundary.",
            "TFL, Model Sunucuları ve Servis Çerçeveleri (SRV) içindeki istek zamanlamasını Çıkarım Motorları ve Çalışma Zamanları (INF) içindeki yürütme ve KV durumuna bağlar. Bunlar ayrı Atlas kategorileridir; evrensel uygulama sınırları değildir.",
          )}
        </p>
        <div className="stack-rail">
          <span>{t("Client application", "İstemci uygulaması")}</span>
          <span>GTW · {t("Gateway / API", "Ağ geçidi / API")}</span>
          <strong>SRV · {t("Model server", "Model sunucusu")}</strong>
          <strong>
            INF · {t("Inference runtime", "Çıkarım çalışma zamanı")}
          </strong>
          <span>GEX · {t("Hardware execution", "Donanım yürütmesi")}</span>
        </div>
        <p>
          {t(
            "Atlas also covers RUN (local runners), APP (desktop workbenches), DST (distributed platforms), and EDG (edge runtimes). These are categories with overlapping implementations, not seven serial pipeline stages.",
            "Atlas ayrıca RUN (yerel çalıştırıcılar), APP (masaüstü çalışma alanları), DST (dağıtık platformlar) ve EDG (uç çalışma zamanları) kategorilerini içerir. Bunlar örtüşebilen uygulama kategorileridir; sıralı yedi işlem aşaması değildir.",
          )}
        </p>
      </details>
      <div className="source-links">
        <a
          href="https://huggingface.co/docs/transformers/cache_explanation"
          target="_blank"
          rel="noreferrer"
        >
          Hugging Face · Caching <ExternalLink />
        </a>
        <a
          href="https://docs.vllm.ai/en/v0.22.1/usage/metrics/"
          target="_blank"
          rel="noreferrer"
        >
          vLLM · Metrics definitions <ExternalLink />
        </a>
        <span>
          {t(
            "SIMULATED: event times and model state. CALCULATED: metrics derived from those events. MEASURED: no dataset connected. Follow primary documentation for architecture-specific claims.",
            "SİMÜLE: olay zamanları ve model durumu. HESAPLANMIŞ: bu olaylardan türetilen ölçütler. ÖLÇÜLMÜŞ: bağlı veri kümesi yok. Mimariye özgü iddialar için birincil belgeleri izle.",
          )}
        </span>
      </div>
      <div className="related-links">
        {relatedConcepts.map((c) => (
          <a
            key={c.slug}
            href={atlasLink(c.slug, locale)}
            target="_blank"
            rel="noreferrer"
          >
            {t(c.en, c.tr)}
            <ExternalLink />
          </a>
        ))}
      </div>
    </section>
  );
}
