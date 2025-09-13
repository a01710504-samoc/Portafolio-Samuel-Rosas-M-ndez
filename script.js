document.addEventListener("DOMContentLoaded", () => {
  const playBtn = document.getElementById("playBtn");
  if (!playBtn) {
    console.error('No se encontró el elemento con id "playBtn" en el DOM.');
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
      }, 22000);
    });
  }

  playBtn.addEventListener("click", () => {
    if (audioCtx.state !== "running") audioCtx.resume();
    playRandomSound();
  });
});

