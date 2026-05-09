import { initSmoothScroll, lenis } from "./scroll.js";
import { initAnimations } from "./animations.js";

function syncLenisWithScrollTrigger() {
  if (!lenis || typeof ScrollTrigger === "undefined") return;
  lenis.on("scroll", ScrollTrigger.update);
}

function init() {
  initSmoothScroll();
  syncLenisWithScrollTrigger();
  initAnimations();

  // Recalcula triggers cuando carguen fuentes para evitar saltos de layout.
  if (typeof ScrollTrigger !== "undefined" && document.fonts?.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

init();
