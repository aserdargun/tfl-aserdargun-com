import { ExternalLink } from "lucide-react";
import {
  atlasLink,
  portfolioLink,
  relatedConcepts,
} from "../integrations/links";
import type { T, Locale } from "./i18n";
export function ContextPanel({ t, locale }: { t: T; locale: Locale }) {
  return (
    <section className="context-panel">
      <details>
        <summary>
          {t(
            "TFL in the AI Learning System",
            "Yapay Zekâ Öğrenme Sistemi içinde TFL",
          )}
        </summary>
        <p>
          {t(
            "TFL is the hands-on serving laboratory of LLM Runtime & Serving Atlas in the Foundation layer of aserdargun.com. Learn the concepts in LLM Atlas, follow requests here, then inspect a related GPU teaching scene in GEX. GEX remains a companion of GPU Kernel Atlas.",
            "TFL, aserdargun.com’un Temel katmanında LLM Runtime & Serving Atlas’ın uygulamalı sunum laboratuvarıdır. Kavramları LLM Atlas’ta öğren, istekleri burada izle, ardından ilgili GPU eğitim sahnesini GEX’te incele. GEX, GPU Kernel Atlas’ın tamamlayıcı uygulamasıdır.",
          )}
        </p>
        <p>
          {t(
            "DCL can pass a bounded serving workload; ARL can pass a request context class. TFL starts a new paused simulation from that educational metadata. Prompts, agent authority, hardware measurements and exact execution state are not transferred. Returning opens the source experiment, not its previous runtime state.",
            "DCL sınırlı bir sunum iş yükü, ARL ise istek bağlamı sınıfı aktarabilir. TFL bu eğitim verileriyle duraklatılmış yeni bir simülasyon başlatır. İstemler, ajan yetkileri, donanım ölçümleri ve kesin yürütme durumu aktarılmaz. Geri dönüş, kaynak deneyi açar; önceki çalışma durumunu geri yüklemez.",
          )}
        </p>
        <nav
          className="related-links"
          aria-label={t("Portfolio learning paths", "Portföy öğrenme yolları")}
        >
          <a href={portfolioLink(locale)} target="_blank" rel="noreferrer">
            {t("Explore all applications", "Tüm uygulamaları keşfet")}{" "}
            <ExternalLink />
          </a>
          <a
            href={`https://dcl.aserdargun.com/?lang=${locale}`}
            target="_blank"
            rel="noreferrer"
          >
            DCL · {t("Deployment choices", "Dağıtım tercihleri")}{" "}
            <ExternalLink />
          </a>
          <a
            href={`https://arl.aserdargun.com/?lang=${locale}`}
            target="_blank"
            rel="noreferrer"
          >
            ARL · {t("Agent requests", "Ajan istekleri")} <ExternalLink />
          </a>
        </nav>
      </details>
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
          <span>GEX · {t("GPU execution model", "GPU yürütme modeli")}</span>
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
          Hugging Face · {t("How caching works", "Önbellek nasıl çalışır")}{" "}
          <ExternalLink />
        </a>
        <a
          href="https://docs.vllm.ai/en/v0.22.1/usage/metrics/"
          target="_blank"
          rel="noreferrer"
        >
          vLLM 0.22.1 · {t("Metrics definitions", "Ölçüt tanımları")}{" "}
          <ExternalLink />
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
