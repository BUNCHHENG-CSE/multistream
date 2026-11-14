"use client";

export type SoundscapeType = "off" | "space" | "rain" | "vinyl" | "brown";

export interface SoundscapePresetMeta {
  id: SoundscapeType;
  label: string;
  description: string;
}

export const SOUNDSCAPE_PRESETS: SoundscapePresetMeta[] = [
  {
    id: "off",
    label: "Off",
    description: "No ambient soundscape layer",
  },
  {
    id: "space",
    label: "Space Drone",
    description: "Warm sub-bass cosmic pad",
  },
  {
    id: "rain",
    label: "Studio Rain",
    description: "Soft stereo rainfall ambience",
  },
  {
    id: "vinyl",
    label: "Vinyl Warmth",
    description: "Lo-fi crackle & room tone",
  },
  {
    id: "brown",
    label: "Brown Focus",
    description: "Deep low-pass focus noise",
  },
];

interface ActiveAudioGraph {
  masterGain: GainNode;
  cleanup: () => void;
}

class StudioSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private activeGraph: ActiveAudioGraph | null = null;
  private currentType: SoundscapeType = "off";
  private currentVolume = 35;

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private createNoiseBuffer(
    ctx: AudioContext,
    seconds: number,
    mode: "pink" | "brown" | "vinyl"
  ): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      if (mode === "pink") {
        let b0 = 0;
        let b1 = 0;
        let b2 = 0;
        let b3 = 0;
        let b4 = 0;
        let b5 = 0;
        let b6 = 0;
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
          b6 = white * 0.115926;
        }
      } else if (mode === "brown") {
        let lastOut = 0;
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 0.9;
        }
      } else {
        // Vinyl warmth + soft random crackles
        let lastOut = 0;
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.03 * white) / 1.03;
          let crackle = 0;
          if (Math.random() < 0.0018) {
            crackle = (Math.random() * 2 - 1) * 0.45;
          }
          data[i] = lastOut * 0.25 + crackle;
        }
      }
    }

    return buffer;
  }

  private buildGraph(ctx: AudioContext, type: Exclude<SoundscapeType, "off">): ActiveAudioGraph {
    const masterGain = ctx.createGain();
    const targetGain = (this.currentVolume / 100) * 0.45;
    masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, targetGain),
      ctx.currentTime + 0.45
    );
    masterGain.connect(ctx.destination);

    const stopFns: Array<() => void> = [];

    if (type === "space") {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 320;
      filter.Q.value = 1.4;
      filter.connect(masterGain);

      const freqs = [55, 82.41, 110.2, 164.81];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = idx % 2 === 0 ? "sine" : "triangle";
        osc.frequency.value = f;
        oscGain.gain.value = idx === 0 ? 0.35 : 0.14;
        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        stopFns.push(() => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        });
      });

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = "sine";
      lfo.frequency.value = 0.08;
      lfoGain.gain.value = 130;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      stopFns.push(() => {
        try {
          lfo.stop();
          lfo.disconnect();
        } catch {}
      });
    } else if (type === "rain") {
      const source = ctx.createBufferSource();
      source.buffer = this.createNoiseBuffer(ctx, 4, "pink");
      source.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.value = 1100;
      bandpass.Q.value = 0.45;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 3400;

      source.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(masterGain);
      source.start();

      stopFns.push(() => {
        try {
          source.stop();
          source.disconnect();
        } catch {}
      });
    } else if (type === "vinyl") {
      const source = ctx.createBufferSource();
      source.buffer = this.createNoiseBuffer(ctx, 5, "vinyl");
      source.loop = true;

      const highpass = ctx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 180;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 4200;

      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(masterGain);
      source.start();

      stopFns.push(() => {
        try {
          source.stop();
          source.disconnect();
        } catch {}
      });
    } else if (type === "brown") {
      const source = ctx.createBufferSource();
      source.buffer = this.createNoiseBuffer(ctx, 4, "brown");
      source.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 480;

      source.connect(lowpass);
      lowpass.connect(masterGain);
      source.start();

      stopFns.push(() => {
        try {
          source.stop();
          source.disconnect();
        } catch {}
      });
    }

    return {
      masterGain,
      cleanup: () => {
        stopFns.forEach((fn) => fn());
        try {
          masterGain.disconnect();
        } catch {}
      },
    };
  }

  public update(type: SoundscapeType, volume: number): void {
    this.currentVolume = Math.max(0, Math.min(100, volume));

    if (type === "off") {
      this.stop();
      this.currentType = "off";
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx) return;

    if (this.currentType !== type || !this.activeGraph) {
      this.stop();
      this.currentType = type;
      this.activeGraph = this.buildGraph(ctx, type);
      return;
    }

    // Update volume smoothly on existing active graph
    const targetGain = (this.currentVolume / 100) * 0.45;
    this.activeGraph.masterGain.gain.setTargetAtTime(
      Math.max(0.0001, targetGain),
      ctx.currentTime,
      0.08
    );
  }

  public stop(): void {
    if (!this.activeGraph) return;
    const prev = this.activeGraph;
    this.activeGraph = null;
    if (this.ctx) {
      try {
        prev.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
      } catch {}
      window.setTimeout(() => prev.cleanup(), 180);
    } else {
      prev.cleanup();
    }
  }
}

export const soundscapeEngine = new StudioSoundscapeEngine();
