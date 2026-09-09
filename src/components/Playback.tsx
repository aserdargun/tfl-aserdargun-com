import { Play, Pause, StepForward, RotateCcw } from "lucide-react";
import type { T } from "./i18n";
export function Playback({
  playing,
  disabled,
  time,
  speed,
  onPlay,
  onStep,
  onReset,
  onSpeed,
  t,
}: {
  playing: boolean;
  disabled: boolean;
  time: number;
  speed: number;
  onPlay: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeed: (v: number) => void;
  t: T;
}) {
  return (
    <div className="playback">
      <span className="control-title">
        {t("Simulation control", "Simülasyon kontrolü")}
      </span>
      <button className="primary" onClick={onPlay} disabled={disabled}>
        {playing ? <Pause /> : <Play />}
        {playing ? t("Pause", "Duraklat") : t("Play", "Oynat")}
      </button>
      <button onClick={onStep} disabled={disabled}>
        <StepForward />
        {t("Step", "Adım")}
      </button>
      <button onClick={onReset}>
        <RotateCcw />
        {t("Reset", "Sıfırla")}
      </button>
      <label className="speed">
        {t("Speed", "Hız")}
        <select
          value={speed}
          onChange={(e) => onSpeed(+e.target.value)}
          aria-label={t("Playback speed", "Oynatma hızı")}
        >
          {[0.25, 0.5, 1, 2, 4].map((v) => (
            <option key={v} value={v}>
              {v}×
            </option>
          ))}
        </select>
      </label>
      <span className="clock">
        {t("Simulation time", "Simülasyon zamanı")}{" "}
        <b data-testid="clock">{(time / 1000).toFixed(3)} s</b>
      </span>
    </div>
  );
}
