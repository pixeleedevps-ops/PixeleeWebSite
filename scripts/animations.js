(function () {
  const SCRAMBLE_CHARS = "01233456789";
  const BRAND_NAME = "Pixelee";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isMobileViewport = () => window.matchMedia("(max-width: 768px)").matches;
  const prefersCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const lowCpuDevice = (navigator.hardwareConcurrency || 8) <= 4;
  const lowMemoryDevice = (navigator.deviceMemory || 8) <= 4;
  const useLiteMode = lowCpuDevice || lowMemoryDevice || prefersCoarsePointer;
  const heroParticleTweens = [];
  const heroParticleElements = [];
  let heroParticleResumeTimer = 0;
  let areHeroParticlesVisible = true;
  let areHeroParticlesPaused = false;

  function setHeroParticleTweensPaused(isPaused) {
    if (areHeroParticlesPaused === isPaused) return;
    areHeroParticlesPaused = isPaused;
    heroParticleTweens.forEach((tween) => {
      if (isPaused) tween.pause();
      else tween.resume();
    });
    heroParticleElements.forEach((particle) => {
      if (!particle._roamTween) return;
      if (isPaused) particle._roamTween.pause();
      else particle._roamTween.resume();
    });
  }

  function pauseHeroParticlesDuringScroll() {
    if (!heroParticleTweens.length || reduceMotion.matches) return;
    window.clearTimeout(heroParticleResumeTimer);
    setHeroParticleTweensPaused(true);
    heroParticleResumeTimer = window.setTimeout(() => {
      if (areHeroParticlesVisible) setHeroParticleTweensPaused(false);
    }, 140);
  }

  function initGsapRuntime() {
    if (typeof gsap === "undefined") return;
    gsap.config({
      autoSleep: 60,
      force3D: true,
      nullTargetWarn: false
    });
    gsap.ticker.lagSmoothing(500, 33);
  }

  function randomText(length) {
    let value = "";

    for (let i = 0; i < length; i += 1) {
      value += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
    }

    return value;
  }

  function buildScrambleFrame(target, progress) {
    const revealCount = Math.floor(progress * target.length);
    let output = "";

    for (let i = 0; i < target.length; i += 1) {
      output += i < revealCount ? target[i] : randomText(1);
    }

    return output;
  }

  function runPreloader() {
    const preloader = document.getElementById("preloader");
    if (!preloader) return Promise.resolve();

    const scrambleEl = preloader.querySelector(".preloader__scramble");
    const brandEl = preloader.querySelector(".preloader__brand");
    const progressEl = preloader.querySelector("#preloader-progress");
    const percentEl = preloader.querySelector("#preloader-percent");

    const setProgress = (value) => {
      if (progressEl) progressEl.style.width = `${value}%`;
      if (percentEl) percentEl.textContent = `${value}%`;
    };

    if (!scrambleEl || !brandEl || typeof gsap === "undefined") {
      preloader.remove();
      return Promise.resolve();
    }

    let preloaderFinished = false;
    const finishPreloader = () => {
      if (preloaderFinished) return;
      preloaderFinished = true;
      preloader.remove();
      document.body.style.overflow = "";
    };

    document.body.style.overflow = "hidden";

    if (reduceMotion.matches) {
      scrambleEl.textContent = BRAND_NAME;
      scrambleEl.style.opacity = "0";
      brandEl.style.opacity = "1";
      setProgress(100);
      finishPreloader();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const state = { progress: 0, percent: 0 };
      const preloaderFallback = window.setTimeout(() => {
        finishPreloader();
        resolve();
      }, 6000);

      setProgress(0);

      gsap
        .timeline({
          defaults: { ease: "power3.out" },
          onComplete: () => {
            window.clearTimeout(preloaderFallback);
            finishPreloader();
            resolve();
          }
        })
        .to(state, {
          progress: 1,
          percent: 100,
          duration: 1.15,
          ease: "none",
          onUpdate: () => {
            scrambleEl.textContent = buildScrambleFrame(BRAND_NAME, state.progress);
            setProgress(Math.round(state.percent));
          }
        })
        .to(scrambleEl, { opacity: 0, duration: 0.2 }, "-=0.1")
        .to(brandEl, { opacity: 1, duration: 0.28 }, "<")
        .to(preloader, { opacity: 0, duration: 0.38, delay: 0.16 });
    });
  }

  function wrapWords(element, className) {
    const text = element.textContent.trim().replace(/\s+/g, " ");
    const words = text.split(" ");

    element.setAttribute("aria-label", text);
    element.textContent = "";

    return words.map((word, index) => {
      const span = document.createElement("span");
      span.className = className;
      span.dataset.text = word;
      span.setAttribute("aria-hidden", "true");
      span.textContent = word;

      element.appendChild(span);

      if (index < words.length - 1) {
        element.appendChild(document.createTextNode(" "));
      }

      return span;
    });
  }

  function lockWordWidths(words) {
    words.forEach((word) => {
      word.style.minWidth = `${word.offsetWidth}px`;
    });
  }

  function scrambleWord(element, duration) {
    const original = element.dataset.text;
    const state = { progress: 0 };
    let lastUpdate = 0;
    const updateGap = useLiteMode ? 120 : 80;

    gsap.to(state, {
      progress: 1,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        const now = performance.now();

        if (state.progress < 0.88 && now - lastUpdate > updateGap) {
          element.textContent = randomText(original.length);
          lastUpdate = now;
        } else if (state.progress >= 0.88) {
          element.textContent = original;
        }
      },
      onComplete: () => {
        element.textContent = original;
      }
    });
  }

  function createTypeSound() {
    const audio = new Audio("assets/audio/keyboard-typing.mp3");
    audio.preload = "auto";
    audio.volume = 0.22;
    const startOffset = 0.18;
    const maxDuration = 1.9;
    let stopTimer = 0;
    let fadeTimer = 0;

    return {
      prime: () => {
        audio.load();
      },
      play: () => {
        if (reduceMotion.matches) return;

        try {
          window.clearTimeout(stopTimer);
          window.clearInterval(fadeTimer);
          audio.pause();
          audio.volume = 0.22;
          audio.currentTime = Number.isFinite(audio.duration)
            ? Math.min(startOffset, Math.max(0, audio.duration - 0.05))
            : startOffset;
          audio.play().catch(() => {});
          stopTimer = window.setTimeout(() => {
            const fadeSteps = 8;
            let currentStep = 0;

            fadeTimer = window.setInterval(() => {
              currentStep += 1;
              audio.volume = Math.max(0, 0.22 * (1 - currentStep / fadeSteps));

              if (currentStep >= fadeSteps) {
                window.clearInterval(fadeTimer);
              }
            }, 22);

            window.setTimeout(() => {
              audio.pause();
              audio.volume = 0.22;
            }, 210);
          }, maxDuration * 1000);
        } catch (error) {
          // Browsers may block autoplaying audio until the user interacts.
        }
      }
    };
  }

  function initHeaderHoverSound() {
    const navItems = document.querySelectorAll('.site-header .nav > a:not([href^="mailto:"]), .site-header .nav-services__trigger');

    if (!navItems.length) return;

    let audioContext = null;
    let lastPlayTime = 0;

    const getAudioContext = () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return null;
      if (!audioContext) audioContext = new AudioContextClass();

      return audioContext;
    };

    const playHoverSound = () => {
      const now = performance.now();

      if (now - lastPlayTime < 110) return;
      lastPlayTime = now;

      try {
        const context = getAudioContext();

        if (!context) return;
        if (context.state === "suspended") context.resume();

        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startTime = context.currentTime;

        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(780, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(1180, startTime + 0.055);
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.045, startTime + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.09);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.095);
      } catch (error) {
        // Some browsers can still block audio until the first direct interaction.
      }
    };

    navItems.forEach((item) => {
      if (item.dataset.hoverSoundReady === "true") return;

      item.dataset.hoverSoundReady = "true";
      item.addEventListener("pointerenter", playHoverSound);
      item.addEventListener("focus", playHoverSound);
    });
  }

  function initContactCtaEffects() {
    const contactButtons = document.querySelectorAll('a[href^="mailto:"]');

    if (!contactButtons.length) return;

    const audio = new Audio("assets/audio/chutter-click-494024.mp3");
    audio.preload = "auto";
    audio.volume = 0.28;
    let lastPlayTime = 0;

    const playContactSound = () => {
      const now = performance.now();

      if (reduceMotion.matches || now - lastPlayTime < 140) return;
      lastPlayTime = now;

      try {
        audio.pause();
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } catch (error) {
        // Browsers may block hover audio until the user interacts with the page.
      }
    };

    contactButtons.forEach((button) => {
      if (button.dataset.contactCtaReady === "true") return;

      button.dataset.contactCtaReady = "true";

      const enter = () => {
        button.classList.remove("is-cta-leaving");
        button.classList.add("is-cta-hovering");
        playContactSound();
      };

      const leave = () => {
        button.classList.remove("is-cta-hovering");
        button.classList.add("is-cta-leaving");
      };

      button.addEventListener("pointerenter", enter);
      button.addEventListener("pointerleave", leave);
      button.addEventListener("focus", enter);
      button.addEventListener("blur", leave);
    });
  }

  function animateAboutHeroTitle() {
    const title = document.querySelector(".about-hero__title, .page-scramble-title");
    const hero = title ? title.closest(".about-hero, .service-hero") : null;
    const eyebrow = hero ? hero.querySelector(".eyebrow") : null;
    const subtitle = hero
      ? hero.querySelector(".about-hero__copy p:last-child, .service-hero__copy p:last-child")
      : null;
    const photo = hero ? hero.querySelector(".about-hero__photo, .service-hero__panel") : null;

    if (!title || typeof gsap === "undefined") return;

    const titleWords = wrapWords(title, "scramble-word");
    const typeSound = createTypeSound();

    lockWordWidths(titleWords);
    typeSound.prime();

    if (reduceMotion.matches) {
      gsap.set([eyebrow, titleWords, subtitle, photo], {
        opacity: 1,
        y: 0,
        scale: 1
      });
      return;
    }

    gsap.set(eyebrow, { opacity: 0, y: 12 });
    gsap.set(titleWords, {
      opacity: 0,
      y: 36,
      scale: 0.98
    });
    gsap.set(subtitle, { opacity: 0, y: 18 });
    gsap.set(photo, {
      opacity: 0,
      y: 44,
      scale: 0.97,
      filter: "blur(10px)"
    });

    const timeline = gsap.timeline({
      defaults: { ease: "power4.out" },
      delay: 0.18
    });

    timeline.to(eyebrow, {
      opacity: 1,
      y: 0,
      duration: 0.35
    });

    timeline.call(() => typeSound.play(), null, 0.08);

    titleWords.forEach((word, index) => {
      timeline.to(
        word,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.24,
          onStart: () => {
            scrambleWord(word, useLiteMode ? 0.55 : 0.78);
          }
        },
        0.18 + index * (useLiteMode ? 0.14 : 0.18)
      );
    });

    timeline
      .to(subtitle, {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: "power3.out"
      }, "+=0.04")
      .to(photo, {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.72,
        ease: "power3.out"
      }, "<0.08");
  }

  function initMobileNav() {
    const header = document.querySelector(".site-header");
    const toggle = header ? header.querySelector(".nav-toggle") : null;
    const nav = header ? header.querySelector(".nav") : null;

    if (!header || !toggle || !nav) return;

    if (!nav.id) nav.id = "site-navigation";
    toggle.setAttribute("aria-controls", nav.id);

    const mobileQuery = window.matchMedia("(max-width: 960px)");

    const closeMenu = () => {
      header.classList.remove("is-nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menú");
      header.querySelectorAll(".nav-services.is-open").forEach((menu) => {
        menu.classList.remove("is-open");
        menu.querySelector(".nav-services__trigger")?.setAttribute("aria-expanded", "false");
      });
    };

    const openMenu = () => {
      header.classList.add("is-nav-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Cerrar menú");
    };

    toggle.addEventListener("click", () => {
      if (header.classList.contains("is-nav-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    nav.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (!link || link.classList.contains("nav-services__trigger")) return;
      if (mobileQuery.matches) closeMenu();
    });

    nav.querySelectorAll(".nav-services__trigger").forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        if (!mobileQuery.matches) return;

        event.preventDefault();

        const menu = trigger.closest(".nav-services");
        const panel = menu?.querySelector(".mega-menu");
        panel?.removeAttribute("style");
        panel?.querySelectorAll(".mega-menu__grid a").forEach((item) => item.removeAttribute("style"));

        const isOpen = menu?.classList.toggle("is-open");
        trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    mobileQuery.addEventListener("change", (event) => {
      if (!event.matches) closeMenu();
    });
  }

  function initMegaMenu() {
  if (typeof gsap === "undefined") return;

  document.querySelectorAll("[data-mega-menu]").forEach((menu) => {
    if (menu.dataset.megaReady === "true") return;

    const trigger = menu.querySelector(".nav-services__trigger");
    const panel = menu.querySelector(".mega-menu");
    const items = panel ? panel.querySelectorAll(".mega-menu__grid a") : [];

    if (!trigger || !panel) return;

    menu.dataset.megaReady = "true";

    const isCenteredLayout = () => !window.matchMedia("(max-width: 960px)").matches;
    let closeTimer = 0;

    gsap.set(panel, {
      autoAlpha: 0,
      xPercent: isCenteredLayout() ? -50 : 0,
      y: 14,
      scale: 0.98,
      pointerEvents: "none"
    });

    gsap.set(items, {
      autoAlpha: 0,
      y: 12
    });

    const openMenu = () => {
      window.clearTimeout(closeTimer);
      menu.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");

      gsap.to(panel, {
        autoAlpha: 1,
        xPercent: isCenteredLayout() ? -50 : 0,
        y: 0,
        scale: 1,
        pointerEvents: "auto",
        duration: 0.28,
        ease: "power3.out",
        overwrite: "auto"
      });

      gsap.to(items, {
        autoAlpha: 1,
        y: 0,
        duration: 0.32,
        stagger: 0.045,
        ease: "power3.out",
        overwrite: "auto"
      });
    };

    const closeMenu = () => {
      window.clearTimeout(closeTimer);
      menu.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");

      gsap.to(panel, {
        autoAlpha: 0,
        xPercent: isCenteredLayout() ? -50 : 0,
        y: 14,
        scale: 0.98,
        pointerEvents: "none",
        duration: 0.22,
        ease: "power2.out",
        overwrite: "auto"
      });

      gsap.to(items, {
        autoAlpha: 0,
        y: 12,
        duration: 0.16,
        stagger: 0.025,
        ease: "power2.out",
        overwrite: "auto"
      });
    };

    const scheduleCloseMenu = () => {
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(closeMenu, 180);
    };

    menu.addEventListener("mouseenter", () => {
      if (isCenteredLayout()) openMenu();
    });
    menu.addEventListener("mouseleave", () => {
      if (isCenteredLayout()) scheduleCloseMenu();
    });
    panel.addEventListener("mouseenter", () => {
      if (isCenteredLayout()) openMenu();
    });
    panel.addEventListener("mouseleave", () => {
      if (isCenteredLayout()) scheduleCloseMenu();
    });

    menu.addEventListener("focusin", () => {
      if (isCenteredLayout()) openMenu();
    });
    menu.addEventListener("focusout", (event) => {
      if (isCenteredLayout() && !menu.contains(event.relatedTarget)) scheduleCloseMenu();
    });

    window.addEventListener("resize", () => {
      gsap.set(panel, {
        xPercent: isCenteredLayout() ? -50 : 0
      });
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
        trigger.blur();
      }
    });

  });
}

  function animateHeroContent() {
    const title = document.querySelector(".hero-title");
    const subtitle = document.querySelector(".hero-subtitle");
    const buttons = document.querySelectorAll(".hero-actions .btn");

    if (!title || !subtitle || typeof gsap === "undefined") return;

    const titleWords = wrapWords(title, "scramble-word");
    const typeSound = createTypeSound();
    const subtitleWordCount = subtitle.textContent.trim().split(/\s+/).length;
    const hasSubtitleWordAnimation = !useLiteMode && subtitleWordCount > 0 && subtitleWordCount <= 16;
    const subtitleWords = hasSubtitleWordAnimation ? wrapWords(subtitle, "subtitle-word") : [];

    lockWordWidths(titleWords);
    typeSound.prime();

    if (reduceMotion.matches) {
      gsap.set([titleWords, subtitle, buttons], {
        opacity: 1,
        y: 0,
        scale: 1
      });
      return;
    }

    gsap.set(titleWords, {
      opacity: 0,
      y: 40,
      scale: 0.98
    });

    if (hasSubtitleWordAnimation) {
      gsap.set(subtitleWords, {
        opacity: 0,
        y: 16
      });
    } else {
      gsap.set(subtitle, { opacity: 0, y: 16 });
    }

    gsap.set(buttons, {
      opacity: 0,
      y: 18,
      scale: 0.96
    });

    const timeline = gsap.timeline({
      defaults: {
        ease: "power4.out"
      }
    });

    timeline.call(() => typeSound.play(), null, 0);

    titleWords.forEach((word, index) => {
      timeline.to(
        word,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: useLiteMode ? 0.2 : 0.25,
          onStart: () => scrambleWord(word, useLiteMode ? 0.65 : 0.9)
        },
        index * (useLiteMode ? 0.18 : 0.25)
      );
    });

    if (hasSubtitleWordAnimation) {
      timeline.to(
        subtitleWords,
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.02,
          ease: "power3.out"
        },
        "+=0.08"
      );
    } else {
      timeline.to(
        subtitle,
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: "power3.out",
          clearProps: "transform"
        },
        "+=0.08"
      );
    }

    timeline.to(
        buttons,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          stagger: 0.1,
          ease: "power3.out",
          clearProps: "transform"
        },
        "+=0.08"
      );
  }

  function animateHeroColumnsOnScroll() {
    if (
      typeof gsap === "undefined" ||
      typeof ScrollTrigger === "undefined" ||
      reduceMotion.matches
    ) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const hero = document.querySelector(".hero");
    const stage = document.querySelector(".hero-stage");
    if (!hero || !stage || stage.dataset.scrollReady === "true") return;
    stage.dataset.scrollReady = "true";

    const columns = gsap.utils.toArray(".hero-stage__column");
    const setters = columns.map((column) => gsap.quickSetter(column, "y", "px"));
    let distances = [];
    const updateDistances = () => {
      const targetBottom = hero.offsetHeight * 1.20;
      distances = columns.map((column) => Math.max(0, targetBottom - column.offsetHeight));
    };
    const getColumnProgress = gsap.utils.clamp(0, 1);

    updateDistances();

    ScrollTrigger.create({
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
      invalidateOnRefresh: true,
      onRefresh: updateDistances,
      onUpdate: (self) => {
        pauseHeroParticlesDuringScroll();
        for (let index = 0; index < setters.length; index += 1) {
          const start = index / columns.length;
          const progress = getColumnProgress((self.progress - start) * columns.length);

          setters[index](distances[index] * progress);
        }
      }
    });
  }

  // Animacion reusable: titulo palabra por palabra con fade de color
  function splitWords(element) {
    if (element.dataset.split === "true") {
      return gsap.utils.toArray(element.querySelectorAll(".word"));
    }

    const text = element.textContent.trim().replace(/\s+/g, " ");
    const fragment = document.createDocumentFragment();

    text.split(" ").forEach((word, index, words) => {
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = word;
      fragment.appendChild(span);

      if (index < words.length - 1) {
        fragment.appendChild(document.createTextNode(" "));
      }
    });

    element.replaceChildren(fragment);
    element.dataset.split = "true";

    return gsap.utils.toArray(element.querySelectorAll(".word"));
  }

  function introWordColorFade({
    sectionSelector,
    titleSelector,
    textSelector,
    titleStart = "top 60%",
    textStart = "top 85%",
    initialColor = "#000",
    highlightColor = "#cef00a",
    finalColor = "#000"
  }) {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    const section = document.querySelector(sectionSelector);
    const title = document.querySelector(titleSelector);
    const text = textSelector ? document.querySelector(textSelector) : null;

    if (!section || !title || title.dataset.introAnimated === "true") return;

    title.dataset.introAnimated = "true";

    const words = splitWords(title);

    gsap.set(words, {
      display: "inline-block",
      opacity: 0,
      y: 120,
      color: initialColor
    });

    if (text) {
      gsap.set(text, {
        opacity: 0,
        y: 80,
        color: initialColor
      });
    }

    const animationTitle = gsap.timeline({
      scrollTrigger: {
        trigger: title,
        start: titleStart,
        toggleActions: "play none none none"
      }
    });

    animationTitle
      .to(words, {
        color: highlightColor,
        y: 0,
        opacity: 1,
        duration: 0.85,
        stagger: {
          each: 0.09,
          from: "start"
        },
        ease: "power3.out"
      })
      .to(words, {
        color: finalColor,
        duration: 0.35,
        stagger: {
          each: 0.06,
          from: "start"
        },
        ease: "power3.out"
      }, "-=0.45");

    if (!text) return;

    const animationText = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: textStart,
        toggleActions: "play none none none"
      }
    });

    animationText
      .to(text, {
        color: highlightColor,
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: "power3.out"
      })
      .to(text, {
        color: finalColor,
        duration: 0.8,
        ease: "power3.out"
      });
  }

  function servicesIntroColorFade() {
    introWordColorFade({
      sectionSelector: ".services-scroll",
      titleSelector: ".services-scroll__intro h2",
      textSelector: ".services-scroll__intro p"
    });
  }

  function clientsTitleColorFade() {
    introWordColorFade({
      sectionSelector: ".clients-showcase",
      titleSelector: ".clients-showcase__head h2",
      finalColor: "#fff"
    });
  }

  function serviceSectionTitlesColorFade() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    const titles = gsap.utils.toArray(".service-page .service-section__head h2, .service-page .service-cta h2");

    titles.forEach((title) => {
      if (title.dataset.introAnimated === "true") return;

      const section = title.closest(".service-section, .service-cta");
      const isDarkSection = section && (
        section.classList.contains("service-section--dark") ||
        section.classList.contains("service-cta")
      );
      const finalColor = isDarkSection ? "#fff" : "#050505";
      const words = splitWords(title);

      title.dataset.introAnimated = "true";

      gsap.set(words, {
        display: "inline-block",
        opacity: 0,
        y: 120,
        color: finalColor
      });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: title,
            start: "top 78%",
            toggleActions: "play none none none"
          }
        })
        .to(words, {
          color: "#cef00a",
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: {
            each: 0.09,
            from: "start"
          },
          ease: "power3.out"
        })
        .to(words, {
          color: finalColor,
          duration: 0.35,
          stagger: {
            each: 0.06,
            from: "start"
          },
          ease: "power3.out"
        }, "-=0.45");
    });
  }

  function initServicesScroll() {
    const section = document.querySelector(".services-scroll");
    const track = document.querySelector(".services-carousel");
    const columns = gsap.utils.toArray(".services-scroll__column");

    if (
      !section ||
      !track ||
      typeof gsap === "undefined" ||
      typeof ScrollTrigger === "undefined"
    ) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const isMobile = window.matchMedia("(max-width: 960px)").matches;

    if (!reduceMotion.matches && !useLiteMode) {
      columns.forEach((column, index) => {
        const shift = index % 2 === 0 ? -24 - index * 4 : -14 - index * 3;

        gsap.to(column, {
          yPercent: shift,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        });
      });
    }

    if (isMobile || reduceMotion.matches) {
      gsap.set(track, { x: 0, clearProps: "transform" });
      return;
    }

    const getDistance = () => {
      const distance = track.scrollWidth - window.innerWidth;
      return distance > 0 ? -distance : 0;
    };

    gsap.to(track, {
      x: getDistance,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${track.scrollWidth}`,
        scrub: true,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  // Initialize the services intro color fade after DOM ready
  function initAll() {
    servicesIntroColorFade && servicesIntroColorFade();
  }

  function initHeroParticles() {
    const hero = document.querySelector(".hero");
    const layer = document.querySelector(".hero-particles");

    if (!hero || !layer || typeof gsap === "undefined" || layer.dataset.ready === "true") return;
    layer.dataset.ready = "true";

    const isMobile = isMobileViewport();
    const count = useLiteMode ? (isMobile ? 20 : 30) : isMobile ? 20 : 40;
    const layerWidth = layer.clientWidth || hero.clientWidth;
    const layerHeight = layer.clientHeight || hero.clientHeight;
    const fragment = document.createDocumentFragment();

    function roamParticle(particle, size) {
      const nextX = gsap.utils.random(0, Math.max(0, layerWidth - size), 1);
      const nextY = gsap.utils.random(0, Math.max(0, layerHeight - size), 1);
      const duration = gsap.utils.random(10, 22, 0.1);

      const roamTween = gsap.to(particle, {
        x: nextX,
        y: nextY,
        duration,
        ease: "sine.inOut",
        onComplete: () => roamParticle(particle, size)
      });

      particle._roamTween = roamTween;
    }

    for (let i = 0; i < count; i += 1) {
      const particle = document.createElement("span");
      particle.className = "hero-particle";

      const size = gsap.utils.random(4, 6, 1);
      const startX = gsap.utils.random(0, Math.max(0, layerWidth - size), 1);
      const startY = gsap.utils.random(0, Math.max(0, layerHeight - size), 1);
      const baseOpacity = gsap.utils.random(0.2, 0.6, 0.01);

      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = "0";
      particle.style.top = "0";
      particle.style.opacity = `${baseOpacity}`;

      fragment.appendChild(particle);
      heroParticleElements.push(particle);

      gsap.set(particle, {
        x: startX,
        y: startY
      });

      if (reduceMotion.matches) continue;

      const fadeDuration = gsap.utils.random(4, 7.2, 0.1);

      roamParticle(particle, size);

      const fadeTween = gsap.to(particle, {
        opacity: gsap.utils.random(0.55, 1, 0.01),
        duration: fadeDuration,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: gsap.utils.random(0, 1.4, 0.01)
      });

      heroParticleTweens.push(fadeTween);
    }

    layer.appendChild(fragment);

    if ("IntersectionObserver" in window) {
      const visibilityObserver = new IntersectionObserver((entries) => {
        const isVisible = entries[0]?.isIntersecting ?? true;
        areHeroParticlesVisible = isVisible;
        setHeroParticleTweensPaused(!isVisible);
      });

      visibilityObserver.observe(hero);
    }
  }

  function initAboutUsVideo() {
    const iframe = document.querySelector(".about-us__media iframe[data-src]");
    if (!iframe) return;

    const loadVideo = () => {
      if (!iframe.src) iframe.src = iframe.dataset.src;
    };

    if (!("IntersectionObserver" in window)) {
      loadVideo();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          loadVideo();
          observer.disconnect();
        }
      },
      { rootMargin: "250px 0px" }
    );

    observer.observe(iframe);
  }

  function splitBenefitWords(element) {
    if (element.dataset.benefitSplit === "true") {
      return gsap.utils.toArray(element.querySelectorAll(".benefit-step__word"));
    }

    const text = element.textContent.trim().replace(/\s+/g, " ");
    const fragment = document.createDocumentFragment();

    element.setAttribute("aria-label", text);
    element.textContent = "";

    text.split(" ").forEach((word, index, words) => {
      const span = document.createElement("span");
      span.className = "benefit-step__word";
      span.setAttribute("aria-hidden", "true");
      span.textContent = word;
      fragment.appendChild(span);

      if (index < words.length - 1) {
        fragment.appendChild(document.createTextNode(" "));
      }
    });

    element.appendChild(fragment);
    element.dataset.benefitSplit = "true";

    return gsap.utils.toArray(element.querySelectorAll(".benefit-step__word"));
  }

  function initBenefitsScrollVideo() {
  const section = document.querySelector(".benefits-section");
  const media = document.querySelector(".benefits-section__media");
  const video = document.querySelector(".benefits-section__video");
  const header = document.querySelector(".site-header");
  const intro = document.querySelector(".benefits-section__intro");
  const content = document.querySelector(".benefits-section__content");
  const steps = gsap.utils.toArray(".benefit-step");

  if (
    !section ||
    !video ||
    !steps.length ||
    typeof gsap === "undefined" ||
    typeof ScrollTrigger === "undefined"
  ) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const thresholds = steps.map((step) => Number(step.dataset.benefitProgress || 0));

  let activeIndex = -1;
  let targetProgress = 0;
  let renderedProgress = 0;
  let rafId = 0;

  const introHold = 0.08;
  const introEnd = 0.23;
  const videoStart = 0.1;
  const videoEnd = 0.82;
  const finalBenefitFadeStart = 0.88;

  const setActiveStep = (nextIndex, immediate = false) => {
    if (nextIndex === activeIndex) return;

    const previousStep = steps[activeIndex];
    activeIndex = nextIndex;

    if (previousStep) {
      previousStep.classList.remove("is-active");

      gsap.to(previousStep, {
        autoAlpha: 0,
        y: -18,
        filter: "blur(6px)",
        duration: immediate ? 0 : 0.32,
        ease: "power2.out",
        onComplete: () => {
          previousStep.style.visibility = "hidden";
        }
      });
    }

    if (nextIndex < 0 || !steps[nextIndex]) return;

    const nextStep = steps[nextIndex];
    nextStep.classList.add("is-active");
    nextStep.style.visibility = "visible";

    const title = nextStep.querySelector("h2");
    const words = title ? splitBenefitWords(title) : [];
    const support = nextStep.querySelectorAll(
      ".benefit-step__number, .benefit-step__lead, p:not(.benefit-step__lead)"
    );

    gsap.killTweensOf([nextStep, words, support]);

    gsap.set(nextStep, {
      autoAlpha: 1,
      y: immediate ? 0 : 28,
      filter: immediate ? "blur(0px)" : "blur(8px)"
    });

    gsap.set(words, {
      autoAlpha: immediate ? 1 : 0,
      y: immediate ? 0 : 24,
      filter: immediate ? "blur(0px)" : "blur(8px)"
    });

    gsap.set(support, {
      autoAlpha: immediate ? 1 : 0,
      y: immediate ? 0 : 18,
      filter: immediate ? "blur(0px)" : "blur(6px)"
    });

    if (immediate || reduceMotion.matches) {
      gsap.set([nextStep, words, support], {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)"
      });
      return;
    }

    gsap
      .timeline({ defaults: { ease: "power3.out" } })
      .to(nextStep, {
        y: 0,
        filter: "blur(0px)",
        duration: 0.46
      })
      .to(
        words,
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.52,
          stagger: 0.018
        },
        "<"
      )
      .to(
        support,
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.48,
          stagger: 0.08
        },
        "<0.12"
      );
  };

  const getIndexFromProgress = (progress) => {
    let nextIndex = -1;

    thresholds.forEach((threshold, index) => {
      if (progress >= threshold) nextIndex = index;
    });

    return nextIndex;
  };

  const renderEntrance = (progress) => {
    const videoOpacity = gsap.utils.clamp(
      0,
      1,
      (progress - introHold) / (introEnd - introHold)
    );

    const introOpacity = 1 - gsap.utils.clamp(0, 1, progress / introEnd);
    const contentOpacity = gsap.utils.clamp(0, 1, (progress - 0.16) / 0.1);

    gsap.set(media, {
      autoAlpha: videoOpacity
    });

    gsap.set(content, {
      autoAlpha: contentOpacity,
      y: (1 - contentOpacity) * 18
    });

    gsap.set(intro, {
      autoAlpha: introOpacity,
      y: -18 * (1 - introOpacity),
      filter: `blur(${(1 - introOpacity) * 8}px)`
    });
  };

  const renderVideoProgress = (progress) => {
    if (reduceMotion.matches) return;

    const duration = video.duration || 0;
    if (!duration) return;

    const videoProgress = gsap.utils.clamp(
      0,
      1,
      (progress - videoStart) / (videoEnd - videoStart)
    );

    const nextTime = gsap.utils.clamp(
      0,
      duration - 0.04,
      duration * videoProgress
    );

    if (Math.abs(video.currentTime - nextTime) > 0.012) {
      video.currentTime = nextTime;
    }
  };

  const renderFinalBenefitExit = (progress) => {
    const finalStep = steps[steps.length - 1];
    if (!finalStep || activeIndex !== steps.length - 1) return;

    const exitProgress = gsap.utils.clamp(
      0,
      1,
      (progress - finalBenefitFadeStart) / (1 - finalBenefitFadeStart)
    );

    gsap.set(finalStep, {
      autoAlpha: 1 - exitProgress,
      y: -24 * exitProgress,
      filter: `blur(${exitProgress * 8}px)`
    });
  };

  const stopVideoTick = () => {
    if (!rafId) return;
    cancelAnimationFrame(rafId);
    rafId = 0;
  };

  const tickVideo = () => {
    rafId = 0;

    if (reduceMotion.matches) return;

    const delta = targetProgress - renderedProgress;

    renderedProgress =
      Math.abs(delta) < 0.001
        ? targetProgress
        : renderedProgress + delta * 0.085;

    renderEntrance(renderedProgress);
    renderVideoProgress(renderedProgress);
    setActiveStep(getIndexFromProgress(renderedProgress));
    renderFinalBenefitExit(renderedProgress);

    if (Math.abs(targetProgress - renderedProgress) > 0.001) {
      rafId = requestAnimationFrame(tickVideo);
    }
  };

  const requestVideoTick = () => {
    if (!rafId) rafId = requestAnimationFrame(tickVideo);
  };

  const syncVideo = (progress, immediate = false) => {
    targetProgress = gsap.utils.clamp(0, 1, progress);

    if (immediate) {
      renderedProgress = targetProgress;
      renderEntrance(renderedProgress);
      renderVideoProgress(renderedProgress);
      setActiveStep(getIndexFromProgress(renderedProgress));
      renderFinalBenefitExit(renderedProgress);
      return;
    }

    requestVideoTick();
  };

  const prepareVideo = () => {
    syncVideo(targetProgress, true);
  };

  video.addEventListener("loadedmetadata", prepareVideo, { once: true });
  video.addEventListener("canplay", prepareVideo, { once: true });
  video.pause();

  gsap.set(steps, {
    autoAlpha: 0,
    y: 28,
    filter: "blur(8px)"
  });

  gsap.set([media, content], {
    autoAlpha: 0
  });

  gsap.set(intro, {
    autoAlpha: 1,
    y: 0,
    filter: "blur(0px)"
  });

  setActiveStep(-1, true);

  if (reduceMotion.matches) {
    gsap.set(media, { autoAlpha: 1 });
    gsap.set(content, { autoAlpha: 1, y: 0 });
    gsap.set(intro, { autoAlpha: 0 });

    setActiveStep(0, true);
    return;
  }

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: () => `+=${window.innerHeight * 4.15}`,
    scrub: true,
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onEnter: () => {
      header?.classList.add("is-over-benefits");
      requestVideoTick();
    },
    onEnterBack: () => {
      header?.classList.add("is-over-benefits");
      requestVideoTick();
    },
    onLeave: () => {
      header?.classList.remove("is-over-benefits");
    },
    onLeaveBack: () => {
      header?.classList.remove("is-over-benefits");
      stopVideoTick();
    },
    onUpdate: (self) => {
      syncVideo(self.progress);
    }
  });
}

  function initClientsPixelBackground() {
    const section = document.querySelector(".clients-showcase");
    if (!section) return;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    canvas.className = "clients-pixel-canvas";
    canvas.setAttribute("aria-hidden", "true");
    section.prepend(canvas);

    const palette = [
      "rgba(80, 111, 253,",
      "rgba(206, 240, 10,",
      "rgba(255, 146, 77,",
      "rgba(255, 255, 255,"
    ];
    const glyphs = [".", "+", "$", "·"];
    const pointer = { x: -9999, y: -9999, active: false };
    const particles = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrame = 10;
    let isVisible = true;

    function buildParticles() {
      particles.length = 0;
      const isMobile = isMobileViewport();
      const spacing = isMobile ? 22 : 16;
      const maxParticles = useLiteMode ? 1200 : 2600;
      const cols = Math.ceil(width / spacing);
      const rows = Math.ceil(height / spacing);
      const density = Math.min(1, maxParticles / Math.max(1, cols * rows));

      for (let y = 0; y <= rows; y += 1) {
        for (let x = 0; x <= cols; x += 1) {
          if (Math.random() > density) continue;

          const accentChance = Math.random();
          const colorIndex = accentChance > 0.92 ? Math.floor(Math.random() * 3) : 3;
          const isGlyph = Math.random() > 0.72;
          const verticalRatio = height > 0 ? (y * spacing) / height : 0;
          const fadeFactor = Math.max(0, 1 - verticalRatio * 1.45);

          if (fadeFactor <= 0.02 || Math.random() > fadeFactor) continue;

          particles.push({
            x: x * spacing + Math.random() * 1.5,
            y: y * spacing + Math.random() * 1.5,
            ox: 0,
            oy: 0,
            vx: 0,
            vy: 0,
            size: isGlyph ? (isMobile ? 8 : 10) : Math.random() * 1.8 + 1,
            glyph: isGlyph ? glyphs[Math.floor(Math.random() * glyphs.length)] : "",
            color: palette[colorIndex],
            fadeFactor,
            baseOpacity: (Math.random() * 0.18 + 0.08) * fadeFactor,
            pulse: (Math.random() * 0.35 + 0.15) * fadeFactor,
            speed: Math.random() * 0.0012 + 0.00035,
            phase: Math.random() * Math.PI * 2,
            driftX: Math.random() * (isMobile ? 6 : 12) + 3,
            driftY: Math.random() * (isMobile ? 5 : 10) + 2,
            driftSpeedX: Math.random() * 0.0012 + 0.00045,
            driftSpeedY: Math.random() * 0.001 + 0.00035
          });
        }
      }
    }

    function resizeCanvas() {
      const rect = section.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.font = "10px Space Grotesk, monospace";
      buildParticles();
    }

    function draw(time) {
      context.clearRect(0, 0, width, height);

      const isMobile = isMobileViewport();
      const pointerRadius = isMobile ? 150 : 260;
      const pointerStrength = isMobile ? 34 : 70;

      for (const particle of particles) {
        let targetX = 0;
        let targetY = 0;

        if (pointer.active) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx, dy);

          if (distance < pointerRadius && distance > 0.1) {
            const force = 1 - distance / pointerRadius;
            const strength = force * force * pointerStrength;
            targetX = (dx / distance) * strength;
            targetY = (dy / distance) * strength;
          }
        }

        particle.vx += (targetX - particle.ox) * 0.045;
        particle.vy += (targetY - particle.oy) * 0.045;
        particle.vx *= 0.84;
        particle.vy *= 0.84;
        particle.ox += particle.vx;
        particle.oy += particle.vy;

        const wave = (Math.sin(time * particle.speed + particle.phase) + 1) / 2;
        const opacity = Math.min(0.62, particle.baseOpacity + wave * particle.pulse);
        if (opacity <= 0.01) continue;
        const driftX = Math.sin(time * particle.driftSpeedX + particle.phase) * particle.driftX;
        const driftY = Math.cos(time * particle.driftSpeedY + particle.phase * 1.7) * particle.driftY;
        const drawX = particle.x + particle.ox + driftX;
        const drawY = particle.y + particle.oy + driftY;
        context.fillStyle = `${particle.color}${opacity})`;

        if (particle.glyph) {
          context.fillText(particle.glyph, drawX, drawY);
        } else {
          context.fillRect(
            drawX,
            drawY,
            particle.size,
            particle.size
          );
        }
      }

      if (!reduceMotion.matches && isVisible) {
        animationFrame = requestAnimationFrame(draw);
      }
    }

    function start() {
      if (animationFrame || reduceMotion.matches) return;
      animationFrame = requestAnimationFrame(draw);
    }

    function stop() {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }

    resizeCanvas();
    draw(0);

    if (!reduceMotion.matches) start();

    if (!prefersCoarsePointer) {
      section.addEventListener("mousemove", (event) => {
        const rect = section.getBoundingClientRect();
        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
        pointer.active = true;
      });

      section.addEventListener("mouseleave", () => {
        pointer.active = false;
      });
    }

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(() => {
        resizeCanvas();
        if (reduceMotion.matches) draw(0);
      });
      resizeObserver.observe(section);
    } else {
      window.addEventListener("resize", resizeCanvas);
    }

    if ("IntersectionObserver" in window) {
      const visibilityObserver = new IntersectionObserver((entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
        if (isVisible) start();
        else stop();
      });
      visibilityObserver.observe(section);
    }
  }

  function initClientsMarquee() {
    const section = document.querySelector(".clients-showcase");

    if (!section || typeof gsap === "undefined" || reduceMotion.matches) return;

    const marquees = gsap.utils.toArray(".clients-marquee");

    if (!marquees.length) return;

    const marqueeTweens = marquees
      .map((marquee) => {
        const track = marquee.querySelector(".clients-marquee__track");
        if (!track) return null;

        const movesRight = marquee.classList.contains("clients-marquee--reverse");

        return movesRight
          ? gsap.fromTo(
              track,
              { xPercent: -50 },
              {
                xPercent: 0,
                duration: useLiteMode ? 46 : 34,
                repeat: -1,
                ease: "none"
              }
            )
          : gsap.to(track, {
              xPercent: -50,
              duration: useLiteMode ? 46 : 34,
              repeat: -1,
              ease: "none"
            });
      })
      .filter(Boolean);

    if ("IntersectionObserver" in window) {
      marqueeTweens.forEach((tween) => tween.pause());

      const visibilityObserver = new IntersectionObserver((entries) => {
        const isVisible = entries[0]?.isIntersecting ?? true;
        marqueeTweens.forEach((tween) => {
          if (isVisible) tween.play();
          else tween.pause();
        });
      });

      visibilityObserver.observe(section);
    }

    if (typeof ScrollTrigger === "undefined" || useLiteMode) return;

    gsap.to(".clients-marquee__group", {
      y: -24,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  }

  function initClientsEffectsWhenReady() {
    const section = document.querySelector(".clients-showcase");
    if (!section) return;

    const init = () => {
      initClientsPixelBackground();
      initClientsMarquee();
    };

    if (!("IntersectionObserver" in window)) {
      init();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        init();
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(section);
  }

  function initFaqInteractions() {
    const section = document.querySelector(".faq-section");
    if (!section) return;

    const questions = Array.from(section.querySelectorAll(".faq-question"));
    const image = section.querySelector(".faq-section__image");
    const count = section.querySelector(".faq-section__count");
    const title = section.querySelector(".faq-section__answer h2");
    const answer = section.querySelector(".faq-section__answer p");

    if (!questions.length || !image || !count || !title || !answer) return;

    let activeIndex = 0;
    let audioContext = null;

    const playFaqSound = () => {
      if (reduceMotion.matches) return;

      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        audioContext ||= new AudioContext();
        if (audioContext.state === "suspended") audioContext.resume();

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const now = audioContext.currentTime;

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(680, now);
        oscillator.frequency.exponentialRampToValueAtTime(420, now + 0.08);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.035, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.13);
      } catch (error) {
        audioContext = null;
      }
    };

    const animateFaqContent = () => {
      if (typeof gsap === "undefined" || reduceMotion.matches) return;

      gsap.fromTo(
        [image, count, title, answer],
        { autoAlpha: 0, y: 18, filter: "blur(8px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.42,
          stagger: 0.045,
          ease: "power3.out"
        }
      );
    };

    const setActiveQuestion = (question, shouldPlaySound = true) => {
      const nextIndex = Number(question.dataset.faqIndex || 0);
      if (nextIndex === activeIndex) return;

      activeIndex = nextIndex;
      questions.forEach((item) => {
        const isActive = item === question;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });

      image.src = question.dataset.faqImage;
      image.alt = question.querySelector("strong")?.textContent.trim() || "Vista previa de pregunta frecuente";
      count.textContent = `${String(nextIndex + 1).padStart(2, "0")} / ${String(questions.length).padStart(2, "0")}`;
      title.textContent = question.querySelector("strong")?.textContent.trim() || "Preguntas frecuentes";
      answer.textContent = question.dataset.faqAnswer || "";

      animateFaqContent();
      if (shouldPlaySound) playFaqSound();
    };

    questions.forEach((question) => {
      question.addEventListener("mouseenter", () => setActiveQuestion(question));
      question.addEventListener("focus", () => setActiveQuestion(question));
      question.addEventListener("click", () => setActiveQuestion(question));
    });

    setActiveQuestion(questions[0], false);
  }

  function initSectionTakeoverTransition({
    previousSelector,
    nextSelector,
    innerSelector = ".container",
    start = "top 70%",
    end = "top 52%"
  }) {
    const previousSection = document.querySelector(previousSelector);
    const nextSection = document.querySelector(nextSelector);
    const nextInner = nextSection?.querySelector(innerSelector);

    if (
      !previousSection ||
      !nextSection ||
      !nextInner ||
      typeof gsap === "undefined" ||
      typeof ScrollTrigger === "undefined" ||
      reduceMotion.matches
    ) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    gsap.set(nextSection, {
      autoAlpha: 0,
      yPercent: 9,
      clipPath: "inset(18% 0 0 0)"
    });
    gsap.set(nextInner, {
      autoAlpha: 0,
      y: 48,
      filter: "blur(10px)"
    });

    gsap
      .timeline({
        scrollTrigger: {
          trigger: nextSection,
          start,
          end,
          scrub: 0.12,
          invalidateOnRefresh: true,
          onLeaveBack: () => {
            gsap.set(previousSection, { clearProps: "filter" });
          }
        }
      })
      .to(nextSection, {
        autoAlpha: 1,
        yPercent: 0,
        clipPath: "inset(0% 0 0 0)",
        ease: "power3.out"
      }, 0)
      .to(nextInner, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        ease: "power3.out"
      }, 0.08)
      .to(previousSection, {
        filter: "brightness(0.82) blur(2px)",
        ease: "none"
      }, 0);
  }

  function scheduleHeroParticles() {
    if (reduceMotion.matches) {
      initHeroParticles();
      return;
    }

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => initHeroParticles(), { timeout: 800 });
      return;
    }

    window.setTimeout(initHeroParticles, 260);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initGsapRuntime();
    initMobileNav();
    initMegaMenu();
    initHeaderHoverSound();
    initContactCtaEffects();

    if (document.querySelector(".about-page, .service-page")) {
      animateAboutHeroTitle();
      serviceSectionTitlesColorFade();
      return;
    }

    initAboutUsVideo();
    runPreloader().then(() => {
      animateHeroContent();
      servicesIntroColorFade();
      requestAnimationFrame(() => {
        animateHeroColumnsOnScroll();
        initServicesScroll();
        clientsTitleColorFade();
        initClientsEffectsWhenReady();
        initBenefitsScrollVideo();
        initFaqInteractions();
        initSectionTakeoverTransition({
          previousSelector: ".benefits-section",
          nextSelector: ".faq-section",
          innerSelector: ".faq-section__inner"
        });
      });
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(scheduleHeroParticles, { timeout: 1200 });
      } else {
        window.setTimeout(scheduleHeroParticles, 350);
      }
    });
  });
})();
