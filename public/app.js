const $ = (selector) => document.querySelector(selector);
const year = $("#year");
if (year) year.textContent = new Date().getFullYear();

// Branded intro.
window.addEventListener("load", () => {
  const intro = $("#intro");
  const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 1700;
  window.setTimeout(() => intro?.classList.add("done"), delay);
});

// Mobile navigation: every nav item is a working in-page link.
const menuToggle = $("#menuToggle");
const navLinks = $("#navLinks");
menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  navLinks?.classList.toggle("open", !isOpen);
});
navLinks?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "Open navigation");
}));

// Reveal content as it enters the viewport.
const revealTargets = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach(el => observer.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add("visible"));
}

// Optional gentle synthesized ambience; audio starts only after visitor opt-in.
let audioContext = null;
const soundToggle = $("#soundToggle");
soundToggle?.addEventListener("click", async () => {
  if (audioContext && audioContext.state !== "closed") {
    await audioContext.close();
    audioContext = null;
    soundToggle.textContent = "♪ Sound: Off";
    soundToggle.setAttribute("aria-pressed", "false");
    return;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    soundToggle.textContent = "Sound unavailable";
    return;
  }
  audioContext = new AudioCtx();
  const master = audioContext.createGain();
  master.gain.value = 0.018;
  master.connect(audioContext.destination);
  [110, 164.81, 220].forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = i === 1 ? "sine" : "triangle";
    osc.frequency.value = freq;
    gain.gain.value = i === 1 ? 0.24 : 0.16;
    osc.connect(gain);
    gain.connect(master);
    osc.start();
  });
  soundToggle.textContent = "♪ Sound: On";
  soundToggle.setAttribute("aria-pressed", "true");
});

async function submitJson(form, endpoint, noteElement, submitLabel) {
  const button = form.querySelector('button[type="submit"]');
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Sending…";
  noteElement.textContent = "";
  noteElement.classList.remove("error", "success");
  try {
    const payload = Object.fromEntries(new FormData(form).entries());
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Something went wrong. Please try again.");
    noteElement.textContent = result.message || "Success!";
    noteElement.classList.add("success");
    form.reset();
  } catch (error) {
    noteElement.textContent = error.message || "Could not connect. Is the backend running?";
    noteElement.classList.add("error");
  } finally {
    button.disabled = false;
    button.textContent = originalText || submitLabel;
  }
}

const signupForm = $("#signupForm");
signupForm?.addEventListener("submit", event => {
  event.preventDefault();
  submitJson(signupForm, "/api/newsletter", $("#newsletterNote"), "Keep me posted");
});

const contactForm = $("#contactForm");
contactForm?.addEventListener("submit", event => {
  event.preventDefault();
  submitJson(contactForm, "/api/contact", $("#contactNote"), "Send message");
});
