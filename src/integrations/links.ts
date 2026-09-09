import type { Locale } from "../components/i18n";
export const atlasLink = (concept: string, locale: Locale) =>
  `https://llm.aserdargun.com/${locale}/learn/concepts/${concept}`;
export const gexLink = (
  scene: "tensor" | "memory" | "kernel",
  locale: Locale,
) => `https://gex.aserdargun.com/gex/${scene}?lang=${locale}`;
export const relatedConcepts = [
  {
    en: "Scheduler & batching",
    tr: "Zamanlayıcı ve gruplama",
    slug: "batching",
  },
  { en: "KV memory", tr: "KV belleği", slug: "kv-cache" },
  {
    en: "Prefill & decode",
    tr: "Ön doldurma ve çözümleme",
    slug: "prefill-decode",
  },
  { en: "Gateway / API", tr: "Ağ geçidi / API", slug: "openai-compatible-api" },
];
