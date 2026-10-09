import { createSeedState, SCHEMA_VERSION, STORAGE_KEY, TEAM_OPTIONS } from "./data.js";

export { TEAM_OPTIONS, STORAGE_KEY };

export function isValidState(value) {
  return Boolean(value && typeof value === "object" && value.schemaVersion === SCHEMA_VERSION && value.demoData === true &&
    Array.isArray(value.hotspots) && Array.isArray(value.missions) && Array.isArray(value.verifications) &&
    Array.isArray(value.events) && Array.isArray(value.notifications) &&
    value.hotspots.every(item => typeof item.id === "string" && typeof item.regionLabel === "string") &&
    value.missions.every(item => typeof item.id === "string" && typeof item.hotspotId === "string") &&
    value.verifications.every(item => typeof item.id === "string" && typeof item.hotspotId === "string"));
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const state = createSeedState();
      return { state, warning: "", persisted: saveState(state) };
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      try { localStorage.setItem(`${STORAGE_KEY}-recovery-${Date.now()}`, raw); } catch { /* best-effort recovery copy */ }
      const state = createSeedState();
      return { state, warning: "Saved demo data could not be parsed. A recovery copy was kept where browser storage allowed; fictional seed data is loaded.", persisted: saveState(state) };
    }
    if (!isValidState(parsed)) {
      try { localStorage.setItem(`${STORAGE_KEY}-recovery-${Date.now()}`, raw); } catch { /* best-effort recovery copy */ }
      const state = createSeedState();
      return { state, warning: "Saved demo data was outdated or malformed. A recovery copy was kept where browser storage allowed; fictional seed data is loaded.", persisted: saveState(state) };
    }
    return { state: parsed, warning: "", persisted: true };
  } catch (error) {
    const state = createSeedState();
    return { state, warning: "Browser storage could not be read. The demo is running with seed data in this session.", persisted: false, error };
  }
}

export function saveState(state) {
  try {
    state.schemaVersion = SCHEMA_VERSION;
    state.demoData = true;
    state.lastSavedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function createId(prefix) {
  const random = globalThis.crypto?.randomUUID?.().replaceAll("-", "").slice(0, 8) || Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${random.toUpperCase()}`;
}

export function latestVerification(state, hotspotId) {
  return state.verifications
    .filter(record => record.hotspotId === hotspotId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] || null;
}

export function verificationStatus(state, hotspot) {
  const latest = latestVerification(state, hotspot.id);
  return latest?.outcome || hotspot.verificationStatus || "pending";
}

export function statusLabel(status) {
  return ({ pending: "Pending verification", confirmed: "Confirmed", rejected: "Rejected", inconclusive: "Inconclusive", new: "New", assigned: "Assigned", in_progress: "In progress", awaiting_verification: "Awaiting verification", completed: "Completed", unable_to_complete: "Unable to complete" })[status] || status.replaceAll("_", " ");
}

export function priorityLabel(priority) {
  return ({ high: "High", medium: "Medium", low: "Low" })[priority] || "Not available";
}

export function missionTypeLabel(type) {
  return ({ cleanup: "Cleanup", field_verification: "Field verification", combined: "Combined" })[type] || "Not available";
}

export function selectMetrics(state) {
  const activeHotspots = state.hotspots.filter(hotspot => !hotspot.archived);
  return {
    completed: state.missions.filter(mission => mission.status === "completed").length,
    newAssigned: state.missions.filter(mission => ["new", "assigned"].includes(mission.status)).length,
    analyzed: activeHotspots.filter(hotspot => hotspot.imageAnalyzed).length,
    awaitingVerification: activeHotspots.filter(hotspot => ["pending", "inconclusive"].includes(verificationStatus(state, hotspot))).length,
    activeHotspots: activeHotspots.length
  };
}

export function activeMissionForHotspot(state, hotspotId) {
  return state.missions.find(mission => mission.hotspotId === hotspotId && !["completed", "unable_to_complete"].includes(mission.status)) || null;
}

export function appendEvent(state, event) {
  const record = { id: createId("PI-E"), timestamp: new Date().toISOString(), ...event };
  state.events.push(record);
  const notificationTypes = new Set(["candidate_observed", "mission_assigned", "mission_started", "verification_submitted", "cleanup_submitted", "cleanup_corrected"]);
  if (notificationTypes.has(record.eventType)) {
    state.notifications.unshift({
      id: createId("PI-N"), eventId: record.id, hotspotId: record.hotspotId, missionId: record.missionId || "",
      read: false, timestamp: record.timestamp, title: record.notificationTitle || eventTitle(record.eventType),
      description: record.description
    });
  }
  return record;
}

function eventTitle(type) {
  return ({ candidate_observed: "Candidate added", mission_assigned: "Mission assigned", mission_started: "Mission started", verification_submitted: "Verification recorded", cleanup_submitted: "Cleanup result recorded", cleanup_corrected: "Cleanup result corrected" })[type] || "Application event";
}

export function sortedHotspots(state) {
  return [...state.hotspots].filter(item => !item.archived).sort((a, b) => a.priorityOrder - b.priorityOrder || a.id.localeCompare(b.id));
}

export function selectOutcomeCounts(state) {
  const counts = { confirmed: 0, rejected: 0, inconclusive: 0, pending: 0 };
  for (const hotspot of state.hotspots.filter(item => !item.archived)) {
    const outcome = verificationStatus(state, hotspot);
    counts[counts[outcome] === undefined ? "pending" : outcome] += 1;
  }
  return counts;
}

export function selectPriorityCounts(state) {
  const counts = { high: 0, medium: 0, low: 0 };
  for (const hotspot of state.hotspots.filter(item => !item.archived)) if (counts[hotspot.priority] !== undefined) counts[hotspot.priority] += 1;
  return counts;
}

export function selectCompletionsByMonth(state) {
  const completed = state.missions.filter(mission => mission.status === "completed" && mission.completedAt && Number.isFinite(Date.parse(mission.completedAt)));
  const counts = new Map();
  for (const mission of completed) {
    const date = new Date(mission.completedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([key, count]) => ({ key, count }));
}

export function selectRecoveryByUnit(state) {
  const totals = new Map();
  for (const mission of state.missions) {
    if (mission.status !== "completed" || mission.recoveredQuantity === undefined || mission.recoveredQuantity === null || mission.recoveredQuantity === "") continue;
    const quantity = Number(mission.recoveredQuantity);
    const unit = mission.recoveredUnit;
    if (Number.isFinite(quantity) && quantity >= 0 && typeof unit === "string" && unit) totals.set(unit, (totals.get(unit) || 0) + quantity);
  }
  return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([unit, quantity]) => ({ unit, quantity }));
}

export function selectAverageIntervals(state) {
  const verificationIntervals = [];
  for (const verification of state.verifications) {
    const hotspot = state.hotspots.find(item => item.id === verification.hotspotId);
    const start = hotspot ? Date.parse(hotspot.observedAt) : NaN;
    const end = Date.parse(verification.timestamp);
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start) verificationIntervals.push(end - start);
  }
  const cleanupIntervals = state.missions.filter(mission => mission.status === "completed" && mission.completedAt)
    .map(mission => Date.parse(mission.completedAt) - Date.parse(mission.createdAt)).filter(duration => Number.isFinite(duration) && duration >= 0);
  const averageHours = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length / 3600000 : null;
  return { verificationHours: averageHours(verificationIntervals), verificationSample: verificationIntervals.length, cleanupHours: averageHours(cleanupIntervals), cleanupSample: cleanupIntervals.length };
}

export function selectRecurringRegions(state) {
  const counts = new Map();
  for (const hotspot of state.hotspots.filter(item => !item.archived)) counts.set(hotspot.regionLabel, (counts.get(hotspot.regionLabel) || 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([region, count]) => ({ region, count }));
}
