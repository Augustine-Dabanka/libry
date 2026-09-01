// Tiny synthesized sound effects (no asset files). Called from user gestures,
// so autoplay policies allow them. Fails silently where WebAudio is unavailable.
type WinAudio = typeof window & { webkitAudioContext?: typeof AudioContext };

export function playPop(): void {
  try {
    const w = window as WinAudio;
    const AC = w.AudioContext || w.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(620, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1180, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.14, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.26);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.27);
    o.onended = () => ctx.close();
  } catch {
    /* no audio available */
  }
}
