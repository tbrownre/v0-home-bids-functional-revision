/**
 * ADLAND experience engine (Tim Oct 9: "the replica" of the Astra homeowner page — same design, same motion).
 *
 * Dependency-free DOM animator so the exact same code runs inside the Next.js page (client island) AND inside the
 * standalone preview pages. It drives, from one clock:
 *   - the typewriter in the headline (.trade): type 34 ms/char → hold → delete 25 ms/char → next scene
 *   - the iMessage conversation: bubbles reveal on a fixed cadence, typing dots before every reply that follows a
 *     message from the person, Tapback on the last bubble, optional estimate card
 *   - the ambient: hue shift per scene, wave shine when a scene completes
 * Pauses when the tab is hidden, on the pause button, and after the visitor taps to open Messages. With
 * prefers-reduced-motion it renders the finished first scene and never animates.
 *
 * Timing constants are the reference page's (34 / 25 ms per character, bubbles at 180 ms then every ~1.5 s,
 * 1.85 s hold, 250 ms clear).
 */

export interface SceneLine {
  from: "me" | "them";
  text: string;
  card?: { title: string; lines: string[]; cta?: string };
}
export interface Scene {
  word: string;
  messages: SceneLine[];
}
export interface ExperienceConfig {
  scenes: Scene[];
  rotate: boolean;
  avatar: string;
  avatarEmoji: boolean;
}

const TYPE_MS = 34;
const DELETE_MS = 25;
const FIRST_MS = 180;
const STEP_MS = 1500;
const TYPING_LEAD_MS = 400;
const HOLD_MS = 1850;
const HOLD_SINGLE_MS = 3200;
const CLEAR_MS = 250;
const REACTIONS = ["\u{1F44D}", "❤️", "\u{1F44D}", "❤️", "\u{1F44D}"];

interface Frame {
  index: number;
  text: string;
  count: number;
  typing: boolean;
  complete: boolean;
  phase: "typing" | "conversation" | "clearing" | "deleting";
  reaction: string | null;
  brighten: boolean;
}

function sceneDurations(cfg: ExperienceConfig) {
  const single = cfg.scenes.length === 1;
  return cfg.scenes.map((s) => {
    const n = s.messages.length;
    const typeMs = cfg.rotate ? TYPE_MS * s.word.length : 0;
    const delMs = cfg.rotate ? DELETE_MS * s.word.length : 0;
    const convo = FIRST_MS + STEP_MS * (n - 1) + (single ? HOLD_SINGLE_MS : HOLD_MS);
    return { typeMs, convo, delMs, total: typeMs + convo + CLEAR_MS + delMs };
  });
}

function frameAt(cfg: ExperienceConfig, elapsed: number, durs: ReturnType<typeof sceneDurations>): Frame {
  const cycle = durs.reduce((a, d) => a + d.total, 0);
  let s = elapsed % cycle;
  let t = 0;
  while (s >= durs[t].total) {
    s -= durs[t].total;
    t++;
  }
  const scene = cfg.scenes[t];
  const d = durs[t];
  const word = scene.word;
  const n = d.typeMs;
  const o = n + d.convo;
  const phase: Frame["phase"] = s < n ? "typing" : s < o ? "conversation" : s < o + CLEAR_MS ? "clearing" : "deleting";
  const typed =
    phase === "typing"
      ? Math.min(word.length, Math.floor(s / TYPE_MS))
      : phase === "deleting"
        ? Math.max(0, word.length - Math.floor((s - o - CLEAR_MS) / DELETE_MS))
        : word.length;
  const msgs = scene.messages;
  let count = 0;
  if (phase === "conversation") {
    const rel = s - n;
    for (let k = 0; k < msgs.length; k++) if (rel >= FIRST_MS + STEP_MS * k) count = k + 1;
  } else if (phase === "clearing") count = msgs.length;
  let typing = false;
  if (phase === "conversation" && count < msgs.length && msgs[count].from === "them" && (count === 0 ? false : msgs[count - 1].from === "me")) {
    const rel = s - n;
    typing = rel >= FIRST_MS + STEP_MS * (count - 1) + TYPING_LEAD_MS;
  }
  const complete = phase === "conversation" && count === msgs.length;
  const g = s - n - (FIRST_MS + STEP_MS * (msgs.length - 1));
  const reaction = complete && g >= 200 ? REACTIONS[t % REACTIONS.length] : null;
  return { index: t, text: cfg.rotate ? word.slice(0, typed) : word, count, typing, complete, phase, reaction, brighten: complete && g >= 500 };
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function miniAvatar(cfg: ExperienceConfig): HTMLElement {
  const a = el("span", "mini-avatar" + (cfg.avatarEmoji ? " emoji" : ""));
  if (cfg.avatarEmoji) a.textContent = cfg.avatar;
  else {
    const b = el("b", undefined, cfg.avatar.slice(0, 1));
    a.appendChild(b);
    a.appendChild(document.createTextNode(cfg.avatar.slice(1, 2)));
  }
  return a;
}

function rowFor(cfg: ExperienceConfig, line: SceneLine, isLast: boolean, animate: boolean): HTMLElement {
  const row = el("div", "message-row " + (line.from === "me" ? "outgoing" : "incoming") + (isLast ? " final-response" : "") + (animate ? " row-in" : ""));
  if (line.from === "them") row.appendChild(miniAvatar(cfg));
  const bubble = el("div", "bubble" + (line.card ? " has-card" : ""));
  bubble.appendChild(document.createTextNode(line.text));
  if (line.card) {
    const card = el("div", "ecard");
    card.appendChild(el("b", undefined, line.card.title));
    for (const l of line.card.lines) card.appendChild(el("span", undefined, l));
    card.appendChild(el("em", undefined, line.card.cta || "View & Send Estimate →"));
    bubble.appendChild(card);
  }
  row.appendChild(bubble);
  return row;
}

/** Mounts the animator on a server-rendered experience root. Returns a cleanup function. */
export function mountAdExperience(root: HTMLElement, cfg: ExperienceConfig): () => void {
  const trade = root.querySelector<HTMLElement>("[data-x-trade]");
  const cursor = root.querySelector<HTMLElement>("[data-x-cursor]");
  const messages = root.querySelector<HTMLElement>("[data-x-messages]");
  const ambient = root.querySelector<HTMLElement>("[data-x-ambient]");
  const waves = root.querySelector<SVGElement>("[data-x-waves]");
  const toggle = root.querySelector<HTMLButtonElement>("[data-x-toggle]");
  if (!trade || !messages || !cfg.scenes.length) return () => {};
  const durs = sceneDurations(cfg);
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const rendered = { index: -1, count: 0, typing: false, reaction: null as string | null, brighten: false, phase: "" };
  let typingRow: HTMLElement | null = null;
  let tapback: HTMLElement | null = null;

  const render = (f: Frame, animate: boolean) => {
    const scene = cfg.scenes[f.index];
    if (trade.firstChild && trade.firstChild.nodeType === 3) trade.firstChild.textContent = f.text;
    else trade.insertBefore(document.createTextNode(f.text), trade.firstChild);
    root.setAttribute("data-phase", f.phase);
    root.setAttribute("data-trade", scene.word);
    if (f.index !== rendered.index || f.count < rendered.count) {
      // new scene (or loop): clear the thread
      while (messages.children.length > 1) messages.removeChild(messages.lastChild as Node);
      rendered.index = f.index;
      rendered.count = 0;
      rendered.reaction = null;
      typingRow = null;
      tapback = null;
      if (waves) waves.style.filter = `hue-rotate(${(1.2 * f.index).toFixed(1)}deg)`;
    }
    if (f.typing !== rendered.typing || (f.typing && !typingRow)) {
      if (typingRow) {
        typingRow.remove();
        typingRow = null;
      }
      if (f.typing) {
        typingRow = el("div", "message-row incoming typing-row");
        typingRow.appendChild(miniAvatar(cfg));
        const b = el("div", "bubble typing");
        b.setAttribute("aria-label", "typing");
        b.appendChild(el("i"));
        b.appendChild(el("i"));
        b.appendChild(el("i"));
        typingRow.appendChild(b);
        messages.appendChild(typingRow);
      }
      rendered.typing = f.typing;
    }
    while (rendered.count < f.count) {
      if (typingRow) {
        typingRow.remove();
        typingRow = null;
        rendered.typing = false;
      }
      const i = rendered.count;
      messages.appendChild(rowFor(cfg, scene.messages[i], i === scene.messages.length - 1, animate));
      rendered.count++;
    }
    if (f.reaction !== rendered.reaction) {
      if (tapback) {
        tapback.remove();
        tapback = null;
      }
      if (f.reaction) {
        const last = messages.querySelector<HTMLElement>(".message-row:last-child .bubble");
        if (last) {
          tapback = el("span", "tapback", f.reaction);
          tapback.setAttribute("role", "img");
          last.appendChild(tapback);
        }
      }
      rendered.reaction = f.reaction;
    }
    if (ambient && f.brighten !== rendered.brighten) {
      ambient.classList.toggle("complete", f.brighten);
      rendered.brighten = f.brighten;
    }
    if (f.phase !== rendered.phase) {
      rendered.phase = f.phase;
      if (f.phase === "typing" || f.phase === "conversation") messages.scrollTo({ top: 0, behavior: "auto" });
    }
    if (f.count > 0 || f.typing) messages.scrollTo({ top: messages.scrollHeight, behavior: animate ? "smooth" : "auto" });
  };

  if (reduced) {
    const d = durs[0];
    const f = frameAt(cfg, d.typeMs + FIRST_MS + STEP_MS * (cfg.scenes[0].messages.length - 1) + 600, durs);
    render({ ...f, index: 0, text: cfg.scenes[0].word, phase: "conversation" }, false);
    if (cursor) cursor.style.animation = "none";
    if (toggle) toggle.hidden = true;
    return () => {};
  }

  let elapsed = 0;
  let last = 0;
  let raf = 0;
  let userPaused = false;
  let launched = false;
  const paused = () => userPaused || launched || document.hidden;
  const setPausedClass = () => root.classList.toggle("motion-paused", paused());
  const tick = (now: number) => {
    if (!paused()) {
      elapsed += Math.min(now - last, 100);
      render(frameAt(cfg, elapsed, durs), true);
    }
    last = now;
    raf = requestAnimationFrame(tick);
  };
  const onVis = () => {
    setPausedClass();
    last = performance.now();
  };
  document.addEventListener("visibilitychange", onVis);
  if (toggle) {
    toggle.addEventListener("click", () => {
      userPaused = !userPaused;
      toggle.setAttribute("aria-pressed", String(userPaused));
      toggle.setAttribute("aria-label", userPaused ? "Play animation" : "Pause animation");
      toggle.classList.toggle("is-paused", userPaused);
      setPausedClass();
      last = performance.now();
    });
  }
  const api = {
    launch() {
      launched = true;
      setPausedClass();
    },
    resume() {
      launched = false;
      userPaused = false;
      setPausedClass();
      last = performance.now();
    },
  };
  (root as HTMLElement & { __hbx?: typeof api }).__hbx = api;
  render(frameAt(cfg, 0, durs), false);
  last = performance.now();
  raf = requestAnimationFrame(tick);
  setPausedClass();
  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener("visibilitychange", onVis);
  };
}
