// Pagina di ritorno del collegamento con Google: rimanda il codice al server dell'ufficio.
//
// Il server di StudioFlow avvia il collegamento con un "state" fatto così:
//   base64url(JSON {"d": "<indirizzo del server>", "n": "<valore casuale>"}) + "." + firma
// La firma e la scadenza le controlla il server dell'ufficio; qui si legge solo "d" e si verifica
// che sia un indirizzo di rete interna, Tailscale o localhost (§ 3.5 del piano): qualsiasi altro
// indirizzo viene bloccato, così un link ingannevole non può mandare il codice altrove.
// Nulla viene salvato, registrato o inviato ad altri siti.

"use strict";

const CALLBACK_PATH = "/api/google/ritorno";

function decodeBase64Url(text) {
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function ipv4(host) {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  return parts.every((n) => n <= 255) ? parts : null;
}

// Indirizzi ammessi: rete interna, Tailscale (100.64–127.x), questo PC e nomi di PC della rete
// locale (senza punti o .local).
function isOfficeHost(host) {
  const h = host.toLowerCase();
  if (h === "localhost" || h === "[::1]") return true;
  const ip = ipv4(h);
  if (ip) {
    const [a, b] = ip;
    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) // Tailscale (CGNAT)
    );
  }
  // Niente nomi *.ts.net: con Tailscale Funnel chiunque può renderne uno pubblico. Chi usa
  // Tailscale torna all'indirizzo 100.x del server, che resta privato.
  if (h.endsWith(".local")) return true;
  // Nome del PC senza punti (es. SERVER-UFFICIO): esiste solo nella rete locale.
  return /^[a-z0-9-]{1,63}$/.test(h) && !/^\d+$/.test(h);
}

function officeBase(state) {
  try {
    const payload = JSON.parse(decodeBase64Url(state.split(".")[0]));
    const url = new URL(payload.d);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (url.pathname !== "/" || url.search || url.hash) return null;
    if (!isOfficeHost(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function show(stato) {
  document.body.dataset.stato = stato;
}

function start() {
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = dark ? "scuro" : "chiaro";

  const q = new URLSearchParams(window.location.search);
  const state = q.get("state");
  if (!state) return show("incompleto");
  const base = officeBase(state);
  if (!base) return show("bloccato");

  if (q.get("error")) {
    // Annullato su Google: si torna allo StudioFlow dell'ufficio senza codice; il server chiude
    // il collegamento avviato e mostra l'esito nella pagina Account Google.
    show("negato");
    const back = new URLSearchParams({ error: q.get("error"), state });
    document.getElementById("torna").href = base + CALLBACK_PATH + "?" + back.toString();
    return;
  }
  const code = q.get("code");
  if (!code) return show("incompleto");

  const next = new URLSearchParams({ code, state });
  const scope = q.get("scope");
  if (scope) next.set("scope", scope);
  const target = base + CALLBACK_PATH + "?" + next.toString();

  document.getElementById("dest").textContent = base;
  document.getElementById("vai").href = target;
  show("corso");
  // Il codice non resta nella cronologia di questa pagina.
  window.history.replaceState(null, "", window.location.pathname);
  window.setTimeout(() => window.location.replace(target), 400);
  window.setTimeout(() => {
    document.getElementById("lento").hidden = false;
  }, 8000);
}

document.addEventListener("DOMContentLoaded", start);
