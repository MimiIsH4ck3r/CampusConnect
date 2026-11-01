const guestHero = document.getElementById("guest-hero");
const studentHero = document.getElementById("student-hero");
const studentSlide = document.getElementById("student-slide");
const studentDots = document.getElementById("student-slide-dots");

const studentSlides = [
  {
    title: "Campus Lights Festival",
    subtitle: "Creative energy all across campus",
    description:
      "Live music, food trucks, pop-up art, and student performances for a full night of campus energy.",
    club: "Arts & Culture Collective",
    tag: "Big event",
  },
  {
    title: "Hack for Good Weekend",
    subtitle: "Build ideas that help the community",
    description:
      "Student teams will design apps, prototypes, and solutions that tackle real campus and local challenges.",
    club: "Byte Club",
    tag: "Featured club",
  },
  {
    title: "Wellness Week Challenge",
    subtitle: "Move, reset, and recharge together",
    description:
      "From yoga and fitness sessions to mindfulness workshops, this week is all about keeping students connected and healthy.",
    club: "Campus Wellness Society",
    tag: "Community spotlight",
  },
];

function setHeroState(isLoggedIn) {
  if (guestHero) guestHero.classList.toggle("hidden", isLoggedIn);
  if (studentHero) studentHero.classList.toggle("hidden", !isLoggedIn);
}

let activeSlideIndex = 0;
let slideTimer = null;
function showDots() {
  studentDots.innerHTML = "";

  studentSlides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className =
      "slide-dot " + (index === activeSlideIndex ? " active" : "");
    dot.setAttribute("aria-label", `Show slide ${index + 1}`);
    dot.addEventListener("click", () => {
      activeSlideIndex = index;
      showSlide();
      restartSlide();
    });
    studentDots.appendChild(dot);
  });
}

function showSlide() {
  if (!studentSlide) return;

  const slide = studentSlides[activeSlideIndex];
  studentSlide.innerHTML = `
    <div class="student-slide-top">
      <span class="label">${slide.tag}</span>
      <span class="student-club-name">${slide.club}</span>
    </div>
    <h1>${slide.title}</h1>
    <p class="student-slide-subtitle">${slide.subtitle}</p>
    <p class="hero-description">${slide.description}</p>
    <div class="student-slide-actions">
      <a href="#events" class="btn btn-primary">See details</a>
      <a href="#clubs" class="btn btn-outline-light">Browse clubs</a>
    </div>
  `;

  showDots();
}

function restartSlide() {
  if (slideTimer) {
    clearInterval(slideTimer);
  }

  slideTimer = setInterval(() => {
    activeSlideIndex = (activeSlideIndex + 1) % studentSlides.length;
    showSlide();
  }, 4000);
}

function initializeHero() {
  const isLoggedIn = !!auth.currentUser;
  setHeroState(isLoggedIn);
  if (isLoggedIn && studentSlides.length) {
    showSlide();
    restartSlide();
  } else if (slideTimer) {
    clearInterval(slideTimer);
    slideTimer = null;
  }
}

auth.onAuthStateChanged((user) => {
  const loggedIn = !!user;
  setHeroState(loggedIn);

  if (loggedIn && studentSlides.length) {
    showSlide();
    restartSlide();
  } else if (slideTimer) {
    clearInterval(slideTimer);
    slideTimer = null;
  }
});

window.addEventListener("beforeunload", () => {
  if (slideTimer) {
    clearInterval(slideTimer);
  }
});
