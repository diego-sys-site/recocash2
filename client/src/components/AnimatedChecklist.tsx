import { useEffect, useState } from "react";
import { Check, LoaderCircle, MapPin, MonitorSmartphone, RotateCcw, Wifi } from "lucide-react";

const sampleRows = [
  { label: "Location", Icon: MapPin },
  { label: "Connection", Icon: Wifi },
  { label: "Device", Icon: MonitorSmartphone },
] as const;

export function AnimatedChecklist({ onComplete }: { onComplete?: () => void }) {
  const [completedCount, setCompletedCount] = useState(0);
  const [replayId, setReplayId] = useState(0);
  const finished = completedCount === sampleRows.length;

  useEffect(() => {
    if (finished) {
      if (!onComplete) return;
      const advanceTimer = window.setTimeout(onComplete, 650);
      return () => window.clearTimeout(advanceTimer);
    }
    const timer = window.setTimeout(() => {
      setCompletedCount((count) => Math.min(count + 1, sampleRows.length));
    }, 850);
    return () => window.clearTimeout(timer);
  }, [completedCount, finished, replayId, onComplete]);

  function replay() {
    setCompletedCount(0);
    setReplayId((id) => id + 1);
  }

  return (
    <div className="animated-checklist">
      <div className="sample-list" aria-label="Animated illustrative checklist">
        {sampleRows.map(({ label, Icon }, index) => {
          const state = index < completedCount ? "complete" : index === completedCount ? "running" : "waiting";
          const stateLabel = state === "complete" ? "animation complete" : state === "running" ? "animating" : "waiting";
          return (
            <div className={`sample-row checklist-row is-${state}`} key={label} data-check-state={state}>
              <span className="sample-row-icon"><Icon size={17} aria-hidden="true" /></span>
              <span className="checklist-row-label">{label}</span>
              <span className={`checklist-checkbox is-${state}`} role="img" aria-label={`${label}: ${stateLabel}`}>
                {state === "complete" ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : state === "running" ? <LoaderCircle size={17} className="loading-icon" aria-hidden="true" /> : null}
              </span>
            </div>
          );
        })}
      </div>
      <div className="checklist-footer">
        <p className="checklist-status" role="status" aria-live="polite" aria-atomic="true">
          {finished ? "Sample animation complete" : `Animating sample ${completedCount + 1} of ${sampleRows.length}…`}
        </p>
        <button className="checklist-replay" onClick={replay} aria-label="Replay the sample checklist animation">
          <RotateCcw size={12} aria-hidden="true" /> Replay
        </button>
      </div>
    </div>
  );
}
