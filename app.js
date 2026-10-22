const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt = (n) => n.toLocaleString("en-US");
const money = (n) => "$" + fmt(Math.round(n / 100) * 100);

/* ---------- hero: the lawn comes back as you scroll ---------- */
const after = document.querySelector(".hero-after");
const sprinkler = document.querySelector(".sprinkler");
const lineA = document.querySelector(".line-a");
const lineB = document.querySelector(".line-b");
const meter = document.querySelector(".meter-fill");

function paintHero(p) {
  // p: 0 = dead lawn, 1 = green lawn
  after.style.clipPath = `inset(0 ${100 - p * 100}% 0 0)`;
  sprinkler.style.left = `${p * 100}%`;
  sprinkler.style.opacity = p > 0.01 && p < 0.99 ? 1 : 0;
  // the headline stretches as the yard comes back
  lineA.style.fontStretch = `${62 + p * 38}%`;
  lineA.style.opacity = 1 - p * 0.85;
  lineB.style.fontStretch = `${62 + p * 63}%`;
  lineB.style.opacity = 0.22 + p * 0.78;
  lineB.style.color = p > 0.6 ? "var(--lawn)" : "var(--fog)";
  meter.style.width = `${p * 100}%`;
}

/* ---------- reel: one yard per screen ---------- */
const yards = [
  { town: "Avila Beach", name: "Pool yard, after dark", work: "Lighting, hedges, lawn edge", size: "2,400 sq ft", time: "3 weeks", water: "-35%" },
  { town: "San Luis Obispo", name: "The covered patio", work: "Patio lights, sod, planters", size: "900 sq ft", time: "10 days", water: "-20%" },
  { town: "Arroyo Grande", name: "Brick path garden", work: "Paver path, beds, drip lines", size: "1,600 sq ft", time: "2 weeks", water: "-55%" },
  { town: "Templeton", name: "Lawn out, boulders in", work: "Turf removal, gravel, natives", size: "2,100 sq ft", time: "2 weeks", water: "-80%" },
  { town: "Pismo Beach", name: "Backyard resort", work: "Palms, lawn, pool deck plants", size: "3,200 sq ft", time: "4 weeks", water: "-30%" },
];
const photos = [...document.querySelectorAll(".reel-photos img")];
const dots = [...document.querySelectorAll(".reel-dots li")];
const spec = {
  town: document.querySelector(".spec-town"), name: document.querySelector(".spec-name"),
  work: document.querySelector(".spec-work"), size: document.querySelector(".spec-size"),
  time: document.querySelector(".spec-time"), water: document.querySelector(".spec-water"),
};
let current = 0;
function showYard(i) {
  if (i === current) return;
  current = i;
  photos.forEach((img, k) => img.classList.toggle("is-on", k === i));
  dots.forEach((d, k) => d.classList.toggle("is-on", k === i));
  const y = yards[i];
  for (const key in spec) spec[key].textContent = y[key];
}

/* ---------- scroll wiring ---------- */
const toggle = document.querySelector(".compare-toggle");
if (!reduced && window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  paintHero(0);
  ScrollTrigger.create({
    trigger: ".hero", start: "top top", end: "bottom bottom", scrub: 0.6,
    onUpdate: (self) => paintHero(Math.min(1, self.progress / 0.85)),
  });
  ScrollTrigger.create({
    trigger: ".reel", start: "top top", end: "bottom bottom",
    onUpdate: (self) => showYard(Math.min(yards.length - 1, Math.floor(self.progress * yards.length))),
  });
} else {
  // No scroll scrubbing: a button flips between before and after, and the photos change on tap.
  paintHero(0);
  toggle.addEventListener("click", () => {
    const on = toggle.getAttribute("aria-pressed") !== "true";
    paintHero(on ? 1 : 0);
    toggle.setAttribute("aria-pressed", on);
    toggle.textContent = on ? "Show before" : "Show after";
  });
  document.querySelector(".reel-photos").addEventListener("click", () => showYard((current + 1) % yards.length));
}

/* ---------- price my yard ---------- */
const area = document.getElementById("area");
const priceItems = {
  sod:     { label: "New lawn (sod)", per: [2.5, 4.5] },
  native:  { label: "Drought-tolerant plants", per: [6, 11] },
  drip:    { label: "Drip irrigation", per: [1.2, 2] },
  patio:   { label: "Paver patio, 300 sq ft", flat: [5400, 9000] },
  lights:  { label: "Path and tree lighting", flat: [2500, 4500] },
  cleanup: { label: "Clear-out and haul away", per: [0.6, 1.1] },
};
let lastPrice = "";
function updatePrice() {
  const sq = +area.value;
  document.getElementById("areaOut").textContent = `${fmt(sq)} sq ft`;
  const picked = [...document.querySelectorAll("#priceForm input:checked")].map((c) => c.value);
  let lo = 0, hi = 0;
  const lines = picked.map((k) => {
    const it = priceItems[k];
    const [a, b] = it.flat || it.per.map((r) => r * sq);
    lo += a; hi += b;
    return `<li><span>${it.label}</span><span>${money(a)} to ${money(b)}</span></li>`;
  });
  document.getElementById("priceLines").innerHTML = lines.join("");
  const out = document.getElementById("priceRange");
  const time = document.getElementById("priceTime");
  if (!picked.length) {
    out.textContent = "Pick at least one";
    time.textContent = "Choose what you want in the yard to see a price.";
    lastPrice = "";
    return;
  }
  out.textContent = `${money(lo)} to ${money(hi)}`;
  const weeks = Math.max(1, Math.round((sq / 900) * (0.6 + picked.length * 0.25)));
  time.textContent = `About ${weeks} week${weeks > 1 ? "s" : ""} of work once we start.`;
  lastPrice = `${fmt(sq)} sq ft: ${picked.map((k) => priceItems[k].label.toLowerCase()).join(", ")} (${money(lo)} to ${money(hi)})`;
}
area.addEventListener("input", updatePrice);
document.getElementById("priceForm").addEventListener("change", updatePrice);
updatePrice();

/* ---------- water bill ---------- */
const lawn = document.getElementById("lawn");
const GAL_PER_SQFT = 22, RATE = 0.015, CUT = 0.75;
function updateWater() {
  const sq = +lawn.value;
  const gal = sq * GAL_PER_SQFT;
  document.getElementById("lawnOut").textContent = `${fmt(sq)} sq ft`;
  document.getElementById("gal").textContent = fmt(Math.round(gal / 100) * 100);
  document.getElementById("cost").textContent = "$" + fmt(Math.round(gal * RATE / 10) * 10);
  document.getElementById("save").textContent = "$" + fmt(Math.round(gal * RATE * CUT / 10) * 10);
  const pct = (sq / +lawn.max) * 100;
  document.querySelector(".bar-now").style.width = `${pct}%`;
  document.querySelector(".bar-after").style.width = `${pct * (1 - CUT)}%`;
}
lawn.addEventListener("input", updateWater);
updateWater();

/* ---------- booking panel ---------- */
const panel = document.querySelector(".book");
const scrim = document.querySelector(".book-scrim");
const form = document.getElementById("bookForm");
const done = document.querySelector(".book-done");
const fromNote = document.getElementById("bookFrom");
let opener = null;

function openBook(e) {
  opener = e.currentTarget;
  form.hidden = false; done.hidden = true;
  fromNote.hidden = true;
  if (opener.hasAttribute("data-from-price") && lastPrice) {
    fromNote.textContent = `Your estimate: ${lastPrice}`;
    fromNote.hidden = false;
  } else if (opener.hasAttribute("data-from-water")) {
    fromNote.textContent = `Your lawn: ${fmt(+lawn.value)} sq ft, about ${document.getElementById("cost").textContent} a year to water.`;
    fromNote.hidden = false;
    form.querySelector('[value="Drought-tolerant"]').checked = true;
  }
  panel.hidden = false; scrim.hidden = false;
  requestAnimationFrame(() => panel.classList.add("is-open"));
  setTimeout(() => form.querySelector("input").focus(), 50);
  document.body.style.overflow = "hidden";
}
function closeBook() {
  panel.classList.remove("is-open");
  scrim.hidden = true;
  document.body.style.overflow = "";
  setTimeout(() => { panel.hidden = true; }, reduced ? 0 : 350);
  if (opener) opener.focus();
}
document.querySelectorAll("[data-book]").forEach((b) => b.addEventListener("click", openBook));
document.querySelectorAll(".book-close, .book-close-2").forEach((b) => b.addEventListener("click", closeBook));
scrim.addEventListener("click", closeBook);
addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) closeBook(); });

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const err = document.getElementById("bookError");
  const data = new FormData(form);
  const name = (data.get("name") || "").trim();
  const phone = (data.get("phone") || "").replace(/\D/g, "");
  if (!name || phone.length < 10) {
    err.textContent = !name ? "Add your name so we know who to ask for." : "Add a 10-digit phone number so we can confirm the time.";
    err.hidden = false;
    return;
  }
  err.hidden = true;
  const wants = data.getAll("want");
  document.getElementById("doneText").textContent =
    `Thanks, ${name.split(" ")[0]}. We'll call to confirm a ${data.get("day")} visit in ${data.get("town")}` +
    (wants.length ? ` to look at your ${wants.join(", ").toLowerCase()}.` : ".");
  form.hidden = true; done.hidden = false;
  done.querySelector("button").focus();
});
