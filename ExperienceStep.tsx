import { useCallback, useEffect, useState } from "react";
import {
  Check,
  CircleHelp,
  Gift,
  RotateCcw,
} from "lucide-react";
import { DEVICE_IMAGE, RECO_LOGO, REWARD_IMAGE } from "@/lib/optimized-assets";
import { AnimatedChecklist } from "@/components/AnimatedChecklist";
import { DevicePreview } from "@/components/DevicePreview";

const steps = ["Eligibility Check", "Verify Device", "Claim Reward"] as const;

export function ExperienceStep() {
  const [activeStep, setActiveStep] = useState(1);
  useEffect(() => {
    const pair = new Image();
    pair.decoding = "async";
    pair.fetchPriority = "low";
    pair.srcset = DEVICE_IMAGE.srcSet;
    pair.sizes = DEVICE_IMAGE.sizes;
    pair.src = DEVICE_IMAGE.src;
    const logo = new Image();
    logo.decoding = "async";
    logo.fetchPriority = "low";
    logo.src = RECO_LOGO.src;
  }, []);

  const advanceToDevice = useCallback(() => {
    setActiveStep(2);
    window.setTimeout(() => {
      document.getElementById("experience")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  return (
    <section className="experience-step" id="experience" aria-label="Verification steps">
      <div className="experience-step-halo" aria-hidden="true" />

      <ol className="experience-progress" aria-label="Progress">
        {steps.map((label, index) => {
          const number = index + 1;
          const isComplete = number < activeStep;
          return (
            <li className={`experience-progress-step ${number === activeStep ? "is-active" : ""} ${isComplete ? "is-complete" : ""}`} key={label} aria-current={number === activeStep ? "step" : undefined}>
              <span className="progress-marker">{isComplete ? <Check size={14} aria-hidden="true" /> : number}</span>
              <span className="progress-label">{label}</span>
            </li>
          );
        })}
      </ol>

      <div className={`experience-step-card ${activeStep === 2 ? "is-device-reference" : ""}`} aria-live="polite" aria-atomic="true">
        {activeStep === 1 && (
          <div className="sample-content">
            <div className="sample-heading">
              <span className="sample-icon"><CircleHelp size={19} aria-hidden="true" /></span>
              <div>
                <h2 id="eligibility-title">Eligibility Check</h2>
              </div>
            </div>
            <AnimatedChecklist onComplete={advanceToDevice} />
          </div>
        )}

        {activeStep === 2 && (
          <DevicePreview onContinue={() => setActiveStep(3)} />
        )}

        {activeStep === 3 && (
          <div className="sample-content reward-sample">
            <span className="device-sample-icon reward-sample-icon"><Gift size={30} aria-hidden="true" /></span>
            <h2 id="reward-title">Claim Reward</h2>
            <img className="experience-reward-image" src={REWARD_IMAGE.src} srcSet={REWARD_IMAGE.srcSet} sizes="260px" decoding="async" alt="Apple Cash $750 gift card artwork" width={REWARD_IMAGE.width} height={REWARD_IMAGE.height} />
          </div>
        )}
      </div>

      {activeStep === 3 && (
        <div className="experience-actions restart-actions">
          <button className="step-next-button" onClick={() => setActiveStep(1)}>
            <RotateCcw size={14} aria-hidden="true" /> Start over
          </button>
        </div>
      )}
    </section>
  );
}