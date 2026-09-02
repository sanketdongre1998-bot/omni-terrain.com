import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCP8XUel4Rcb5QpvbatApMiCI3IoyDeTAg",
  authDomain: "omni-terrain.firebaseapp.com",
  projectId: "omni-terrain",
  storageBucket: "omni-terrain.firebasestorage.app",
  messagingSenderId: "907163557856",
  appId: "1:907163557856:web:2823fcfef0d6cc330b9585"
};

const GOOGLE_MARK = `<svg class="ot-google-mark" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.37l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.92A6.02 6.02 0 0 1 6.08 12c0-.67.12-1.32.31-1.92V7.46H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.54l3.35-2.62Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.46l3.35 2.62C7.18 7.71 9.39 5.95 12 5.95Z"/></svg>`;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

let currentUser = null;
let previousFocus = null;

function safePhotoUrl(url) {
  return /^https:\/\/(?:lh3\.googleusercontent\.com|googleusercontent\.com)\//i.test(String(url || "")) ? url : "";
}

function firstName(user) {
  const name = String(user?.displayName || "").trim();
  return name ? name.split(/\s+/)[0] : "Account";
}

function prefillCheckout(user) {
  if (!user) return;
  const parts = String(user.displayName || "").trim().split(/\s+/).filter(Boolean);
  const values = {
    "#firstName": parts[0] || "",
    "#lastName": parts.slice(1).join(" "),
    "#email": String(user.email || "")
  };
  Object.entries(values).forEach(([selector, value]) => {
    const field = document.querySelector(selector);
    if (!field || field.value || !value) return;
    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function createDialog() {
  if (document.getElementById("otAuthOverlay")) return;
  const overlay = document.createElement("div");
  overlay.className = "ot-auth-overlay";
  overlay.id = "otAuthOverlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <section class="ot-auth-dialog" id="otAuthDialog" role="dialog" aria-modal="true" aria-labelledby="otAuthTitle">
      <button class="ot-auth-close" type="button" data-ot-auth-close aria-label="Close account dialog">×</button>
      <span class="ot-auth-kicker">Omni Terrain account</span>
      <h2 class="ot-auth-title" id="otAuthTitle">Sign in. Shop faster.</h2>
      <p class="ot-auth-copy" data-ot-auth-copy>Use your Google account for a quick, secure sign-in. We only request your basic profile and email.</p>
      <div data-ot-auth-guest>
        <button class="ot-google-auth-button" type="button" data-ot-google-signin>${GOOGLE_MARK}<span>Continue with Google</span></button>
        <p class="ot-auth-privacy">By continuing, you agree to our <a href="terms-conditions.html">Terms</a> and acknowledge our <a href="privacy-policy.html">Privacy Policy</a>.</p>
      </div>
      <div data-ot-auth-user hidden>
        <div class="ot-auth-profile"><img data-ot-auth-photo alt="" referrerpolicy="no-referrer"><div><strong data-ot-auth-name></strong><span data-ot-auth-email></span></div></div>
        <button class="ot-auth-signout" type="button" data-ot-signout>Sign out</button>
      </div>
      <p class="ot-auth-status" data-ot-auth-status role="status" aria-live="polite"></p>
    </section>`;
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest("[data-ot-auth-close]")) closeDialog();
  });
  overlay.querySelector("[data-ot-google-signin]").addEventListener("click", handleSignIn);
  overlay.querySelector("[data-ot-signout]").addEventListener("click", handleSignOut);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) closeDialog();
  });
}

function setStatus(message = "") {
  const status = document.querySelector("[data-ot-auth-status]");
  if (status) status.textContent = message;
}

function setBusy(button, busy, label) {
  if (!button) return;
  button.disabled = busy;
  button.innerHTML = busy ? '<span class="ot-auth-spinner" aria-hidden="true"></span><span>Please wait…</span>' : `${GOOGLE_MARK}<span>${label}</span>`;
}

function openDialog() {
  createDialog();
  const overlay = document.getElementById("otAuthOverlay");
  if (!overlay) return;
  previousFocus = document.activeElement;
  renderUser(currentUser);
  setStatus("");
  overlay.hidden = false;
  document.body.classList.add("ot-auth-open");
  const focusTarget = overlay.querySelector(currentUser ? "[data-ot-signout]" : "[data-ot-google-signin]");
  window.setTimeout(() => focusTarget?.focus(), 0);
}

function closeDialog() {
  const overlay = document.getElementById("otAuthOverlay");
  if (!overlay || overlay.hidden) return;
  overlay.hidden = true;
  document.body.classList.remove("ot-auth-open");
  if (previousFocus instanceof HTMLElement) previousFocus.focus();
}

function renderUser(user) {
  currentUser = user || null;
  prefillCheckout(currentUser);
  document.querySelectorAll("[data-ot-auth-trigger]").forEach((button) => {
    if (button.classList.contains("ot-mobile-auth-trigger")) {
      button.textContent = user ? `Account · ${firstName(user)}` : "Sign in / Create account";
      return;
    }
    button.classList.toggle("is-authenticated", Boolean(user));
    button.replaceChildren();
    const photoUrl = safePhotoUrl(user?.photoURL);
    if (user && photoUrl) {
      const avatar = document.createElement("img");
      avatar.className = "ot-auth-avatar";
      avatar.src = photoUrl;
      avatar.alt = "";
      avatar.referrerPolicy = "no-referrer";
      button.appendChild(avatar);
    }
    const label = document.createElement("span");
    label.className = "ot-auth-trigger-label";
    label.textContent = user ? firstName(user) : "Sign in";
    button.appendChild(label);
    button.setAttribute("aria-label", user ? `Open account for ${firstName(user)}` : "Sign in or create account");
  });

  const guest = document.querySelector("[data-ot-auth-guest]");
  const account = document.querySelector("[data-ot-auth-user]");
  const title = document.getElementById("otAuthTitle");
  const copy = document.querySelector("[data-ot-auth-copy]");
  if (!guest || !account || !title || !copy) return;
  guest.hidden = Boolean(user);
  account.hidden = !user;
  title.textContent = user ? "You're signed in." : "Sign in. Shop faster.";
  copy.textContent = user ? "Your Omni Terrain account is ready across this browser." : "Use your Google account for a quick, secure sign-in. We only request your basic profile and email.";
  if (user) {
    const photo = account.querySelector("[data-ot-auth-photo]");
    const photoUrl = safePhotoUrl(user.photoURL);
    photo.hidden = !photoUrl;
    if (photoUrl) photo.src = photoUrl;
    account.querySelector("[data-ot-auth-name]").textContent = user.displayName || "Omni Terrain customer";
    account.querySelector("[data-ot-auth-email]").textContent = user.email || "";
  }
}

function readableError(error) {
  const code = String(error?.code || "");
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return "Sign-in was cancelled. You can try again anytime.";
  if (code === "auth/popup-blocked") return "Your browser blocked the Google sign-in window. Allow pop-ups for Omni Terrain and try again.";
  if (code === "auth/unauthorized-domain") return "Google sign-in is being activated for this website. Please try again shortly.";
  if (code === "auth/network-request-failed") return "Network issue detected. Check your connection and try again.";
  return "We couldn't complete sign-in. Please try again.";
}

async function handleSignIn() {
  const button = document.querySelector("[data-ot-google-signin]");
  setStatus("");
  setBusy(button, true, "Continue with Google");
  try {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithPopup(auth, provider);
    setStatus("");
  } catch (error) {
    setStatus(readableError(error));
  } finally {
    setBusy(button, false, "Continue with Google");
  }
}

async function handleSignOut() {
  const button = document.querySelector("[data-ot-signout]");
  if (button) button.disabled = true;
  setStatus("");
  try {
    await signOut(auth);
    closeDialog();
  } catch (_) {
    setStatus("We couldn't sign you out. Please try again.");
  } finally {
    if (button) button.disabled = false;
  }
}

function bindTriggers() {
  createDialog();
  document.querySelectorAll("[data-ot-auth-trigger]").forEach((button) => {
    if (button.dataset.otAuthBound === "true") return;
    button.dataset.otAuthBound = "true";
    button.addEventListener("click", openDialog);
  });
}

bindTriggers();
onAuthStateChanged(auth, (user) => {
  renderUser(user);
  document.dispatchEvent(new CustomEvent("omni:auth-state", { detail: { signedIn: Boolean(user) } }));
});

window.__OMNI_FIREBASE_AUTH__ = Object.freeze({ projectId: firebaseConfig.projectId, provider: "google.com" });
