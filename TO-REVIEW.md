# To review

Open items deliberately deferred, with context. (See git history for the
July 2026 US calculator alignment that produced this list.)

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
