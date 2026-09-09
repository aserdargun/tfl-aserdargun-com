import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { lessons } from "../lessons/lessons";
import { tokenize } from "../core/simulation";
import type { Simulation } from "../core/types";
import { atlasLink } from "../integrations/links";
import type { T, Locale } from "./i18n";
export function LessonPanel({
  s,
  index,
  onIndex,
  onCheckpoint,
  t,
  locale,
}: {
  s: Simulation;
  index: number;
  onIndex: (n: number) => void;
  onCheckpoint: () => void;
  t: T;
  locale: Locale;
}) {
  const lesson = lessons[index];
  const r = s.requests[0];
  return (
    <section className="lesson-panel">
      <div className="lesson-top">
        <h2>
          Token Flow 101{" "}
          <span>
            {t(
              "Learn the system, one step at a time.",
              "Sistemi adım adım öğren.",
            )}
          </span>
        </h2>
        <div>
          <button
            aria-label={t("Previous chapter", "Önceki bölüm")}
            disabled={index === 0}
            onClick={() => onIndex(index - 1)}
          >
            <ArrowLeft />
          </button>
          <span className="mono">
            {String(index + 1).padStart(2, "0")} / 10
          </span>
          <button
            aria-label={t("Next chapter", "Sonraki bölüm")}
            disabled={index === 9}
            onClick={() => onIndex(index + 1)}
          >
            <ArrowRight />
          </button>
        </div>
      </div>
      <div className="lesson-body">
        <span className="chapter-number">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div>
          <h3>{t(...lesson.title)}</h3>
          <p>{t(...lesson.body)}</p>
          {index === 1 && (
            <div className="tokenization">
              {tokenize(r?.prompt ?? "What is a world model?")
                .slice(0, 20)
                .map((word, i) => (
                  <span key={i}>
                    {word}
                    <small>ID {i + 1}</small>
                  </span>
                ))}
              <p>
                {t(
                  "Illustrative local IDs, not vocabulary IDs from a real model. Scenario prompt lengths may be synthetic.",
                  "Örnek yerel kimliklerdir; gerçek model sözlüğünün kimlikleri değildir. Senaryo istem uzunlukları sentetik olabilir.",
                )}
              </p>
            </div>
          )}
        </div>
        <div className="lesson-actions">
          <button onClick={onCheckpoint} className="primary">
            {t("Show this moment", "Bu anı göster")}
            <ArrowRight />
          </button>
          <span className={lesson.ready(s) ? "mint" : ""}>
            {lesson.ready(s)
              ? t("Checkpoint reached", "Kontrol noktasına ulaşıldı")
              : t(
                  "Replays this lesson from the start",
                  "Dersi baştan oynatarak bu ana gelir",
                )}
          </span>
          <a
            href={atlasLink(lesson.concept, locale)}
            target="_blank"
            rel="noreferrer"
          >
            {t("Learn the concept in Atlas", "Kavramı Atlas’ta öğren")}
            <ExternalLink />
          </a>
        </div>
      </div>
      <div className="chapter-nav">
        {lessons.map((l, i) => (
          <button
            key={i}
            aria-label={`${String(i + 1).padStart(2, "0")} ${t(...l.title)}`}
            onClick={() => onIndex(i)}
            aria-pressed={index === i}
          >
            {String(i + 1).padStart(2, "0")} <span>{t(...l.title)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
