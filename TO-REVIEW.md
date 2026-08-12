# To review

Open items deliberately deferred, with context. (See git history for the
July 2026 US calculator alignment that produced this list.)

## kiosk-app's `embed-uki` build mode is now orphaned source

The UKI web embed was ported (Aug 2026) from the kiosk-app's
`--mode embed-uki` build into the self-contained
`kiosk-embed-uki/roi-calculator.html`, which is now what deploys. The
kiosk-app still contains the full UKI market code (`engine.uki.js`,
`vendors.uki.js`, `presets.uki.js`, the UKI branches in App/steps/results,
and the `build:embed:uki` / `build:wp:uki` scripts), verified numerically
and textually identical to the single file at port time — but nothing
deploys from it any more, so edits there no longer reach the live UKI
embed (and vice versa). Deliberately deferred: removing the UKI market
code from kiosk-app (touches shared files; the US/AU builds' byte-for-byte
guarantees would need re-verification) vs keeping it as a reference. Until
that decision, treat `kiosk-embed-uki/roi-calculator.html` as canonical
for the UKI embed and say so in any commit that touches either side.

Deliberate deviations of the single file from the old embed-uki build
(all cosmetic/packaging; the engine is verbatim): page title says "EPR"
(was "EHR", shared entry file), RLDatix favicon added, known-spend nudge
label "±£100k" (was "±$100k"), "Analysing"/"realisation" UK spellings
(were "Analyzing"/"realization" in shared copy), admin stats overlay in
£/en-GB with UKI org-type labels (was $/US labels), jsPDF loaded from CDN
on demand (was bundled).

## US calculators: remaining structural divergences (kiosk-app vs web/us)

The July 2026 alignment reconciled the calculation engines of the US kiosk
app (`kiosk-app/`, touchscreen + embed) and the US long web calculator
(`web/us/roi-calculator.html`): denial attribution (0.30, HFMA), provider
complexity boost in capacity savings, VBP penalty weighting, readmission
methodology (Medicare base, $15,200, graduated credit), e-discovery in
quality savings, true 5-year ramp (20/40/60/80/100%), IDN duplicate rate
(30%), FTE hours basis (2,080). Verified numerically identical across six
matched scenarios.

Deliberately NOT aligned (deferred):

1. **Facility portfolio lists and profiles differ.** The kiosk offers
   ASC / physician practices / urgent care / imaging / dialysis / SNF /
   home health / behavioral / rehab / LTACH; the web offers a different
   set (incl. freestanding ED, IRF, infusion; excl. behavioral, rehab,
   LTACH) with its own per-type system/staff/cost profiles. The kiosk
   also credits portfolio system decommissioning inside decomSave; the
   web counts portfolio systems/costs in the estate but not in
   decommission savings.
2. **"I know my spend" handling differs.** Kiosk rescales decomSave
   proportionally (knownSpend / estimatedEstate); the web allocates the
   known spend across tiers by 5:2:1 weights. Same intent, different
   math; results diverge when the user supplies a known spend.
3. **Scenario features**: the web exposes Conservative/Expected/Stretch
   plus a blend slider; the kiosk always runs Expected. Not a numeric
   disparity for default use, but the surfaces make different claims
   about ranges.
