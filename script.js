document.addEventListener("DOMContentLoaded", () => {
  const playBtn = document.getElementById("btn-nube");
  if (!playBtn) {
    console.error('No se encontró el elemento con id "btn-nube" en el DOM.');
    return;
  }

  let soundFiles = [];
  let currentAudio = null;
  let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let gainNode = audioCtx.createGain();

  gainNode.connect(audioCtx.destination);

  // Cargar audios desde audios.json
  fetch("audios.json")
    .then(response => {
      if (!response.ok) throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      return response.json();
    })
    .then(data => {
      soundFiles = data.map(p => (p.startsWith("audios/") ? p : `audios/${p}`));
      console.log("Audios cargados:", soundFiles);
    })
    .catch(err => console.error("Error cargando audios.json:", err));

  function playRandomSound() {
    if (soundFiles.length === 0) {
      console.warn("No hay audios cargados todavía.");
      return;
    }

    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    const randomIndex = Math.floor(Math.random() * soundFiles.length);
    const src = soundFiles[randomIndex];

    currentAudio = new Audio(src);

    currentAudio.addEventListener("loadedmetadata", () => {
      const duration = currentAudio.duration;
      const maxStart = Math.max(duration - 22, 0);
      const startTime = Math.random() * maxStart;
      currentAudio.currentTime = startTime;

      const track = audioCtx.createMediaElementSource(currentAudio);
      track.connect(gainNode);

      const now = audioCtx.currentTime;
      const fadeOutDuration = 0.5; // 0.5 segundos fade out

      // Fade-in rápido
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(1, now + 0.01);

      // Mantener volumen completo hasta los últimos 0.5s
      gainNode.gain.setValueAtTime(1, now + 22 - fadeOutDuration);
      // Fade-out
      gainNode.gain.linearRampToValueAtTime(0, now + 22);

      currentAudio.play()
        .then(() => console.log(`Reproduciendo clip de 22s de: ${src}`))
        .catch(e => console.error("Error al reproducir el audio:", e));

      // Detener manualmente al final
      setTimeout(() => {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }, 33000);
    });
  }

  playBtn.addEventListener("click", () => {
    if (audioCtx.state !== "running") audioCtx.resume();
    playRandomSound();
  });
});

/* ===== Smoke particles dentro de #hero ===== */
(function () {
  if (window.__smokeParticlesInitialized) return;
  window.__smokeParticlesInitialized = true;

  // crea canvas si no existe
  let canvas = document.getElementById('particlesCanvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'particlesCanvas';
    document.body.insertBefore(canvas, document.body.firstChild);
  }
  canvas.style.pointerEvents = 'none';
  canvas.style.position = 'fixed';
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.zIndex = 2;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let cssW = 0, cssH = 0, dpr = 1;
  const MAX_PARTICLES = 300;
  const SPAWN_PER_MOVE = 3;

  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    cssW = window.innerWidth;
    cssH = window.innerHeight;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resizeCanvas);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', resizeCanvas);
  } else {
    resizeCanvas();
  }

  class Particle {
    constructor(x, y) {
      this.x = x + (Math.random() - 0.5) * 20;
      this.y = y + (Math.random() - 0.5) * 8;
      this.baseSize = Math.random() * 4 + 2;
      this.size = this.baseSize;
      this.vx = (Math.random() - 0.5) * 0.6;
      this.vy = - (Math.random() * 0.6 + 0.2);
      this.alpha = 0.55 + Math.random() * 0.35;
      this.decay = 0.004 + Math.random() * 0.012;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
      this.size += 0.02;
    }

    draw() {
      const radius = Math.max(1, this.size * 3);
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radius);
      g.addColorStop(0, `rgba(255,255,255, ${Math.min(1, this.alpha)})`);
      g.addColorStop(1, `rgba(255,255,255, 0)`);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // generar partículas solo dentro de #hero visible
  function onMove(e) {
    const fondoElement = document.getElementById("hero");
    if (!fondoElement) return;

    const rect = fondoElement.getBoundingClientRect();

    // Verifica visibilidad de #hero
    const visible = rect.top < window.innerHeight && rect.bottom > 0;
    if (!visible) return;

    // Verifica que el mouse esté dentro de #hero
    const inside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;

    if (!inside) return;

    for (let i = 0; i < SPAWN_PER_MOVE; i++) {
      particles.push(new Particle(e.clientX, e.clientY));
    }
    if (particles.length > MAX_PARTICLES) {
      particles.splice(0, particles.length - MAX_PARTICLES);
    }
  }

  window.addEventListener('mousemove', onMove);

  function animate() {
    ctx.clearRect(0, 0, cssW, cssH);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw();
      if (p.alpha <= 0 || p.y + p.size * 3 < -50) {
        particles.splice(i, 1);
      }
    }
    requestAnimationFrame(animate);
  }

  animate();
})();
