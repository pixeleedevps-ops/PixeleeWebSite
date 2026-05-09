export let lenis;

export function initSmoothScroll() {
  if (!window.Lenis) {
    console.warn("Lenis no está cargado");
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  lenis = new Lenis({
    lerp: 0.045,
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 0.65,
    touchMultiplier: 1.2,
    gestureOrientation: "vertical"
  });

  if (window.ScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
}