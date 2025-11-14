particlesJS("particles-js", {
  particles: {
    number: {
      value: 180,
      density: { enable: true, value_area: 800 },
    },
    color: {
      value: ["#ffffff", "#ff4500", "#1e90ff", "#9400d3"],
    },
    shape: {
      type: ["circle", "edge"],
    },
    opacity: {
      value: 0.5,
      random: true,
      anim: {
        enable: true,
        speed: 0.5,
        opacity_min: 0.2,
        sync: false,
      },
    },
    size: {
      value: 1.5,
      random: true,
      anim: {
        enable: true,
        speed: 1,
        size_min: 0.2,
        sync: false,
      },
    },
    line_linked: {
      enable: false,
    },
    move: {
      enable: true,
      speed: 0.8,
      direction: "none",
      random: true,
      straight: false,
      out_mode: "out",
      bounce: false,
      attract: {
        enable: true,
        rotateX: 800,
        rotateY: 1600,
      },
    },
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: {
        enable: true,
        mode: "bubble",
      },
      onclick: {
        enable: true,
        mode: "repulse",
      },
      resize: true,
    },
    modes: {
      bubble: {
        distance: 200,
        size: 1.5,
        duration: 1,
        opacity: 0.8,
        speed: 2,
      },
      repulse: {
        distance: 120,
        duration: 0.6,
      },
    },
  },
  retina_detect: true,
});

// Debounce function
const debounce = (func, delay) => {
  let debounceTimer;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
};

// Enhanced Mouse Interaction
document.addEventListener(
  "mousemove",
  debounce((event) => {
    const x = event.clientX;
    const y = event.clientY;

    if (typeof pJSDom !== "undefined" && pJSDom.length > 0) {
      pJSDom[0].pJS.particles.array.forEach((particle) => {
        const dx = particle.x - x;
        const dy = particle.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          particle.vx = dx * 0.015;
          particle.vy = dy * 0.015;
        }
      });
    }
  }, 10)
);
