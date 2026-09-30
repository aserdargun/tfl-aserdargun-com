import { useState } from "react";

import rawConcepts from "../ils/concepts.json";

type ConceptRecord = { id: string; label: { en: string; tr: string }; body: { en: string; tr: string } };
export const concepts: readonly ConceptRecord[] = rawConcepts as readonly ConceptRecord[];

/**
 * Kavram yüzeyi.
 *
 * Kavramlar daha önce yalnız `lab.manifest.json` içinde kimlik olarak duruyordu;
 * burada her biri tek cümlelik bir tanım taşır. Tanımlar kavramı açıklar,
 * ölçüm veya doğrulanmış sonuç iddiası içermez.
 */
export function ConceptPanel({ locale }: { locale: "tr" | "en" }) {
  const [open, setOpen] = useState<ConceptRecord["id"] | null>(null);
  const tr = locale === "tr";
  const records = concepts;

  return (
    <section className="concept-panel" id="concepts" aria-labelledby="concepts-title">
      <h2 id="concepts-title">
        {tr ? "Bu laboratuvarın kavramları" : "The concepts in this lab"}
      </h2>
      <p className="concept-panel__intro">
        {tr
          ? "Kavramlar tek cümleyle tanımlanır. Tanım, ölçüm veya doğrulanmış bir sonuç değildir; buradaki her sayı benzetim kapsamındadır."
          : "Each concept is defined in one sentence. A definition is not a measurement or a verified result; every number here stays inside the simulation."}
      </p>
      <dl className="concept-list">
        {records.map((concept) => {
          const body = concept.body;
          const expanded = open === concept.id;
          return (
            <div key={concept.id} className="concept-row" data-open={expanded ? "true" : "false"}>
              <dt>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : concept.id)}
                >
                  <b>{concept.label[locale]}</b>
                  <code>{concept.id.replace("concept:", "")}</code>
                </button>
              </dt>
              <dd>{expanded && body ? body[locale] : null}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
