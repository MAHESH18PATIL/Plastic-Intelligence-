# Plastic Intelligence — Build Outcomes

## Dashboard, design, navigation, and map
- [x] The initial `/` route opens the dashboard overview with a visible simulated-demo notice, four data-derived metrics, and an Explore Hotspots action; there is no landing-page-only hero.
- [x] The sticky navigation contains working Dashboard, Hotspots, Missions, Analytics, and History anchors, updates the current-section state, respects sticky-header scroll offset, and remains keyboard accessible.
- [x] Use the PDF’s light ocean-blue design tokens, semantic headings/landmarks, clear text labels for all priority/status colors, visible keyboard focus, chart/map/drift text equivalents, and responsive desktop/tablet/mobile layouts without horizontal page overflow.
- [x] The hotspot map is a labeled illustrative schematic regional view with fictional sample points, no fabricated real debris coordinates, and accessible marker buttons. Selecting a map marker, list row, or priority card updates one shared selected hotspot and highlights each representation.
- [x] Seed 4–6 explicitly fictional hotspot records with broad India-adjacent region labels, varied high/medium/low priority and pending/confirmed/rejected/inconclusive verification, plus 2–4 fictional team names. Simulated data, image/evidence, and trajectory caveats remain visible at point of use.
- [x] Priority ordering is an explicitly illustrative attention ordering and considers more than confidence alone; cards communicate rationale, debris level, available confidence, simulated movement, action window, and verification state without claiming validated urgency or precision.

## Hotspot intelligence and filters
- [x] Selecting a hotspot presents ID/region, priority, debris estimate, available confidence, latest verification status, observation time, evidence, alternative explanations, and an illustrative caption; unavailable fields say “Not available in demo data”.
- [x] Overview, Drift Prediction, and Action Plan tabs change their matching content, preserve selection, expose accessible tab semantics, and work by keyboard. Drift waypoints are visibly labeled “Simulated trajectory—not an operational forecast”; action suggestions are demo recommendations, not dispatch.
- [x] Priority and status filters work together, a live result count shows “shown · total” so filtered and total sample counts are unambiguous, clearing filters restores the full set, and empty results explain there are no matches and offer clearing filters.

## Mission assignment and field verification
- [x] Assignment validates required fictional team, mission type, priority, and action window; accepts optional notes; defaults from the selected hotspot; prevents duplicate active missions for that hotspot and directs the user to its existing mission; creates a unique mission ID, timestamp, history event and notification; and updates mission counts/list with a confirmation.
- [x] Mission rows show mission ID, hotspot, team, status, priority, created time, action window/deadline, and completion details where applicable. Status-count chips and mission filters work; status and priority filters combine with AND logic; Clear filters restores all records.
- [x] Field verification requires linked hotspot, outcome (confirmed, rejected, or inconclusive), and verifier/team; optional mission and notes may be supplied. Each submission appends a verification record, updates the latest hotspot outcome and timestamp, appends history and notification, and refreshes all derived views.
- [x] Inconclusive verification remains unresolved and allows another record. Rejected does not mean cleaned. Confirmed debris does not mark a mission complete. Verification outcome and cleanup state remain separate.

## Cleanup, analytics, history, and notifications
- [x] An explicit Record cleanup result action is available only for eligible missions. Submission requires a completion timestamp and completed or unable-to-complete result; optional recovered quantity must be numeric and at least zero, and requires a unit. Cleanup is never automatic from verification. Submission updates mission state, event history, analytics, and notification and shows confirmation. Corrections use an explicit reason-required audited correction flow that appends history and retains prior events.
- [x] Analytics and dashboard metrics derive from the same canonical application state and update after every mutation. Charts have titles, units/legends, accessible text summaries, sample-size or missing-data caveats, and honest empty/zero states. Time averages use only valid paired timestamps; recovered quantities are grouped/displayed by compatible unit and unlike units are never combined. Do not invent impact or avoided emissions.
- [x] History contains only explicit seed/user events, is append-only in normal flows, displays newest first with timestamp and relevant hotspot/mission/team, and filters consistently by available date/region/priority/verification/mission status; clearing filters and empty state work.
- [x] In-app notifications are generated only from application events, show timestamps and relevant navigation, have an accessible control/count and empty state, and do not claim SMS/email/push/government alert delivery.

## Persistence, accessibility, and quality
- [x] Browser-local persistence uses a namespaced, versioned schema; loads and validates on startup; missing data initializes seeds; malformed/old data preserves a recoverable copy where practical, displays a warning, and continues with seeds; successful mutations persist a consistent snapshot; reset restores seeds and reports the local-storage state.
- [x] All enabled controls work; required fields show inline errors and a summary without discarding entered values; successful actions announce confirmation; browser-local synchronous mutations prevent a pending asynchronous save state; accessible forms/dialogs support Escape where appropriate, focus return, labels, fieldsets, and live regions.
- [x] Respect reduced-motion preference; touch devices do not require pointer effects; map/forms/charts remain interactive; mobile map/list stack, forms and dialogs fit narrow screens, and tap targets remain usable.
- [x] No unsupported claims of live AI, live satellite imagery, actual detection coordinates, operational forecasting, verified cleanup, environmental impact, or external alerts appear anywhere. Refresh restores persisted state; every visible enabled interaction is functional; project diagnostics, syntax checks, domain-selector tests, HTTP/route checks, and browser workflow checks complete without unresolved application errors.


## User-requested reference-inspired visual update
- [x] Restyle the full dashboard to match the provided reference: deep midnight-blue full-page underwater background, luminous cyan/teal surface lighting, readable dark-glass panels, and visible glow accents, while preserving every existing data label, status distinction, dashboard section, and responsive behavior.
- [x] Add a visible, accessibly described dolphin illustration in the overview, with a separate gentle swimming/floating animation and a clearly illustrative caption; keep motion decorative, honor `prefers-reduced-motion`, and avoid covering text or controls.
- [x] Add restrained, ongoing underwater light/particle motion to the background; disable nonessential movement for reduced-motion users and retain clear text contrast at desktop and mobile sizes.
- [x] Keep this a presentation-only change: do not modify seed data, application state, persistence, derived metrics, mission/verification/cleanup flows, or server/backend behavior.
