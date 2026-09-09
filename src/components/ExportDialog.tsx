import { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";
import type { T } from "./i18n";
export function ExportDialog({
  data,
  onClose,
  t,
}: {
  data: string;
  onClose: () => void;
  t: T;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [url, setUrl] = useState("");
  useEffect(() => {
    const href = URL.createObjectURL(
      new Blob([data], { type: "application/json" }),
    );
    setUrl(href);
    dialog.current?.showModal();
    return () => URL.revokeObjectURL(href);
  }, [data]);
  return (
    <dialog ref={dialog} onClose={onClose} aria-labelledby="export-title">
      <div className="export-heading">
        <h2 id="export-title">
          {t("Export simulated events", "Simüle olayları dışa aktar")}
        </h2>
        <button
          autoFocus
          onClick={() => dialog.current?.close()}
          aria-label={t("Close export", "Dışa aktarmayı kapat")}
        >
          <X />
        </button>
      </div>
      <p>
        {t(
          "A snapshot of this educational scenario, including its prompts, configuration and timestamps. Save the file or select and copy the JSON below.",
          "Bu eğitim senaryosunun istemleri, ayarları ve zaman damgalarını içeren anlık görüntüsü. Dosyayı kaydet veya aşağıdaki JSON’u seçip kopyala.",
        )}
      </p>
      <textarea
        aria-label={t("Simulation JSON", "Simülasyon JSON")}
        readOnly
        value={data}
        spellCheck={false}
      />
      <a
        className="download-link"
        href={url || undefined}
        download="tfl-simulation.json"
      >
        <Download />
        {t("Save JSON", "JSON kaydet")}
      </a>
      <small>
        {t(
          "SIMULATED · no measured trace data",
          "SİMÜLE · ölçülmüş iz verisi yok",
        )}
      </small>
    </dialog>
  );
}
