# Plastic Intelligence — Implementation Plan

## Product and architecture

Build the approved PDF scope as a dashboard-first, vertically scrolling single-page web application. It is a self-contained fictional-data demonstration: no account system, backend, external map tiles, AI inference, satellite ingestion, operational forecast, or external notifications. The user's requested visual update is presentation-only: keep all data, persistence, mission workflows, selectors and server behavior unchanged. Serve static assets through a lightweight Node HTTP server on the project's configured port (expected 3000); no third-party runtime dependency is required. Use ES modules and a single canonical state object, with namespaced and versioned localStorage persistence, defensive parse/validation, recovery warning, and reset to seeds.

### Project structure

- `index.html` — semantic landmarks, sticky navigation, section anchors, accessible dialogs/forms, notification panel, live regions, route-manifest link.
- `styles.css` — original layout, controls, status/priority labels, responsive breakpoints and visible focus states.
- `styles-ocean.css` — reference-inspired deep-ocean glass theme, cyan lighting, animated atmospheric motion, dolphin hero layout and reduced-motion overrides.
- Managed Storage image URLs — full-page underwater backdrop and transparent hero dolphin; image media remains separate from the application data/store.
- `src/data.js` — fictional seed hotspots, teams, missions, verifications, history, notifications, and initial application metadata.
- `src/state.js` — persistence, validation/recovery/reset, stable ID creation, pure selectors and derived metrics, and atomic domain mutations/event logging.
- `src/app.js` — renderers and event delegation for dashboard, map/list/priority cards, detail tabs, mission workflows, analytics, history, notifications, nav state, and forms.
- `src/map.js` — accessible inline schematic regional map and synchronized hotspot markers; no real coordinates or geographic claims.
- `server.js` — small dependency-free static file server bound to `0.0.0.0` on the configured port.
- `public/manus-routes.json` — static declaration for the single `/` page.
- `app.config.ts` — project-root metadata with durable public logo URL when preparing a checkpoint.
- `plan.md`, `TODO.md` — approved implementation/design and outcome criteria.

## Design system

- **Design Movement:** cinematic oceanographic monitoring dashboard inspired by the user's underwater reference; retain the original evidence-first operational UX while shifting the visual atmosphere to illuminated deep water.
- **Core Principles:** preserve readable, trustworthy data; layer translucent glass rather than opaque panels; use luminous cyan to guide attention; honor accessibility and reduced-motion preferences.
- **Color Philosophy:** midnight navy and deep blue establish underwater depth; cyan/turquoise light rays create contrast and energy; priority and verification colors remain distinct, labeled, and legible on dark glass.
- **Layout Paradigm:** keep the existing dashboard navigation, KPI strip, hotspot map/list split, mission flows, analytics and history; place them over a full-bleed ocean scene with dark translucent surfaces.
- **Signature Elements:** cinematic underwater background with moving caustic light/particles; separate animated dolphin in the overview hero; glassmorphism cards edged with restrained cyan glow.
- **Interaction Philosophy:** preserve the existing synchronized selections, forms, tabs, filters, notifications, persistence and audit behavior; decorative motion never conveys data or replaces an explicit field action.
- **Animation:** slow ambient light and particle drift, a graceful floating/swimming dolphin motion, and short hover/focus transitions; disable decorative animation and smooth scrolling for `prefers-reduced-motion`.
- **Typography System:** DM Sans for body and Manrope for display headings when available, with system-ui/Segoe UI/Arial fallbacks; 32–40 px page title, 24–28 px sections, 14–16 px body, readable 12–13 px labels, 28–36 px metrics.
- **Brand Essence:** a field-operations dashboard that helps monitoring and cleanup coordinators move uncertain marine-debris candidates toward recorded action; **careful, vivid, grounded**.
- **Brand Voice:** precise, evidence-aware and action-oriented. Examples: “Review the signal. Verify it in the field.” “A confirmed observation is not a cleanup record.”
- **Wordmark & Logo:** preserve the wave-crest/circular-signal inline mark and add an illustrative, independently animated dolphin—not a generated text logo.
- **Signature Brand Color:** luminous ocean cyan `#32D8FF` over midnight navy `#041426`; semantic status colors remain accessible and do not imply stronger evidence.

## Product behavior

Seed 4–6 unmistakably fictional broad India-adjacent demo regions, 2–4 fictional teams, varied priority/verification/mission statuses, simulated waypoints and sample events. The UI must label the map as an illustrative regional view, all sample evidence/images as illustrative, and trajectories as simulated—not operational forecasts. Do not fabricate precise coordinates, impact, or recovered quantity.

Dashboard metrics and charts derive from canonical entities: completed missions are status `completed`; new/unassigned is `new` or `assigned` (labeled accordingly); analyzed imagery is a simulated seed count and never proof of plastic; awaiting verification is pending/no latest verification; latest outcome per hotspot represents current state while activity may count all verification records. Completion timing uses valid recorded timestamps only; recovered quantity stays grouped by unit.

Mission assignment validates required fictional team, mission type, priority, and action window; blocks a duplicate active mission for the same hotspot; adds a stable ID, event, and in-app notification. Verification supports confirmed, rejected, and inconclusive; the latest record drives the displayed status and each submission is retained in history. A verified finding never completes cleanup. Eligible missions expose a separate cleanup-result form with completed/unable-to-complete outcomes, timestamp, optional nonnegative quantity plus required unit, and notes. Final cleanup records can be changed only in an explicit correction flow requiring a reason; a correction appends an auditable history event and never erases its prior event. Recovered quantities display by compatible unit and are never added across unlike units. Each mutation updates all derived views, history, and notifications.

Navigation anchors, status/priority filters (combined with AND), clear-filter behavior, notification navigation/read state, keyboard-operable tabs, accessible dialogs with Escape and focus return, validation/success/error announcements, mobile stacking, and reset/recovery must work. Omit or visibly disable controls outside scope.

## Scope boundary

Browser-local single-user demo data is a convenience, not secure or shared storage. No genuine detections, operational forecast, AI capability, satellite data, external alerts, or scientific urgency/impact accounting is claimed. Publishing is not included in this implementation request.
