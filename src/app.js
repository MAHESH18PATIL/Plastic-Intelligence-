import {
  TEAM_OPTIONS, activeMissionForHotspot, appendEvent, createId, latestVerification, loadState,
  missionTypeLabel, priorityLabel, saveState, selectAverageIntervals, selectCompletionsByMonth,
  selectMetrics, selectOutcomeCounts, selectPriorityCounts, selectRecoveryByUnit, selectRecurringRegions,
  sortedHotspots, statusLabel, verificationStatus
} from "./state.js";
import { renderMap } from "./map.js";
import { createSeedState } from "./data.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const titleCase = value => String(value || "").replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
const shortId = value => String(value || "").split("-").at(-1) || "—";
const validDate = value => Number.isFinite(Date.parse(value));

function formatDate(value, options = { dateStyle: "medium" }) {
  if (!value || !validDate(value)) return "Not available in demo data";
  return new Intl.DateTimeFormat("en-IN", options).format(new Date(value));
}
function formatDateTime(value) {
  if (!value || !validDate(value)) return "Not available in demo data";
  return `${formatDate(value, { dateStyle: "medium", timeStyle: "short" })} · demo time`;
}
function monthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en", { month: "short", year: "2-digit" }).format(new Date(year, month - 1, 1));
}
function statusBadge(status) {
  return `<span class="badge status-badge ${escapeHtml(status)}">${escapeHtml(statusLabel(status))}</span>`;
}
function priorityBadge(priority) {
  return `<span class="badge priority-badge ${escapeHtml(priority)}">${escapeHtml(priorityLabel(priority))} priority</span>`;
}
function missionStatusBadge(status) {
  return `<span class="badge mission-badge ${escapeHtml(status)}">${escapeHtml(statusLabel(status))}</span>`;
}
function formatDuration(hours) {
  if (!Number.isFinite(hours)) return "Not available";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${hours.toFixed(1)} hr`;
  return `${(hours / 24).toFixed(1)} days`;
}

const loaded = loadState();
let state = loaded.state;
let storageIsUsable = loaded.persisted;
let storageNotice = loaded.warning;
let selectedHotspotId = state.hotspots.find(item => !item.archived)?.id || null;
let activeTab = "overview";
let cleanupCorrectionMode = false;
let toastTimer;
const hotspotFilters = { priority: "all", status: "all" };
const missionFilters = { status: "all", priority: "all" };
const historyFilters = { period: "all", region: "all", priority: "all", verification: "all", missionStatus: "all" };

function announce(message, isError = false) {
  const toast = $("#appMessage");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle("is-error", isError);
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 4800);
}

function renderStorageNotice() {
  const node = $("#storageWarning");
  if (!node) return;
  if (!storageIsUsable && !storageNotice) storageNotice = "Browser storage is unavailable. Changes will last only for this session; this demo is not secure or shared storage.";
  node.hidden = !storageNotice && storageIsUsable;
  node.textContent = storageNotice || "";
}

function persist() {
  storageIsUsable = saveState(state);
  if (storageIsUsable) storageNotice = "";
  else storageNotice = "Could not save to browser storage. Changes remain in this session only; this is not secure or shared storage.";
  renderStorageNotice();
  return storageIsUsable;
}

function renderDashboard() {
  const metrics = selectMetrics(state);
  const cards = [
    { label: "Missions completed", value: metrics.completed, helper: "All demo history · explicit cleanup result", icon: "✓" },
    { label: "New / assigned", value: metrics.newAssigned, helper: "New or assigned · field work not started", icon: "↗" },
    { label: "Images analyzed", value: metrics.analyzed, helper: "Simulated sample count · candidates are not confirmation", icon: "◉" },
    { label: "Awaiting verification", value: metrics.awaitingVerification, helper: "Pending or inconclusive latest field outcome", icon: "⌕" }
  ];
  $("#metricGrid").innerHTML = cards.map(item => `<article class="metric-card"><div class="metric-head"><span class="metric-label">${escapeHtml(item.label)}</span><span class="metric-icon" aria-hidden="true">${item.icon}</span></div><p class="metric-value">${item.value}</p><p class="metric-helper">${escapeHtml(item.helper)}</p></article>`).join("");
  $("#hotspotCount").textContent = `${state.hotspots.filter(item => !item.archived).length} sample records`;
  const saved = state.lastSavedAt ? formatDate(state.lastSavedAt, { timeStyle: "short" }) : "DEMO SNAPSHOT";
  $("#lastUpdated").textContent = state.lastSavedAt ? `LOCAL SAVE ${saved}` : "DEMO SNAPSHOT";
  const unread = state.notifications.filter(item => !item.read).length;
  $("#notificationCount").textContent = unread > 9 ? "9+" : String(unread);
  $("#notificationToggle").setAttribute("aria-label", `Open notifications, ${unread} unread`);
}

function filteredHotspots() {
  return sortedHotspots(state).filter(hotspot => {
    const status = verificationStatus(state, hotspot);
    return (hotspotFilters.priority === "all" || hotspot.priority === hotspotFilters.priority) &&
      (hotspotFilters.status === "all" || status === hotspotFilters.status);
  });
}

function renderHotspotList() {
  const items = filteredHotspots();
  const total = state.hotspots.filter(item => !item.archived).length;
  $("#hotspotResultCount").textContent = `${items.length} shown · ${total} total`;
  const node = $("#hotspotList");
  if (!items.length) {
    node.innerHTML = `<div class="empty-state"><strong>No hotspots match these filters.</strong>Try a different priority or verification state.<br><button class="button button-quiet button-small" type="button" data-action="clear-hotspot-filters">Clear filters</button></div>`;
    return;
  }
  node.innerHTML = items.map(hotspot => `<button id="hotspot-row-${escapeHtml(hotspot.id)}" class="hotspot-row" type="button" data-action="select-hotspot" data-hotspot-id="${escapeHtml(hotspot.id)}" aria-pressed="${hotspot.id === selectedHotspotId}">
    <span class="hotspot-code">${escapeHtml(shortId(hotspot.id))}</span>
    <span class="hotspot-main"><strong>${escapeHtml(hotspot.regionLabel)}</strong><small>${escapeHtml(hotspot.debrisLevel)} · ${escapeHtml(hotspot.movementSummary)}</small></span>
    <span class="hotspot-meta">${priorityBadge(hotspot.priority)}${statusBadge(verificationStatus(state, hotspot))}</span>
  </button>`).join("");
}

function renderPriorityCards() {
  const node = $("#priorityCards");
  const items = sortedHotspots(state);
  if (!items.length) {
    node.innerHTML = `<div class="empty-state"><strong>No active demo hotspots.</strong>Reset the demo data to restore the fictional sample records.</div>`;
    return;
  }
  node.innerHTML = items.map(hotspot => `<article class="priority-card ${hotspot.id === selectedHotspotId ? "is-selected" : ""}">
    <div class="priority-topline"><span class="hotspot-code">${escapeHtml(shortId(hotspot.id))}</span><span class="priority-loc"><strong>${escapeHtml(hotspot.regionLabel)}</strong><small>Observed ${escapeHtml(formatDate(hotspot.observedAt))} · demo time</small></span>${priorityBadge(hotspot.priority)}</div>
    <p>${escapeHtml(hotspot.rationale)}</p>
    <div class="priority-facts"><div class="priority-fact"><small>Estimated debris</small><strong>${escapeHtml(hotspot.debrisLevel)}</strong></div><div class="priority-fact"><small>Confidence · simulated</small><strong>${Number.isFinite(hotspot.confidence) ? `${Math.round(hotspot.confidence * 100)}%` : "Not available"}</strong></div><div class="priority-fact"><small>Movement</small><strong>${escapeHtml(hotspot.movementSummary)}</strong></div><div class="priority-fact"><small>Action window</small><strong>${escapeHtml(hotspot.actionWindow)}</strong></div></div>
    <div class="priority-foot">${statusBadge(verificationStatus(state, hotspot))}<button id="details-${escapeHtml(hotspot.id)}" class="button button-secondary button-small" type="button" data-action="view-details" data-hotspot-id="${escapeHtml(hotspot.id)}" aria-pressed="${hotspot.id === selectedHotspotId}">View details</button></div>
  </article>`).join("");
}

function illustrationSvg() {
  return `<svg viewBox="0 0 190 112" role="img" aria-label="Abstract illustrative ocean sample graphic, not satellite imagery"><circle cx="95" cy="56" r="39" fill="#c8ebf8"/><path d="M22 74c20-22 35-22 54 0s36 22 55 0 24-16 37-8" fill="none" stroke="#40aecd" stroke-width="3" stroke-linecap="round"/><path d="M34 42c16-12 26-11 40 2s23 15 40 1 27-13 40-3" fill="none" stroke="#8bd5e8" stroke-width="2" stroke-linecap="round"/><circle cx="103" cy="48" r="5" fill="#168bbd"/><circle cx="103" cy="48" r="12" fill="none" stroke="#168bbd" stroke-opacity=".35" stroke-width="2"/><path d="M53 92h85" stroke="#8bb8cc" stroke-width="1.5" stroke-linecap="round"/></svg>`;
}

function overviewPanel(hotspot) {
  const latest = latestVerification(state, hotspot.id);
  const alternatives = hotspot.alternativeExplanations?.length ? hotspot.alternativeExplanations : ["Not available in demo data"];
  return `<div class="overview-grid">
    <article class="evidence-card"><span class="evidence-note-label">SIMULATED CANDIDATE OBSERVATION · ${escapeHtml(formatDateTime(hotspot.observedAt))}</span><h4>What the sample shows</h4><p>${escapeHtml(hotspot.evidenceNotes || "Not available in demo data")}</p><p><strong>Latest field record:</strong> ${statusBadge(verificationStatus(state, hotspot))} ${latest ? `· ${escapeHtml(formatDateTime(latest.timestamp))} · ${escapeHtml(latest.verifier)}` : "· No field verification record yet"}</p><span class="evidence-note-label">ALTERNATIVE EXPLANATIONS TO CONSIDER</span><div class="alt-explanations">${alternatives.map(item => `<span class="alt-chip">${escapeHtml(item)}</span>`).join("")}</div></article>
    <article class="illustration-card"><div class="illustration-art">${illustrationSvg()}</div><h4>Illustrative observation graphic</h4><p class="caption">${escapeHtml(hotspot.imageLabel || "Illustrative—not satellite imagery")} · no real image or verified position is attached.</p></article>
  </div>
  <div class="detail-bottom"><article class="rationale-card"><span class="evidence-note-label">WHY THIS DEMO PRIORITY</span><div class="action-rationale"><span class="rationale-marker" aria-hidden="true">↗</span><p class="rationale-copy">${escapeHtml(hotspot.rationale || "No rationale available in demo data.")}</p></div></article><article class="rationale-card"><span class="evidence-note-label">SUGGESTED NEXT STEP · DEMO ONLY</span><div class="action-rationale"><span class="rationale-marker" aria-hidden="true">◎</span><p class="rationale-copy"><strong>${escapeHtml(hotspot.suggestedAction || "Review candidate")}</strong><br>${escapeHtml(hotspot.resourceNote || "Resource availability not available in demo data.")}</p></div></article></div>`;
}

function driftPanel(hotspot) {
  const waypoints = Array.isArray(hotspot.waypoints) ? hotspot.waypoints : [];
  const pointString = waypoints.map((point, index) => `${35 + Number(point.x) * 7.25},${18 + Number(point.y) * 1.4}`).join(" ");
  const points = waypoints.map((point, index) => {
    const x = 35 + Number(point.x) * 7.25;
    const y = 18 + Number(point.y) * 1.4;
    return `<circle cx="${x}" cy="${y}" r="5" fill="${index === 0 ? "#168bbd" : "#fff"}" stroke="#168bbd" stroke-width="2"/><text x="${x}" y="${Math.max(13, y - 10)}" text-anchor="middle">${escapeHtml(point.time)}</text>`;
  }).join("");
  return `<p class="simulation-banner">Simulated trajectory—not an operational forecast. The path, timing, and uncertainty are illustrative scenarios only.</p><div class="drift-layout"><figure class="drift-chart"><svg viewBox="0 0 650 190" role="img" aria-label="Illustrative drift scenario with ${waypoints.length} labeled time waypoints"><path d="M10 40h630M10 95h630M10 150h630" stroke="#dcebf2" stroke-dasharray="3 5" fill="none"/><polyline points="${escapeHtml(pointString)}" fill="none" stroke="#36a8d2" stroke-width="3" stroke-linecap="round" stroke-dasharray="7 6"/>${points}<text x="18" y="180">Fictional sample scenario · not to scale</text></svg></figure><div class="waypoint-list" aria-label="Trajectory waypoint descriptions">${waypoints.map(point => `<div class="waypoint"><time>${escapeHtml(point.time)}</time><div><strong>${escapeHtml(point.label)}</strong><small>Illustrative waypoint · uncertainty not validated</small></div></div>`).join("") || `<div class="empty-state">No simulated waypoints are available for this record.</div>`}</div></div>`;
}

function actionPanel(hotspot) {
  const status = verificationStatus(state, hotspot);
  const action = status === "pending" || status === "inconclusive" ? "Field verification suggested" : status === "confirmed" ? "Review the separate cleanup record" : "Retain the rejection; no cleanup inferred";
  return `<p class="simulation-banner">Recommendations and urgency windows in this dashboard are illustrative—not validated thresholds, automatic dispatch, or an operational commitment.</p><div class="action-plan-grid"><div class="plan-factor"><small>Suggested action</small><strong>${escapeHtml(hotspot.suggestedAction || "Review")}</strong></div><div class="plan-factor"><small>Demo action window</small><strong>${escapeHtml(hotspot.actionWindow || "Not available in demo data")}</strong></div><div class="plan-factor"><small>Field decision</small><strong>${escapeHtml(action)}</strong></div></div><div class="plan-cta"><p><strong>Resource note:</strong> ${escapeHtml(hotspot.resourceNote || "Not available in demo data")}<br><span>Candidate detection is not confirmation; confirmation is not cleanup.</span></p><button class="button button-primary" type="button" data-action="assign-mission" data-hotspot-id="${escapeHtml(hotspot.id)}">Assign cleanup mission</button></div>`;
}

function renderDetails() {
  const node = $("#detailPanel");
  const hotspot = state.hotspots.find(item => item.id === selectedHotspotId && !item.archived);
  if (!hotspot) {
    node.innerHTML = `<div class="detail-empty"><span class="detail-empty-mark" aria-hidden="true">⌖</span><div><h3>Choose a candidate to inspect its detail</h3><p>Select a map marker, hotspot row, or priority card. All three views use the same demo record.</p></div></div>`;
    return;
  }
  const status = verificationStatus(state, hotspot);
  const activeMission = activeMissionForHotspot(state, hotspot.id);
  node.innerHTML = `<div class="detail-content"><div class="detail-summary"><div class="detail-title-wrap"><div class="detail-title-line"><h3>${escapeHtml(hotspot.id)}</h3>${priorityBadge(hotspot.priority)}${statusBadge(status)}</div><p class="detail-location">${escapeHtml(hotspot.regionLabel)} · observed ${escapeHtml(formatDateTime(hotspot.observedAt))}</p></div><div class="detail-kv"><small>Estimated debris level</small><strong>${escapeHtml(hotspot.debrisLevel || "Not available in demo data")}</strong></div><div class="detail-kv"><small>Confidence · simulated</small><strong>${Number.isFinite(hotspot.confidence) ? `${Math.round(hotspot.confidence * 100)}% · not a priority score` : "Not available in demo data"}</strong></div><div class="detail-actions"><button id="verify-hotspot-${escapeHtml(hotspot.id)}" class="button button-secondary" type="button" data-action="verify-hotspot" data-hotspot-id="${escapeHtml(hotspot.id)}">Record field verification</button>${activeMission ? `<span class="soft-tag">Active mission ${escapeHtml(activeMission.id)}</span>` : `<button id="assign-hotspot-${escapeHtml(hotspot.id)}" class="button button-primary" type="button" data-action="assign-mission" data-hotspot-id="${escapeHtml(hotspot.id)}">Assign cleanup mission</button>`}</div></div>
    <div class="tab-list" role="tablist" aria-label="Hotspot intelligence sections"><button id="tab-overview" type="button" role="tab" aria-selected="${activeTab === "overview"}" aria-controls="panel-overview" tabindex="${activeTab === "overview" ? 0 : -1}" data-action="set-tab" data-tab="overview">Overview</button><button id="tab-drift" type="button" role="tab" aria-selected="${activeTab === "drift"}" aria-controls="panel-drift" tabindex="${activeTab === "drift" ? 0 : -1}" data-action="set-tab" data-tab="drift">Drift prediction</button><button id="tab-action" type="button" role="tab" aria-selected="${activeTab === "action"}" aria-controls="panel-action" tabindex="${activeTab === "action" ? 0 : -1}" data-action="set-tab" data-tab="action">Action plan</button></div>
    <div id="panel-overview" class="tab-panel" role="tabpanel" aria-labelledby="tab-overview" ${activeTab !== "overview" ? "hidden" : ""}>${overviewPanel(hotspot)}</div><div id="panel-drift" class="tab-panel" role="tabpanel" aria-labelledby="tab-drift" ${activeTab !== "drift" ? "hidden" : ""}>${driftPanel(hotspot)}</div><div id="panel-action" class="tab-panel" role="tabpanel" aria-labelledby="tab-action" ${activeTab !== "action" ? "hidden" : ""}>${actionPanel(hotspot)}</div></div>`;
}

function visibleMissions() {
  return [...state.missions].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).filter(mission =>
    (missionFilters.status === "all" || mission.status === missionFilters.status) &&
    (missionFilters.priority === "all" || mission.priority === missionFilters.priority));
}

function renderMissionStats() {
  const statuses = [
    { key: "all", label: "All missions", count: state.missions.length },
    { key: "new", label: "New", count: state.missions.filter(item => item.status === "new").length },
    { key: "assigned", label: "Assigned", count: state.missions.filter(item => item.status === "assigned").length },
    { key: "in_progress", label: "In progress", count: state.missions.filter(item => item.status === "in_progress").length },
    { key: "awaiting_verification", label: "Awaiting verification", count: state.missions.filter(item => item.status === "awaiting_verification").length },
    { key: "completed", label: "Completed", count: state.missions.filter(item => item.status === "completed").length }
  ];
  $("#missionStats").innerHTML = statuses.map(item => `<button id="mission-chip-${item.key}" class="mission-stat" type="button" data-action="mission-status-chip" data-status="${item.key}" aria-pressed="${missionFilters.status === item.key}"><small>${escapeHtml(item.label)}</small><strong>${item.count}</strong></button>`).join("");
}

function renderMissionList() {
  const missions = visibleMissions();
  $("#missionResultCount").textContent = `${missions.length} shown · ${state.missions.length} total`;
  const node = $("#missionList");
  if (!missions.length) {
    node.innerHTML = `<div class="empty-state"><strong>${state.missions.length ? "No missions match these filters." : "No missions yet."}</strong>${state.missions.length ? "Clear filters to see all demo missions." : "Choose a hotspot and assign a fictional demo team."}<br><button class="button button-quiet button-small" type="button" data-action="clear-mission-filters">${state.missions.length ? "Clear filters" : "Explore hotspots"}</button></div>`;
    return;
  }
  node.innerHTML = missions.map(mission => {
    const hotspot = state.hotspots.find(item => item.id === mission.hotspotId);
    const eligible = ["assigned", "in_progress", "awaiting_verification"].includes(mission.status);
    const canVerify = ["assigned", "in_progress", "awaiting_verification"].includes(mission.status);
    const finalState = ["completed", "unable_to_complete"].includes(mission.status);
    const cleanupDetails = finalState ? `${mission.status === "completed" ? "Cleanup recorded" : "Unable to complete recorded"} ${escapeHtml(formatDateTime(mission.cleanupRecordedAt || mission.completedAt))}${mission.recoveredQuantity !== undefined ? ` · ${escapeHtml(mission.recoveredQuantity)} ${escapeHtml(mission.recoveredUnit)}` : ""}` : "";
    return `<article id="mission-row-${escapeHtml(mission.id)}" class="mission-row" tabindex="-1"><div class="mission-title"><span class="hotspot-code">${escapeHtml(shortId(mission.id))}</span><span><strong class="mission-id">${escapeHtml(mission.id)}</strong><small class="mission-sub">${escapeHtml(hotspot?.id || mission.hotspotId)} · ${escapeHtml(hotspot?.regionLabel || "Not available in demo data")}</small></span></div><div class="mission-details"><strong>${escapeHtml(mission.teamName || "Not available in demo data")} · ${escapeHtml(missionTypeLabel(mission.missionType))}</strong><small>Created ${escapeHtml(formatDateTime(mission.createdAt))} · ${escapeHtml(mission.actionWindow || "No action window")}</small>${mission.deadline ? `<small>Target date: ${escapeHtml(formatDate(mission.deadline))}</small>` : ""}</div><div class="mission-details"><div>${missionStatusBadge(mission.status)} ${priorityBadge(mission.priority)}</div>${cleanupDetails ? `<small>${cleanupDetails}</small>` : ""}${hotspot ? `<small>Verification: ${escapeHtml(statusLabel(verificationStatus(state, hotspot)))}</small>` : ""}</div><div class="mission-actions">${["new", "assigned"].includes(mission.status) ? `<button id="start-mission-${escapeHtml(mission.id)}" class="button button-quiet" type="button" data-action="start-mission" data-mission-id="${escapeHtml(mission.id)}">Start mission</button>` : ""}${canVerify ? `<button id="verify-mission-${escapeHtml(mission.id)}" class="button button-secondary" type="button" data-action="verify-mission" data-mission-id="${escapeHtml(mission.id)}">Verify</button>` : ""}${eligible ? `<button id="cleanup-mission-${escapeHtml(mission.id)}" class="button button-primary button-small" type="button" data-action="cleanup-mission" data-mission-id="${escapeHtml(mission.id)}">Record cleanup result</button>` : ""}${finalState ? `<button id="correct-cleanup-${escapeHtml(mission.id)}" class="button button-quiet button-small" type="button" data-action="correct-cleanup" data-mission-id="${escapeHtml(mission.id)}">Correct recorded result</button>` : ""}</div></article>`;
  }).join("");
}

function makeBarChart(title, subtitle, values, labels, summary, totalLabel = "") {
  const list = values.map(item => ({ label: labels[item.key] || item.key, value: Number(item.count ?? item.value ?? item.quantity) || 0 }));
  if (!list.length) return `<article class="chart-card"><div class="chart-heading"><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(subtitle)}</p></div></div><div class="empty-state">No recorded demo data for this chart yet.</div></article>`;
  const max = Math.max(...list.map(item => item.value), 1);
  const total = list.reduce((sum, item) => sum + item.value, 0);
  const totalText = totalLabel || `${total} ${total === 1 ? "record" : "records"}`;
  return `<article class="chart-card"><div class="chart-heading"><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(subtitle)}</p></div><span class="chart-total">${escapeHtml(totalText)}</span></div><div class="bar-chart" role="img" aria-label="${escapeHtml(title)}: ${list.map(item => `${item.label}, ${item.value}`).join("; ")}">${list.map(item => `<div class="bar-row"><span class="bar-label">${escapeHtml(item.label)}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.max(item.value ? 4 : 0, item.value / max * 100)}%"></span></span><span class="bar-value">${item.value}</span></div>`).join("")}</div><p class="chart-summary">${escapeHtml(summary || `Sample values shown: ${list.map(item => `${item.label} ${item.value}`).join(", ")}.`)}</p></article>`;
}

function renderAnalytics() {
  const counts = selectOutcomeCounts(state);
  const intervals = selectAverageIntervals(state);
  const recovery = selectRecoveryByUnit(state);
  const recurrences = selectRecurringRegions(state);
  const durationSummary = [
    { label: "Avg. time to verification", value: intervals.verificationHours === null ? "Not available" : formatDuration(intervals.verificationHours), note: `${intervals.verificationSample} valid paired sample${intervals.verificationSample === 1 ? "" : "s"}` },
    { label: "Avg. time to cleanup", value: intervals.cleanupHours === null ? "Not available" : formatDuration(intervals.cleanupHours), note: `${intervals.cleanupSample} completed sample${intervals.cleanupSample === 1 ? "" : "s"}` },
    { label: "Latest verified outcomes", value: state.hotspots.filter(item => ["confirmed", "rejected", "inconclusive"].includes(verificationStatus(state, item))).length, note: "One latest outcome per hotspot" },
    { label: "Reported material", value: recovery.length ? recovery.map(item => `${item.quantity} ${item.unit}`).join(" · ") : "None reported", note: "Explicit demo entries; grouped by unit" }
  ];
  $("#analyticsSummary").innerHTML = durationSummary.map(item => `<article class="analytics-mini"><small>${escapeHtml(item.label)}</small><strong>${escapeHtml(item.value)}</strong><span>${escapeHtml(item.note)}</span></article>`).join("");
  const outcomes = Object.entries(counts).map(([key, count]) => ({ key, count }));
  const priorities = Object.entries(selectPriorityCounts(state)).map(([key, count]) => ({ key, count }));
  const months = selectCompletionsByMonth(state).map(item => ({ key: monthLabel(item.key), count: item.count }));
  const recoveryRows = recovery.map(item => ({ key: item.unit, quantity: item.quantity }));
  const regionRows = recurrences.map(item => ({ key: item.region, count: item.count }));
  const outcomeLabels = { confirmed: "Confirmed · latest", rejected: "Rejected · latest", inconclusive: "Inconclusive · latest", pending: "Pending · latest" };
  const priorityLabels = { high: "High", medium: "Medium", low: "Low" };
  const charts = [
    makeBarChart("Completed missions by month", "Counted by explicit cleanup completion timestamp", months, {}, months.length ? "Only missions explicitly marked completed are included; values are demo records." : "No cleanup completions have been explicitly recorded."),
    makeBarChart("Latest verification outcome", "Current state · one latest outcome per hotspot", outcomes, outcomeLabels, `${state.hotspots.length} fictional hotspots in this sample; verification does not imply cleanup.`),
    makeBarChart("Priority distribution", "Illustrative demo attention categories", priorities, priorityLabels, "Priority labels are fictional examples, not validated scientific urgency thresholds."),
    makeBarChart("Reported recovered material", "Explicit quantities grouped by compatible unit", recoveryRows, {}, recovery.length ? "Only explicitly entered quantities on completed demo missions are counted; unlike units are never combined." : "No recovered material quantities have been explicitly reported.", recovery.map(item => `${item.quantity} ${item.unit}`).join(" · ")),
    makeBarChart("Repeated sample detections by region", "Grouped by fictional demo region label", regionRows, {}, "Repeated sample detections are seed records, not a learned prediction or a real hotspot recurrence.")
  ];
  $("#analyticsCharts").innerHTML = charts.join("");
}

function historyEventMatches(event) {
  const hotspot = state.hotspots.find(item => item.id === event.hotspotId);
  const mission = state.missions.find(item => item.id === event.missionId);
  if (historyFilters.period !== "all") {
    const days = Number(historyFilters.period);
    const threshold = Date.now() - days * 86400000;
    if (!validDate(event.timestamp) || Date.parse(event.timestamp) < threshold) return false;
  }
  if (historyFilters.region !== "all" && hotspot?.regionLabel !== historyFilters.region) return false;
  if (historyFilters.priority !== "all" && hotspot?.priority !== historyFilters.priority) return false;
  if (historyFilters.verification !== "all" && (!hotspot || verificationStatus(state, hotspot) !== historyFilters.verification)) return false;
  if (historyFilters.missionStatus !== "all" && mission?.status !== historyFilters.missionStatus) return false;
  return true;
}

function eventIcon(type) {
  return ({ candidate_observed: "⌖", mission_assigned: "↗", mission_started: "▶", verification_submitted: "✓", cleanup_submitted: "♧", cleanup_corrected: "↺", reset: "↺", mission_status_changed: "↻" })[type] || "·";
}

function renderHistory() {
  const regionSelect = $("#historyRegion");
  const currentRegion = historyFilters.region;
  const regions = [...new Set(state.hotspots.map(item => item.regionLabel))].sort();
  regionSelect.innerHTML = `<option value="all">All regions</option>${regions.map(region => `<option value="${escapeHtml(region)}">${escapeHtml(region)}</option>`).join("")}`;
  regionSelect.value = regions.includes(currentRegion) ? currentRegion : "all";
  const events = [...state.events].filter(historyEventMatches).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const node = $("#historyFeed");
  if (!events.length) {
    node.innerHTML = `<div class="empty-state"><strong>No history in this period.</strong>Clear filters to see available sample and browser-local events.<br><button class="button button-quiet button-small" type="button" data-action="clear-history-filters">Clear filters</button></div>`;
    return;
  }
  node.innerHTML = events.map(event => {
    const hotspot = state.hotspots.find(item => item.id === event.hotspotId);
    const mission = state.missions.find(item => item.id === event.missionId);
    const references = [hotspot?.id, hotspot?.regionLabel, mission?.id, mission ? statusLabel(mission.status) : "", event.actor].filter(Boolean).join(" · ");
    return `<article class="history-item"><span class="history-icon" aria-hidden="true">${eventIcon(event.eventType)}</span><div class="history-copy"><strong>${escapeHtml(event.description)}</strong><p>${escapeHtml(references || "Application event")} · ${escapeHtml(titleCase(event.eventType))}</p></div><time class="history-time" datetime="${escapeHtml(event.timestamp)}">${escapeHtml(formatDateTime(event.timestamp))}</time></article>`;
  }).join("");
}

function renderNotifications() {
  const notifications = [...state.notifications].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const node = $("#notificationList");
  if (!notifications.length) {
    node.innerHTML = `<div class="empty-state"><strong>No new notifications.</strong>Application events appear here; this demo does not send external alerts.</div>`;
    return;
  }
  node.innerHTML = notifications.map(item => `<article class="notification-item ${item.read ? "" : "unread"}"><span class="notification-mark" aria-hidden="true">${eventIcon(state.events.find(event => event.id === item.eventId)?.eventType)}</span><div class="notification-copy"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.description)}</p><time datetime="${escapeHtml(item.timestamp)}">${escapeHtml(formatDateTime(item.timestamp))}</time><button class="notification-link" type="button" data-action="open-notification" data-notification-id="${escapeHtml(item.id)}">${item.missionId ? `View mission ${escapeHtml(item.missionId)}` : `View hotspot ${escapeHtml(item.hotspotId)}`} →</button></div></article>`).join("");
}

function renderAll(options = {}) {
  const activeId = document.activeElement?.id;
  renderDashboard();
  renderMap(state, selectedHotspotId);
  renderHotspotList();
  renderPriorityCards();
  renderDetails();
  renderMissionStats();
  renderMissionList();
  renderAnalytics();
  renderHistory();
  renderNotifications();
  renderStorageNotice();
  syncFilterControls();
  if (options.preserveFocus && activeId) document.getElementById(activeId)?.focus({ preventScroll: true });
}

function syncFilterControls() {
  $("#hotspotPriorityFilter").value = hotspotFilters.priority;
  $("#hotspotStatusFilter").value = hotspotFilters.status;
  $("#missionStatusFilter").value = missionFilters.status;
  $("#missionPriorityFilter").value = missionFilters.priority;
  $("#historyPeriod").value = historyFilters.period;
  $("#historyPriority").value = historyFilters.priority;
  $("#historyVerification").value = historyFilters.verification;
  $("#historyMissionStatus").value = historyFilters.missionStatus;
}

function openDialog(dialogId, trigger) {
  const dialog = document.getElementById(dialogId);
  if (!dialog) return;
  if (trigger instanceof HTMLElement) dialog.dataset.returnFocus = trigger.id || "";
  if (!dialog.open) dialog.showModal();
  setTimeout(() => dialog.querySelector("input:not([type=hidden]),select,button:not([data-action=close-dialog])")?.focus(), 0);
}

function closeDialog(dialog) {
  if (!dialog?.open) return;
  const returnId = dialog.dataset.returnFocus;
  dialog.close();
  if (returnId) setTimeout(() => document.getElementById(returnId)?.focus({ preventScroll: true }), 0);
}

function closeMutationDialog(dialogId) {
  const dialog = document.getElementById(dialogId);
  const returnId = dialog?.dataset.returnFocus;
  dialog?.close();
  renderAll();
  if (returnId) setTimeout(() => {
    const target = document.getElementById(returnId) || document.getElementById(`mission-row-${returnId.replace(/^(cleanup-mission|correct-cleanup|verify-mission)-/, "")}`) || document.getElementById("missions-title");
    target?.focus({ preventScroll: true });
  }, 0);
}

function setSelectOptions(select, options, firstLabel, selectedValue = "") {
  if (!select) return;
  select.innerHTML = `<option value="">${escapeHtml(firstLabel)}</option>${options.map(item => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join("")}`;
  select.value = options.some(item => item.value === selectedValue) ? selectedValue : "";
}

function openMissionForm(hotspotId, trigger) {
  const hotspot = state.hotspots.find(item => item.id === hotspotId);
  if (!hotspot) { announce("That hotspot is not available in this demo.", true); return; }
  const active = activeMissionForHotspot(state, hotspot.id);
  if (active) {
    announce(`${active.id} is already active for this hotspot. Open the existing mission instead of creating a duplicate.`);
    document.querySelector("#missions").scrollIntoView({ behavior: "smooth", block: "start" });
    const row = [...$$(".mission-row")].find(item => item.textContent.includes(active.id));
    row?.querySelector("button")?.focus({ preventScroll: true });
    return;
  }
  $("#missionHotspotId").value = hotspot.id;
  $("#missionHotspotLabel").textContent = `${hotspot.id} · ${hotspot.regionLabel} · ${priorityLabel(hotspot.priority)} priority`;
  $("#missionTeam").innerHTML = `<option value="">Choose a fictional team</option>${TEAM_OPTIONS.map(team => `<option value="${escapeHtml(team.id)}">${escapeHtml(team.name)}</option>`).join("")}`;
  $("#missionPriority").value = hotspot.priority;
  $("#missionActionWindow").value = hotspot.actionWindow;
  $("#missionDeadline").value = "";
  $("#missionNotes").value = "";
  $("#missionError").textContent = "";
  $("#missionForm").dataset.triggerId = trigger?.id || "";
  openDialog("missionDialog", trigger);
}

function openVerificationForm(hotspotId, missionId, trigger) {
  const hotspot = state.hotspots.find(item => item.id === hotspotId);
  if (!hotspot) { announce("Choose an available hotspot before recording verification.", true); return; }
  const hotOptions = sortedHotspots(state).map(item => ({ value: item.id, label: `${item.id} · ${item.regionLabel}` }));
  setSelectOptions($("#verifyHotspot"), hotOptions, "Choose a hotspot", hotspot.id);
  const related = state.missions.filter(item => item.hotspotId === hotspot.id && !["completed", "unable_to_complete"].includes(item.status));
  setSelectOptions($("#verifyMission"), related.map(item => ({ value: item.id, label: `${item.id} · ${statusLabel(item.status)}` })), "No mission linked", missionId || "");
  $$("#verificationForm input[type=radio]").forEach(input => { input.checked = false; });
  $("#verifierName").value = missionId ? state.missions.find(item => item.id === missionId)?.teamName || "" : "";
  $("#verificationNotes").value = "";
  $("#verificationError").textContent = "";
  openDialog("verificationDialog", trigger);
}

function openCleanupForm(missionId, trigger, correcting = false) {
  const mission = state.missions.find(item => item.id === missionId);
  const eligible = mission && ["assigned", "in_progress", "awaiting_verification"].includes(mission.status);
  const canCorrect = mission && ["completed", "unable_to_complete"].includes(mission.status);
  if (!mission || (correcting ? !canCorrect : !eligible)) {
    announce(correcting ? "Only a previously recorded cleanup result can be corrected." : "Cleanup result is available only for an assigned or active mission.", true);
    return;
  }
  cleanupCorrectionMode = correcting;
  const hotspot = state.hotspots.find(item => item.id === mission.hotspotId);
  $("#cleanupDialogTitle").textContent = correcting ? "Correct cleanup result" : "Record cleanup result";
  $("#cleanupMissionId").value = mission.id;
  $("#cleanupMissionLabel").textContent = `${mission.id} · ${hotspot?.id || mission.hotspotId} · ${mission.teamName}`;
  $("#cleanupTimestamp").value = currentLocalDateTime();
  $("#cleanupResult").value = correcting ? mission.cleanupResult || mission.status : "completed";
  $("#recoveredQuantity").value = correcting && mission.recoveredQuantity !== undefined ? mission.recoveredQuantity : "";
  $("#recoveredUnit").value = correcting ? mission.recoveredUnit || "" : "";
  $("#cleanupNotes").value = correcting ? mission.cleanupNotes || "" : "";
  $("#cleanupCorrectionFields").hidden = !correcting;
  $("#cleanupCorrectionReason").required = correcting;
  $("#cleanupCorrectionReason").value = "";
  $("#cleanupConfirm").nextElementSibling.textContent = correcting ? "I have reviewed this correction and confirm that the new result is accurate for this demo record." : "I have reviewed this report and confirm that this is the recorded field outcome.";
  $("#cleanupForm button[type=submit]").textContent = correcting ? "Save audited correction" : "Save cleanup result";
  $("#cleanupConfirm").checked = false;
  $("#cleanupError").textContent = "";
  openDialog("cleanupDialog", trigger);
}

function currentLocalDateTime() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function submitMission(form) {
  const formData = new FormData(form);
  const hotspotId = String(formData.get("hotspotId") || "");
  const teamId = String(formData.get("teamId") || "");
  const team = TEAM_OPTIONS.find(item => item.id === teamId);
  const hotspot = state.hotspots.find(item => item.id === hotspotId);
  if (!form.reportValidity() || !hotspot || !team) {
    $("#missionError").textContent = !hotspot ? "Select a valid hotspot." : !team ? "Choose one of the fictional demo teams." : "Complete the required fields to assign a mission.";
    return;
  }
  const duplicate = activeMissionForHotspot(state, hotspotId);
  if (duplicate) {
    $("#missionError").textContent = `${duplicate.id} is already active for this hotspot. Duplicate active missions are blocked.`;
    return;
  }
  const mission = {
    id: createId("PI-M"), hotspotId, teamId, teamName: team.name,
    missionType: String(formData.get("missionType")), priority: String(formData.get("priority")), status: "assigned",
    createdAt: new Date().toISOString(), actionWindow: String(formData.get("actionWindow")),
    ...(formData.get("deadline") ? { deadline: String(formData.get("deadline")) } : {}),
    notes: String(formData.get("notes") || "").trim()
  };
  state.missions.unshift(mission);
  appendEvent(state, { eventType: "mission_assigned", hotspotId, missionId: mission.id, description: `${mission.id} assigned to ${team.name} for ${hotspot.id}. This is a fictional demo assignment; no team was contacted.`, actor: "Demo coordinator" });
  persist();
  closeMutationDialog("missionDialog");
  announce(`${mission.id} assigned to ${team.name}. Demo record only; no team was contacted.`);
}

function submitVerification(form) {
  const formData = new FormData(form);
  const hotspotId = String(formData.get("hotspotId") || "");
  const missionId = String(formData.get("missionId") || "");
  const outcome = String(formData.get("outcome") || "");
  const verifier = String(formData.get("verifier") || "").trim();
  const hotspot = state.hotspots.find(item => item.id === hotspotId);
  const linkedMission = missionId ? state.missions.find(item => item.id === missionId && item.hotspotId === hotspotId) : null;
  if (!form.reportValidity() || !hotspot || !["confirmed", "rejected", "inconclusive"].includes(outcome) || !verifier) {
    $("#verificationError").textContent = "Choose a valid hotspot, one field outcome, and enter the verifier or team.";
    return;
  }
  if (missionId && !linkedMission) {
    $("#verificationError").textContent = "The selected mission must belong to the chosen hotspot.";
    return;
  }
  const record = { id: createId("PI-V"), hotspotId, ...(linkedMission ? { missionId: linkedMission.id } : {}), outcome, verifier, timestamp: new Date().toISOString(), notes: String(formData.get("notes") || "").trim() };
  state.verifications.push(record);
  if (linkedMission && ["assigned", "in_progress"].includes(linkedMission.status)) linkedMission.status = "awaiting_verification";
  appendEvent(state, { eventType: "verification_submitted", hotspotId, ...(linkedMission ? { missionId: linkedMission.id } : {}), timestamp: record.timestamp, description: `Verification recorded: ${statusLabel(outcome).toLowerCase()}. Cleanup status unchanged.`, actor: verifier, notificationTitle: outcome === "inconclusive" ? "Verification needs follow-up" : "Verification recorded" });
  selectedHotspotId = hotspotId;
  activeTab = "overview";
  persist();
  closeMutationDialog("verificationDialog");
  announce(`Verification recorded: ${statusLabel(outcome).toLowerCase()}. Cleanup status unchanged.`);
}

function submitCleanup(form) {
  const formData = new FormData(form);
  const mission = state.missions.find(item => item.id === String(formData.get("missionId") || ""));
  const timestamp = String(formData.get("timestamp") || "");
  const result = String(formData.get("result") || "");
  const quantityText = String(formData.get("quantity") || "").trim();
  const unit = String(formData.get("unit") || "");
  const quantity = quantityText ? Number(quantityText) : null;
  const validResult = ["completed", "unable_to_complete"].includes(result);
  const correctionReason = String(formData.get("correctionReason") || "").trim();
  const isCorrection = cleanupCorrectionMode;
  if (quantityText && (!Number.isFinite(quantity) || quantity < 0)) {
    $("#recoveredQuantity").setCustomValidity("Enter a valid quantity of zero or more.");
    $("#cleanupError").textContent = "Recovered quantity must be a number greater than or equal to zero.";
    $("#recoveredQuantity").reportValidity();
    return;
  }
  $("#recoveredQuantity").setCustomValidity("");
  if (quantityText && !unit) {
    $("#recoveredUnit").setCustomValidity("Choose a unit when you enter a quantity.");
    $("#cleanupError").textContent = "Choose a unit for the reported recovered quantity.";
    $("#recoveredUnit").reportValidity();
    return;
  }
  $("#recoveredUnit").setCustomValidity("");
  const eligibleStatus = isCorrection ? ["completed", "unable_to_complete"].includes(mission?.status) : ["assigned", "in_progress", "awaiting_verification"].includes(mission?.status);
  if (!form.reportValidity() || !mission || !eligibleStatus || !validDate(timestamp) || !validResult || (isCorrection && !correctionReason)) {
    $("#cleanupError").textContent = isCorrection ? "A valid timestamp, result, correction reason, and confirmation are required." : "Choose an eligible mission, valid timestamp, cleanup result, and confirm the report before saving.";
    return;
  }
  const hotspot = state.hotspots.find(item => item.id === mission.hotspotId);
  const recordedAt = new Date(timestamp).toISOString();
  const previousResult = mission.cleanupResult || mission.status;
  const previousQuantity = mission.recoveredQuantity !== undefined ? `${mission.recoveredQuantity} ${mission.recoveredUnit}` : "no quantity reported";
  mission.status = result;
  mission.cleanupResult = result;
  mission.cleanupRecordedAt = recordedAt;
  if (result === "completed") mission.completedAt = recordedAt;
  else delete mission.completedAt;
  if (quantityText) {
    mission.recoveredQuantity = quantity;
    mission.recoveredUnit = unit;
  } else {
    delete mission.recoveredQuantity;
    delete mission.recoveredUnit;
  }
  mission.cleanupNotes = String(formData.get("notes") || "").trim();
  const description = isCorrection
    ? `Cleanup record corrected from ${statusLabel(previousResult).toLowerCase()} (${previousQuantity}) to ${statusLabel(result).toLowerCase()}${quantityText ? ` (${quantity} ${unit})` : " (no quantity reported)"}. Reason: ${correctionReason}. Prior event remains in history.${hotspot ? ` Verification remains ${statusLabel(verificationStatus(state, hotspot)).toLowerCase()}.` : ""}`
    : `Cleanup result recorded; mission marked ${result === "completed" ? "completed" : "unable to complete"}.${quantityText ? ` Explicit sample quantity: ${quantity} ${unit}.` : " No quantity reported."}${hotspot ? ` Verification remains ${statusLabel(verificationStatus(state, hotspot)).toLowerCase()}.` : ""}`;
  appendEvent(state, { eventType: isCorrection ? "cleanup_corrected" : "cleanup_submitted", hotspotId: mission.hotspotId, missionId: mission.id, timestamp: recordedAt, description, actor: mission.teamName, notificationTitle: isCorrection ? "Cleanup result corrected" : undefined });
  cleanupCorrectionMode = false;
  persist();
  closeMutationDialog("cleanupDialog");
  announce(isCorrection ? "Cleanup correction saved with an audit event. The original event remains in history." : result === "completed" ? "Cleanup result recorded; mission marked completed." : "Cleanup result recorded; mission marked unable to complete.");
}

function startMission(missionId) {
  const mission = state.missions.find(item => item.id === missionId);
  if (!mission || !["new", "assigned"].includes(mission.status)) return;
  mission.status = "in_progress";
  appendEvent(state, { eventType: "mission_started", hotspotId: mission.hotspotId, missionId: mission.id, description: `${mission.id} marked in progress in the browser-local demo.`, actor: mission.teamName });
  persist();
  renderAll({ preserveFocus: true });
  announce(`${mission.id} marked in progress. Demo record only.`);
}

function clearHotspotFilters() {
  hotspotFilters.priority = "all"; hotspotFilters.status = "all";
  renderAll({ preserveFocus: true });
}
function clearMissionFilters() {
  missionFilters.status = "all"; missionFilters.priority = "all";
  renderAll({ preserveFocus: true });
}
function clearHistoryFilters() {
  Object.assign(historyFilters, { period: "all", region: "all", priority: "all", verification: "all", missionStatus: "all" });
  renderAll({ preserveFocus: true });
}

function markNotificationsRead() {
  let changed = false;
  for (const item of state.notifications) if (!item.read) { item.read = true; changed = true; }
  if (changed) persist();
}

function openNotification(itemId) {
  const item = state.notifications.find(notification => notification.id === itemId);
  if (!item) return;
  const dialog = $("#notificationsDialog");
  if (dialog.open) dialog.close();
  if (item.missionId) {
    const mission = state.missions.find(record => record.id === item.missionId);
    if (mission) {
      selectedHotspotId = mission.hotspotId;
      document.querySelector("#missions").scrollIntoView({ behavior: "smooth", block: "start" });
      renderAll();
      setTimeout(() => [...$$(".mission-row")].find(row => row.textContent.includes(mission.id))?.querySelector("button")?.focus({ preventScroll: true }), 350);
      return;
    }
  }
  if (state.hotspots.some(hotspot => hotspot.id === item.hotspotId)) {
    selectedHotspotId = item.hotspotId;
    activeTab = "overview";
    renderAll();
    document.querySelector("#details").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function resetDemo() {
  state = createSeedState();
  selectedHotspotId = state.hotspots[0]?.id || null;
  activeTab = "overview";
  Object.assign(hotspotFilters, { priority: "all", status: "all" });
  Object.assign(missionFilters, { status: "all", priority: "all" });
  clearHistoryObjectOnly();
  appendEvent(state, { eventType: "reset", description: "Browser-local demo data was reset to fictional seed records.", actor: "Demo user" });
  persist();
  closeMutationDialog("resetDialog");
  announce("Demo data reset to fictional seed records. This change is local to this browser.");
}
function clearHistoryObjectOnly() { Object.assign(historyFilters, { period: "all", region: "all", priority: "all", verification: "all", missionStatus: "all" }); }

function selectHotspot(id, options = {}) {
  const hotspot = state.hotspots.find(item => item.id === id && !item.archived);
  if (!hotspot) { announce("That hotspot is not available in this demo.", true); return; }
  const changed = selectedHotspotId !== id;
  selectedHotspotId = id;
  if (changed) activeTab = "overview";
  renderAll({ preserveFocus: true });
  if (options.scrollToDetail) document.querySelector("#details").scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleAction(button) {
  const action = button.dataset.action;
  if (action === "select-hotspot") selectHotspot(button.dataset.hotspotId);
  else if (action === "view-details") selectHotspot(button.dataset.hotspotId, { scrollToDetail: true });
  else if (action === "set-tab") {
    activeTab = button.dataset.tab;
    renderDetails();
    $(`#tab-${activeTab}`)?.focus();
  } else if (action === "assign-mission") openMissionForm(button.dataset.hotspotId || selectedHotspotId, button);
  else if (action === "verify-hotspot") openVerificationForm(button.dataset.hotspotId, "", button);
  else if (action === "verify-selected") openVerificationForm(selectedHotspotId, "", button);
  else if (action === "verify-mission") {
    const mission = state.missions.find(item => item.id === button.dataset.missionId);
    if (mission) openVerificationForm(mission.hotspotId, mission.id, button);
  } else if (action === "cleanup-mission") openCleanupForm(button.dataset.missionId, button);
  else if (action === "correct-cleanup") openCleanupForm(button.dataset.missionId, button, true);
  else if (action === "start-mission") startMission(button.dataset.missionId);
  else if (action === "mission-status-chip") {
    missionFilters.status = button.dataset.status;
    $("#missionStatusFilter").value = missionFilters.status;
    renderAll({ preserveFocus: true });
  } else if (action === "clear-hotspot-filters") clearHotspotFilters();
  else if (action === "clear-mission-filters") clearMissionFilters();
  else if (action === "clear-history-filters") clearHistoryFilters();
  else if (action === "open-reset") openDialog("resetDialog", button);
  else if (action === "confirm-reset") resetDemo();
  else if (action === "close-dialog") closeDialog(button.closest("dialog"));
  else if (action === "open-notification") openNotification(button.dataset.notificationId);
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (button) { handleAction(button); return; }
});

document.addEventListener("keydown", event => {
  const tab = event.target.closest('[role="tab"]');
  if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const tabs = $$("[role=tab]", $("#detailPanel"));
  const current = tabs.indexOf(tab);
  const index = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  tabs[index]?.click();
});

document.addEventListener("change", event => {
  const target = event.target;
  if (target.id === "hotspotPriorityFilter") hotspotFilters.priority = target.value;
  else if (target.id === "hotspotStatusFilter") hotspotFilters.status = target.value;
  else if (target.id === "missionStatusFilter") missionFilters.status = target.value;
  else if (target.id === "missionPriorityFilter") missionFilters.priority = target.value;
  else if (target.id === "historyPeriod") historyFilters.period = target.value;
  else if (target.id === "historyRegion") historyFilters.region = target.value;
  else if (target.id === "historyPriority") historyFilters.priority = target.value;
  else if (target.id === "historyVerification") historyFilters.verification = target.value;
  else if (target.id === "historyMissionStatus") historyFilters.missionStatus = target.value;
  else if (target.id === "verifyHotspot") {
    const currentMission = $("#verifyMission").value;
    const related = state.missions.filter(item => item.hotspotId === target.value && !["completed", "unable_to_complete"].includes(item.status));
    setSelectOptions($("#verifyMission"), related.map(item => ({ value: item.id, label: `${item.id} · ${statusLabel(item.status)}` })), "No mission linked", related.some(item => item.id === currentMission) ? currentMission : "");
  }
  if (/^(hotspot|mission|history)/.test(target.id || "")) renderAll({ preserveFocus: true });
});

$("#missionForm").addEventListener("submit", event => { event.preventDefault(); submitMission(event.currentTarget); });
$("#verificationForm").addEventListener("submit", event => { event.preventDefault(); submitVerification(event.currentTarget); });
$("#cleanupForm").addEventListener("submit", event => { event.preventDefault(); submitCleanup(event.currentTarget); });

$("#notificationToggle").addEventListener("click", event => {
  renderNotifications();
  openDialog("notificationsDialog", event.currentTarget);
  markNotificationsRead();
  renderDashboard();
  renderNotifications();
});

for (const dialog of $$("dialog")) {
  dialog.addEventListener("click", event => { if (event.target === dialog) closeDialog(dialog); });
}

$("#recoveredQuantity").addEventListener("input", () => $("#recoveredQuantity").setCustomValidity(""));
$("#recoveredUnit").addEventListener("change", () => $("#recoveredUnit").setCustomValidity(""));

const navLinks = $$("[data-nav]");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach(link => {
      if (link.getAttribute("href") === `#${visible.target.id}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-100px 0px -70% 0px", threshold: [0, .15, .35] });
  ["dashboard", "hotspots", "missions", "analytics", "history"].forEach(id => { const section = document.getElementById(id); if (section) observer.observe(section); });
}

renderAll();
if (storageNotice) announce(storageNotice, true);
