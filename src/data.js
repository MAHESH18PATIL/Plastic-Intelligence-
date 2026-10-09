export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = "plastic-intelligence-demo-v1";
export const TEAM_OPTIONS = [
  { id: "team-coast-a", name: "Coastal Response Team A" },
  { id: "team-marine-b", name: "Marine Field Team B" },
  { id: "team-shore-c", name: "Shoreline Review Team C" }
];

export function createSeedState() {
  const hotspots = [
    {
      id: "PI-H-104", regionLabel: "Arabian Sea · demo region", priority: "high", priorityOrder: 1,
      debrisLevel: "High estimate", confidence: 0.71, observedAt: "2026-10-09T08:35:00+05:30",
      evidenceNotes: "A broad, low-contrast surface pattern appears in this fictional sample. The observation is uncertain and needs a field check before any debris claim.",
      alternativeExplanations: ["Sea foam", "Sun glint", "Floating vegetation"], imageAnalyzed: true,
      imageLabel: "Illustrative sample card · not satellite imagery", verificationStatus: "pending", archived: false,
      movementSummary: "Simulated drift toward the west-coast review zone", actionWindow: "Immediate review",
      rationale: "Higher estimated severity and a simulated movement scenario near a sensitive review zone increase demo attention; confidence is moderate and field verification is still required.",
      suggestedAction: "Dispatch a field-verification mission", resourceNote: "One fictional team is available in this sample.", mapPos: { x: 30, y: 59 },
      waypoints: [{ time: "Now", label: "Current sample point", x: 16, y: 73 }, { time: "+24 h", label: "Illustrative westward scenario", x: 43, y: 59 }, { time: "+48 h", label: "Uncertain coastal approach", x: 67, y: 43 }, { time: "+72 h", label: "Scenario endpoint · uncertain", x: 86, y: 30 }]
    },
    {
      id: "PI-H-107", regionLabel: "Bay of Bengal · demo region", priority: "medium", priorityOrder: 2,
      debrisLevel: "Moderate estimate", confidence: 0.64, observedAt: "2026-10-07T10:10:00+05:30",
      evidenceNotes: "A patch-like sample pattern is included to demonstrate review history. A field team recorded a confirmed demo outcome; the sample does not represent a real detection.",
      alternativeExplanations: ["Cloud artifact", "Sea foam"], imageAnalyzed: true,
      imageLabel: "Illustrative sample card · not satellite imagery", verificationStatus: "confirmed", archived: false,
      movementSummary: "No current movement scenario seeded", actionWindow: "Within 48 hours",
      rationale: "This medium-attention sample includes a recorded field confirmation; a linked mission has a separate recorded cleanup result.",
      suggestedAction: "Review the completed sample record", resourceNote: "Historical fictional sample; no team is dispatched.", mapPos: { x: 73, y: 56 },
      waypoints: [{ time: "Now", label: "Recorded demo observation", x: 18, y: 49 }, { time: "+24 h", label: "No movement estimate available", x: 49, y: 49 }, { time: "+48 h", label: "No movement estimate available", x: 80, y: 49 }]
    },
    {
      id: "PI-H-109", regionLabel: "Arabian Sea · demo region", priority: "low", priorityOrder: 5,
      debrisLevel: "Low estimate", confidence: 0.82, observedAt: "2026-10-05T14:20:00+05:30",
      evidenceNotes: "The fictional field note describes a reflective surface patch. This candidate was rejected in the sample because the observed pattern was consistent with glare.",
      alternativeExplanations: ["Sun glint", "Water reflection"], imageAnalyzed: true,
      imageLabel: "Illustrative sample card · not satellite imagery", verificationStatus: "rejected", archived: false,
      movementSummary: "No movement estimate seeded", actionWindow: "Routine monitoring",
      rationale: "A low estimated severity and a recorded rejected demo verification suggest routine monitoring; rejection is not a cleanup record.",
      suggestedAction: "Retain the rejection in the event history", resourceNote: "No active mission is linked to this sample.", mapPos: { x: 37, y: 42 },
      waypoints: [{ time: "Now", label: "Rejected sample observation", x: 18, y: 39 }, { time: "+24 h", label: "No movement estimate available", x: 49, y: 39 }, { time: "+48 h", label: "No movement estimate available", x: 80, y: 39 }]
    },
    {
      id: "PI-H-112", regionLabel: "Bay of Bengal · demo region", priority: "medium", priorityOrder: 3,
      debrisLevel: "Moderate estimate", confidence: 0.49, observedAt: "2026-10-08T06:45:00+05:30",
      evidenceNotes: "This synthetic surface signature is intentionally ambiguous. The fictional field entry was inconclusive; additional verification is needed.",
      alternativeExplanations: ["Floating vegetation", "Cloud artifact", "Sea foam"], imageAnalyzed: true,
      imageLabel: "Illustrative sample card · not satellite imagery", verificationStatus: "inconclusive", archived: false,
      movementSummary: "Simulated movement is diffuse and uncertain", actionWindow: "Within 24 hours",
      rationale: "Uncertainty remains high after an inconclusive demo visit. A follow-up review is suggested, but the trajectory and urgency are illustrative only.",
      suggestedAction: "Review evidence and consider a follow-up visit", resourceNote: "Fictional teams are available for assignment.", mapPos: { x: 80, y: 70 },
      waypoints: [{ time: "Now", label: "Current sample point", x: 15, y: 58 }, { time: "+24 h", label: "Diffuse movement scenario", x: 41, y: 54 }, { time: "+48 h", label: "Wide uncertainty range", x: 67, y: 50 }, { time: "+72 h", label: "Scenario endpoint · uncertain", x: 86, y: 43 }]
    },
    {
      id: "PI-H-118", regionLabel: "Central Indian Ocean · demo region", priority: "high", priorityOrder: 4,
      debrisLevel: "Elevated estimate", confidence: 0.58, observedAt: "2026-10-09T05:15:00+05:30",
      evidenceNotes: "A fictional broad surface patch is included to demonstrate pending review. There is no verified position, measurement, or real imagery associated with this record.",
      alternativeExplanations: ["Sea foam", "Floating vegetation", "Sun glint"], imageAnalyzed: false,
      imageLabel: "Illustrative evidence placeholder · no real image", verificationStatus: "pending", archived: false,
      movementSummary: "Direction is not available in the demo data", actionWindow: "Within 24 hours",
      rationale: "The demo marks this candidate for review because its estimated severity is elevated; uncertainty remains and no directional movement estimate is available.",
      suggestedAction: "Review candidate evidence before assignment", resourceNote: "Fictional team availability is not a real dispatch resource.", mapPos: { x: 54, y: 29 },
      waypoints: [{ time: "Now", label: "Pending sample point", x: 17, y: 55 }, { time: "+24 h", label: "No movement estimate available", x: 47, y: 55 }, { time: "+48 h", label: "No movement estimate available", x: 80, y: 55 }]
    }
  ];

  const missions = [
    {
      id: "PI-M-101", hotspotId: "PI-H-107", teamId: "team-marine-b", teamName: "Marine Field Team B",
      missionType: "combined", priority: "medium", status: "completed", createdAt: "2026-10-06T09:10:00+05:30",
      actionWindow: "Within 48 hours", deadline: "2026-10-08", completedAt: "2026-10-07T15:20:00+05:30",
      recoveredQuantity: 18, recoveredUnit: "kg", cleanupResult: "completed", notes: "Fictional sample result, entered explicitly for analytics demonstration."
    },
    {
      id: "PI-M-102", hotspotId: "PI-H-104", teamId: "team-coast-a", teamName: "Coastal Response Team A",
      missionType: "field_verification", priority: "high", status: "assigned", createdAt: "2026-10-09T09:05:00+05:30",
      actionWindow: "Immediate review", deadline: "2026-10-10", notes: "Demo assignment; no real team has been contacted."
    },
    {
      id: "PI-M-103", hotspotId: "PI-H-118", teamId: "team-shore-c", teamName: "Shoreline Review Team C",
      missionType: "cleanup", priority: "high", status: "new", createdAt: "2026-10-09T10:30:00+05:30",
      actionWindow: "Within 24 hours", notes: "Fictional sample mission, awaiting coordination."
    }
  ];

  const verifications = [
    { id: "PI-V-101", hotspotId: "PI-H-107", missionId: "PI-M-101", outcome: "confirmed", verifier: "Marine Field Team B", timestamp: "2026-10-07T13:45:00+05:30", notes: "Fictional field confirmation for the demo." },
    { id: "PI-V-102", hotspotId: "PI-H-109", outcome: "rejected", verifier: "Shoreline Review Team C", timestamp: "2026-10-06T09:20:00+05:30", notes: "Fictional sample: observed reflection was consistent with sun glint." },
    { id: "PI-V-103", hotspotId: "PI-H-112", outcome: "inconclusive", verifier: "Marine Field Team B", timestamp: "2026-10-08T10:30:00+05:30", notes: "Fictional sample visit; further verification needed." }
  ];

  const events = [
    { id: "PI-E-101", eventType: "candidate_observed", hotspotId: "PI-H-104", timestamp: "2026-10-09T08:35:00+05:30", description: "Fictional candidate observation added for review.", actor: "Demo seed" },
    { id: "PI-E-102", eventType: "candidate_observed", hotspotId: "PI-H-118", timestamp: "2026-10-09T05:15:00+05:30", description: "Fictional candidate observation added for review.", actor: "Demo seed" },
    { id: "PI-E-103", eventType: "mission_assigned", hotspotId: "PI-H-104", missionId: "PI-M-102", timestamp: "2026-10-09T09:05:00+05:30", description: "Demo field-verification mission assigned to Coastal Response Team A.", actor: "Demo coordinator" },
    { id: "PI-E-104", eventType: "candidate_observed", hotspotId: "PI-H-112", timestamp: "2026-10-08T06:45:00+05:30", description: "Fictional candidate observation added for review.", actor: "Demo seed" },
    { id: "PI-E-105", eventType: "verification_submitted", hotspotId: "PI-H-112", timestamp: "2026-10-08T10:30:00+05:30", description: "Demo field verification recorded as inconclusive; further review remains open.", actor: "Marine Field Team B" },
    { id: "PI-E-106", eventType: "candidate_observed", hotspotId: "PI-H-107", timestamp: "2026-10-07T10:10:00+05:30", description: "Fictional candidate observation added for review.", actor: "Demo seed" },
    { id: "PI-E-107", eventType: "verification_submitted", hotspotId: "PI-H-107", missionId: "PI-M-101", timestamp: "2026-10-07T13:45:00+05:30", description: "Demo field verification recorded as confirmed; cleanup remained a separate step.", actor: "Marine Field Team B" },
    { id: "PI-E-108", eventType: "cleanup_submitted", hotspotId: "PI-H-107", missionId: "PI-M-101", timestamp: "2026-10-07T15:20:00+05:30", description: "Fictional demo cleanup result explicitly recorded as completed (18 kg entered in sample data).", actor: "Marine Field Team B" },
    { id: "PI-E-109", eventType: "mission_assigned", hotspotId: "PI-H-118", missionId: "PI-M-103", timestamp: "2026-10-09T10:30:00+05:30", description: "Fictional sample mission created for coordination.", actor: "Demo coordinator" },
    { id: "PI-E-110", eventType: "candidate_observed", hotspotId: "PI-H-109", timestamp: "2026-10-05T14:20:00+05:30", description: "Fictional candidate observation added for review.", actor: "Demo seed" },
    { id: "PI-E-111", eventType: "verification_submitted", hotspotId: "PI-H-109", timestamp: "2026-10-06T09:20:00+05:30", description: "Demo candidate rejected after a fictional observation consistent with glare; no cleanup was inferred.", actor: "Shoreline Review Team C" },
    { id: "PI-E-112", eventType: "candidate_observed", hotspotId: "PI-H-112", timestamp: "2026-10-04T11:10:00+05:30", description: "Earlier fictional sample observation included for history demonstration.", actor: "Demo seed" }
  ];

  const notifications = [
    { id: "PI-N-101", eventId: "PI-E-103", hotspotId: "PI-H-104", missionId: "PI-M-102", read: false, timestamp: "2026-10-09T09:05:00+05:30", title: "Mission assigned", description: "Coastal Response Team A has a fictional field-verification assignment." },
    { id: "PI-N-102", eventId: "PI-E-105", hotspotId: "PI-H-112", read: false, timestamp: "2026-10-08T10:30:00+05:30", title: "Verification needs follow-up", description: "The sample field outcome is inconclusive; further verification is needed." },
    { id: "PI-N-103", eventId: "PI-E-101", hotspotId: "PI-H-104", read: true, timestamp: "2026-10-09T08:35:00+05:30", title: "Candidate added", description: "A fictional candidate observation awaits review." }
  ];

  return {
    schemaVersion: SCHEMA_VERSION, demoData: true, lastSavedAt: new Date().toISOString(),
    hotspots, missions, verifications, events, notifications
  };
}
