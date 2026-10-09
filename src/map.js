import { priorityLabel, sortedHotspots, verificationStatus, statusLabel } from "./state.js";

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

export function renderMap(state, selectedId) {
  const map = document.getElementById("mapCanvas");
  if (!map) return;
  const markers = sortedHotspots(state).map(hotspot => {
    const status = verificationStatus(state, hotspot);
    const short = hotspot.id.split("-").at(-1);
    return `<button id="marker-${escapeHtml(hotspot.id)}" class="map-marker ${escapeHtml(hotspot.priority)}" type="button" data-action="select-hotspot" data-hotspot-id="${escapeHtml(hotspot.id)}" style="left:${Number(hotspot.mapPos.x)}%;top:${Number(hotspot.mapPos.y)}%" aria-label="Select hotspot ${escapeHtml(short)}, ${escapeHtml(hotspot.regionLabel)}, ${priorityLabel(hotspot.priority)} priority, ${statusLabel(status)}" aria-pressed="${hotspot.id === selectedId}">${escapeHtml(short)}</button>`;
  }).join("");

  map.innerHTML = `<svg class="map-svg" viewBox="0 0 800 340" role="img" aria-labelledby="mapTitle mapDesc" preserveAspectRatio="none">
    <title id="mapTitle">Illustrative regional schematic, fictional sample points</title>
    <desc id="mapDesc">A simplified decorative coastline sketch for broad Arabian Sea, India, and Bay of Bengal demo regions. It is not to scale and does not show surveyed boundaries or real detection coordinates. Use the labeled hotspot buttons for selection.</desc>
    <path class="wave" d="M0 74 C130 55 174 91 296 69 S503 44 800 75"/><path class="wave" d="M0 108 C126 89 189 124 305 102 S520 83 800 111"/>
    <path class="wave" d="M0 253 C128 233 210 273 353 249 S576 229 800 257"/>
    <path class="coastline" d="M350 15 L403 21 426 40 415 58 437 74 430 93 449 111 433 126 441 143 462 152 455 168 477 184 466 198 448 210 455 228 443 244 427 258 416 280 399 298 379 310 368 300 376 278 358 266 365 247 347 230 354 214 331 194 343 180 326 164 338 144 323 127 338 111 319 93 338 77 327 61 348 43 337 29 Z"/>
    <path class="coastline" d="M425 258 Q466 254 493 269 L508 284 494 301 467 297 448 284 Z"/>
    <text x="74" y="50" class="sea-label">ARABIAN SEA</text><text x="581" y="57" class="sea-label">BAY OF BENGAL</text>
    <text x="353" y="172">INDIA</text><text x="365" y="189" style="font-size:8px;letter-spacing:.4px">schematic only</text>
    <text x="36" y="320" style="font-size:9px">DEMO REGIONS · NOT TO SCALE · NO PRECISE COORDINATES</text>
  </svg>${markers}`;
}
