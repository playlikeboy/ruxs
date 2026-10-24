"use client";

/**
 * A light vibration (where the phone supports it) and a soft tick on taps.
 * Each person can turn it off; the choice is remembered on this device.
 */
const KEY = "ruxs_tap_feedback";
let audio: AudioContext | null = null;

export function tapFeedbackEnabled() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setTapFeedback(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* private mode: stays on for this visit */
  }
}

function tick() {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  audio ??= new Ctx();
  if (audio.state === "suspended") void audio.resume();
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1150, now);
  osc.frequency.exponentialRampToValueAtTime(700, now + 0.04);
  gain.gain.setValueAtTime(0.035, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.06);
}

export function tapFeedback(strong = false) {
  if (!tapFeedbackEnabled()) return;
  try {
    navigator.vibrate?.(strong ? [12, 30, 12] : 8);
    tick();
  } catch {
    /* feedback is a nicety; never break a tap */
  }
}
