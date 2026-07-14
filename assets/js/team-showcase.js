(function () {
  const teamMembers = [
    {
      name: "Sergio Vásquez",
      role: "CEO",
      image: "images/team/sergio-vasquez-v2.jpg",
      alt: "Sergio Vásquez, CEO de Pixelee"
    },
    {
      name: "Alejandro Acosta",
      role: "COO",
      image: "images/team/alejandro-acosta.jpg",
      alt: "Alejandro Acosta, COO de Pixelee"
    },
    {
      name: "Fabián Hernández",
      role: "CFO",
      image: "images/team/fabian-hernandez.jpg",
      alt: "Fabián Hernández, CFO de Pixelee"
    },
    {
      name: "Luna Dávila",
      role: "CDO",
      image: "images/team/luna-davila.jpg",
      alt: "Luna Dávila, CDO de Pixelee"
    },
    {
      name: "Germán Arévalo",
      role: "CTO",
      image: "images/team/german-arevalo.jpg",
      alt: "Germán Arévalo, CTO de Pixelee"
    },
    {
      name: "Próxima integrante",
      role: "Por definir",
      image: "images/team/proxima-integrante.svg",
      alt: "Espacio reservado para próxima integrante de Pixelee",
      isUpcoming: true
    }
  ];

  const AUTOPLAY_DELAY = 3800;
  const IMAGE_SWAP_DELAY = 180;

  const scriptUrl = document.currentScript?.src || new URL("assets/js/team-showcase.js", window.location.href).href;
  const assetBaseUrl = new URL("../", scriptUrl);
  const assetUrl = (path) => new URL(path, assetBaseUrl).href;

  const showcase = document.querySelector("[data-team-showcase]");
  if (!showcase) return;

  const leftList = showcase.querySelector("[data-team-list-left]");
  const rightList = showcase.querySelector("[data-team-list-right]");
  const image = showcase.querySelector("[data-team-image]");
  const name = showcase.querySelector("[data-team-name]");
  const role = showcase.querySelector("[data-team-role]");

  if (!leftList || !rightList || !image || !name || !role) return;

  const mobileCarousel = document.createElement("div");
  mobileCarousel.className = "team-showcase__mobile-carousel";
  mobileCarousel.setAttribute("aria-label", "Carrusel de integrantes del equipo");
  showcase.appendChild(mobileCarousel);

  const autoplayIndexes = teamMembers
    .map((member, index) => (member.isUpcoming ? null : index))
    .filter((index) => index !== null);

  let activeIndex = autoplayIndexes[0] || 0;
  let autoplayTimer = 0;
  let isPausedByUser = false;
  let swapTimer = 0;
  const buttons = [];
  const mobileCards = [];

  function createMemberButton(member, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "team-showcase__member";
    button.dataset.teamIndex = String(index);
    button.setAttribute("aria-label", `${member.name}, ${member.role}`);

    if (member.isUpcoming) {
      button.classList.add("is-upcoming");
      button.setAttribute("aria-label", "Espacio reservado para próxima integrante");
    }

    button.innerHTML = `
      <span class="team-showcase__member-name">${member.name}</span>
      <span class="team-showcase__member-role">${member.role}</span>
    `;

    button.addEventListener("mouseenter", () => {
      isPausedByUser = true;
      stopAutoplay();
      setActiveMember(index, true);
    });

    button.addEventListener("focus", () => {
      isPausedByUser = true;
      stopAutoplay();
      setActiveMember(index, true);
    });

    button.addEventListener("mouseleave", () => {
      isPausedByUser = false;
      startAutoplay();
    });

    button.addEventListener("blur", () => {
      isPausedByUser = false;
      startAutoplay();
    });

    button.addEventListener("click", () => {
      setActiveMember(index, true);
    });

    buttons[index] = button;
    return button;
  }

  function createMobileCard(member, index) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "team-showcase__mobile-card";
    card.dataset.teamIndex = String(index);
    card.setAttribute("aria-label", `${member.name}, ${member.role}`);

    if (member.isUpcoming) {
      card.classList.add("is-upcoming");
      card.setAttribute("aria-label", "Espacio reservado para próxima integrante");
    }

    card.innerHTML = `
      <span class="team-showcase__mobile-kicker">${member.role}</span>
      <strong class="team-showcase__mobile-name">${member.name}</strong>
      <span class="team-showcase__mobile-photo">
        <img src="${assetUrl(member.image)}" alt="${member.alt}" width="720" height="900" loading="lazy" decoding="async">
      </span>
    `;

    card.addEventListener("click", () => {
      setActiveMember(index, true);
      stopAutoplay();
      startAutoplay();
    });

    mobileCards[index] = card;
    return card;
  }

  function renderTeamLists() {
    const splitIndex = Math.ceil(teamMembers.length / 2);

    teamMembers.forEach((member, index) => {
      const button = createMemberButton(member, index);
      const targetList = index < splitIndex ? leftList : rightList;
      targetList.appendChild(button);
      mobileCarousel.appendChild(createMobileCard(member, index));
    });
  }

  function setActiveState(index) {
    buttons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === index;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    mobileCards.forEach((card, cardIndex) => {
      const isActive = cardIndex === index;
      card.classList.toggle("is-active", isActive);
      card.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    if (window.matchMedia("(max-width: 960px)").matches) {
      const activeCard = mobileCards[index];

      if (activeCard) {
        mobileCarousel.scrollTo({
          left: activeCard.offsetLeft - ((mobileCarousel.clientWidth - activeCard.clientWidth) / 2),
          behavior: "smooth"
        });
      }
    }
  }

  function setActiveMember(index, immediate = false) {
    const member = teamMembers[index];
    if (!member) return;

    activeIndex = index;
    setActiveState(index);

    const nextImage = assetUrl(member.image);

    window.clearTimeout(swapTimer);

    const updateContent = () => {
      image.src = nextImage;
      image.alt = member.alt;
      name.textContent = member.name;
      role.textContent = member.role;
    };

    if (immediate) {
      updateContent();
      image.classList.remove("is-changing");
      return;
    }

    image.classList.add("is-changing");
    swapTimer = window.setTimeout(updateContent, IMAGE_SWAP_DELAY);
  }

  function getNextAutoplayIndex() {
    const currentPosition = autoplayIndexes.indexOf(activeIndex);
    const nextPosition = currentPosition === -1
      ? 0
      : (currentPosition + 1) % autoplayIndexes.length;

    return autoplayIndexes[nextPosition];
  }

  function stopAutoplay() {
    window.clearInterval(autoplayTimer);
    autoplayTimer = 0;
  }

  function startAutoplay() {
    if (isPausedByUser || autoplayTimer || autoplayIndexes.length < 2) return;

    autoplayTimer = window.setInterval(() => {
      setActiveMember(getNextAutoplayIndex());
    }, AUTOPLAY_DELAY);
  }

  image.addEventListener("load", () => {
    image.classList.remove("is-changing");
  });

  renderTeamLists();
  setActiveMember(activeIndex, true);
  startAutoplay();
})();
