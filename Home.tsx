import { lazy, Suspense, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { BrandHeader, OfferBadges, RewardCard, TrustRow } from "@/components/ReferenceElements";
import { TrackingPreferences } from "@/components/TrackingPreferences";
import { REWARD_IMAGE } from "@/lib/optimized-assets";

const loadExperience = () => import("@/components/ExperienceStep");
const loadTerms = () => import("@/components/DemoTerms");
const loadDraft = () => import("@/components/PromotionalTerms");
const ExperienceStep = lazy(() => loadExperience().then((module) => ({ default: module.ExperienceStep })));
const DemoTerms = lazy(() => loadTerms().then((module) => ({ default: module.DemoTerms })));
const PromotionalTerms = lazy(() => loadDraft().then((module) => ({ default: module.PromotionalTerms })));
const warmExperience = () => { void loadExperience().catch(() => {}); };
const warmTerms = () => { void loadTerms().catch(() => {}); };
const warmDraft = () => { void loadDraft().catch(() => {}); };

export default function Home() {
  const [experienceStarted, setExperienceStarted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [promotionalTermsOpen, setPromotionalTermsOpen] = useState(false);

  useEffect(() => {
    if (!experienceStarted) return;
    const timer = window.setTimeout(() => {
      document.getElementById("experience")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [experienceStarted]);

  return (
    <div className="cash-shell">
      <BrandHeader />
      <main>
        <section className="reward-hero" aria-labelledby="reward-heading">
          <div className="hero-halo" aria-hidden="true" />
          <div className="hero-copy">
            <OfferBadges />
            <h1 id="reward-heading">Claim Your <span>$750</span><br />Apple Cash</h1>
            <p className="hero-description">Complete a quick device verification to receive your reward directly to your Apple Wallet.</p>
          </div>
          <RewardCard src={REWARD_IMAGE.src} />
          <div className="claim-area">
            <button id="claim-button" className="claim-button" onClick={() => setExperienceStarted(true)} onPointerEnter={warmExperience} onFocus={warmExperience} onTouchStart={warmExperience}>Get My Apple Cash</button>
          </div>
          <a className="details-chevron" href="#details" aria-label="View details and terms"><ChevronDown size={18} aria-hidden="true" /></a>
        </section>
        {experienceStarted && (
          <Suspense fallback={<section id="experience" className="experience-loading" aria-busy="true"><p role="status">Preparing the checklist…</p></section>}>
            <ExperienceStep />
          </Suspense>
        )}
        <TrustRow />
      </main>
      <footer className="cash-footer" id="details">
        <p>Read the <button id="terms-button" className="terms-link" onClick={() => setTermsOpen(true)} onPointerEnter={warmTerms} onFocus={warmTerms} onTouchStart={warmTerms}>Terms &amp; Conditions</button>.</p>
        <p className="promotional-terms-footer-link"><button id="promotional-terms-button" className="terms-link" onClick={() => setPromotionalTermsOpen(true)} onPointerEnter={warmDraft} onFocus={warmDraft} onTouchStart={warmDraft}>Promotional Terms</button></p>
        <TrackingPreferences />
      </footer>
      {termsOpen && <Suspense fallback={<p className="legal-loading" role="status">Loading terms…</p>}><DemoTerms open={termsOpen} onOpenChange={setTermsOpen} /></Suspense>}
      {promotionalTermsOpen && <Suspense fallback={<p className="legal-loading" role="status">Loading terms…</p>}><PromotionalTerms open={promotionalTermsOpen} onOpenChange={setPromotionalTermsOpen} /></Suspense>}
    </div>
  );
}