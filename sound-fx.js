// Programmatic Web Audio Synthesizer for Confection3D
// Generates premium audio cues client-side with zero audio file loads

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. Subtle click/tap sound
export function playClick() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    // Fast frequency sweep down
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    // Audio context blocks if user hasn't interacted yet
  }
}

// 2. Click checkbox/topping pluck sound
export function playToppingPluck() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'triangle';
    // Cute high pluck
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch (e) {}
}

// 3. Slide drawer swoosh sound
export function playSwoosh() {
  try {
    const ctx = getAudioContext();
    
    // Create soft noise sweep
    const bufferSize = ctx.sampleRate * 0.25; // 250ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Fill buffer with white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter sweep (lowpass)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.2);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 0.26);
  } catch (e) {}
}

// 4. Cash register chime on success
export function playSuccessRegister() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Two-tone bell chord
    const playBell = (freq, delay, duration, volume) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + delay + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
      
      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.05);
    };

    // Satisfying "Clink-clink" sound
    playBell(987.77, 0.0, 0.25, 0.08); // B5 note
    playBell(1318.51, 0.06, 0.45, 0.08); // E6 note
  } catch (e) {}
}

// 5. Oven timer bell sound on baking done
export function playOvenDing() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Clear bell ding
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, now); // A6 bell tone

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.start(now);
    osc.stop(now + 0.85);
  } catch (e) {}
}
