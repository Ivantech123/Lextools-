
export const AudioService = {
  ctx: null as AudioContext | null,
  muted: false,

  init: () => {
    if (!AudioService.ctx) {
      AudioService.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  },

  setMuted: (isMuted: boolean) => {
    AudioService.muted = isMuted;
  },

  play: (type: 'click' | 'success' | 'delete' | 'notification' | 'hover' | 'shutter' | 'swipe' | 'open' | 'keyboard') => {
    if (AudioService.muted) return;
    try {
      if (!AudioService.ctx) AudioService.init();
      const ctx = AudioService.ctx!;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      switch (type) {
        case 'click':
          // Crisp, high-tech click
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        
        case 'open':
           // Soft whoosh up
           osc.type = 'sine';
           osc.frequency.setValueAtTime(300, now);
           osc.frequency.linearRampToValueAtTime(500, now + 0.3);
           gain.gain.setValueAtTime(0, now);
           gain.gain.linearRampToValueAtTime(0.03, now + 0.1);
           gain.gain.linearRampToValueAtTime(0, now + 0.3);
           osc.start(now);
           osc.stop(now + 0.3);
           break;

        case 'success':
          // Pleasant major chord arpeggio
          const playNote = (freq: number, delay: number) => {
             const o = ctx.createOscillator();
             const g = ctx.createGain();
             o.connect(g);
             g.connect(ctx.destination);
             o.type = 'sine';
             o.frequency.value = freq;
             g.gain.setValueAtTime(0, now + delay);
             g.gain.linearRampToValueAtTime(0.05, now + delay + 0.05);
             g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);
             o.start(now + delay);
             o.stop(now + delay + 0.4);
          };
          playNote(523.25, 0); // C5
          playNote(659.25, 0.08); // E5
          playNote(783.99, 0.16); // G5
          break;

        case 'delete':
          // Descending "removal" sound
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
          break;

        case 'shutter':
          // Camera shutter mechanical sound
          const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < noiseBuffer.length; i++) {
              output[i] = Math.random() * 2 - 1;
          }
          const whiteNoise = ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          const noiseGain = ctx.createGain();
          whiteNoise.connect(noiseGain);
          noiseGain.connect(ctx.destination);
          
          noiseGain.gain.setValueAtTime(0.1, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          whiteNoise.start(now);
          whiteNoise.stop(now + 0.1);

          osc.type = 'square';
          osc.frequency.setValueAtTime(800, now);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
          break;

        case 'swipe':
           // Airy woosh
           osc.type = 'sine';
           osc.frequency.setValueAtTime(200, now);
           osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);
           gain.gain.setValueAtTime(0, now);
           gain.gain.linearRampToValueAtTime(0.02, now + 0.1);
           gain.gain.linearRampToValueAtTime(0, now + 0.2);
           osc.start(now);
           osc.stop(now + 0.2);
           break;

        case 'keyboard':
            // Subtle click
            osc.type = 'triangle';
            // Randomize pitch slightly for realism
            const pitch = 1200 + Math.random() * 400;
            osc.frequency.setValueAtTime(pitch, now);
            gain.gain.setValueAtTime(0.02, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
            osc.start(now);
            osc.stop(now + 0.03);
            break;

        default:
          break;
      }
    } catch (e) {
      // Audio autoplay restrictions might block this initially
    }
  }
};
