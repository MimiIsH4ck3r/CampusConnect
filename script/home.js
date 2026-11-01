const guestHero = document.getElementById("guest-hero");
const studentHero = document.getElementById("student-hero");
const studentSlide = document.getElementById("student-slide");
const studentDots = document.getElementById("student-slide-dots");

let studentSlides = [];
let activeSlideIndex = 0;
let slideTimer = null;

function setHeroState(isLoggedIn) {
  if (guestHero) {
    guestHero.classList.toggle("hidden", isLoggedIn);
  }

  if (studentHero) {
    studentHero.classList.toggle("hidden", !isLoggedIn);
  }
}

function showDots() {
  if (!studentDots) return;

  studentDots.innerHTML = "";

  studentSlides.forEach((_, index) => {
    const dot = document.createElement("button");

    dot.type = "button";
    dot.className = "slide-dot" + (index === activeSlideIndex ? " active" : "");

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
  if (!studentSlide || studentSlides.length === 0) return;

  const slide = studentSlides[activeSlideIndex];

  studentSlide.innerHTML = `
    <div class="student-slide-top">
      <span class="label">${slide.tag || "STUDENT CLUB"}</span>
      <span class="student-club-name">${slide.club || ""}</span>
    </div>

    <h1>${slide.title || slide.name || "Untitled Club"}</h1>

    <p class="student-slide-subtitle">
      ${slide.subtitle || ""}
    </p>

    <p class="hero-description">
      ${slide.description || "Discover clubs on campus."}
    </p>

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
    slideTimer = null;
  }

  slideTimer = setInterval(() => {
    activeSlideIndex = (activeSlideIndex + 1) % studentSlides.length;
    showSlide();
  }, 4000);
}

async function loadStudentSlides() {
  try {
    const [clubSnapshot, eventSnapshot] = await Promise.all([
      db.collection("clubs").where("active", "==", true).limit(3).get(),
      db.collection("events").get(),
    ]);

    // Prepare the 3 club slides
    const clubSlides = clubSnapshot.docs.map((doc) => {
      const club = doc.data();

      return {
        tag: "EXPLORE CLUBS",
        club: club.category || "Student Club",
        title: club.name || "Untitled Club",
        subtitle: `${club.memberCount ?? 0} members`,
        description: club.description || "Discover this student club.",
        icon: club.icon || "users",
        link: `club.html?id=${encodeURIComponent(doc.id)}`,
      };
    });

    // Find upcoming events
    const now = new Date();

    const upcomingEvents = eventSnapshot.docs
      .map((doc) => {
        const event = doc.data();

        let startDate = null;

        if (event.startAt?.toDate) {
          startDate = event.startAt.toDate();
        } else if (event.startAt) {
          const parsedDate = new Date(event.startAt);

          if (!Number.isNaN(parsedDate.getTime())) {
            startDate = parsedDate;
          }
        }

        return {
          id: doc.id,
          ...event,
          startDate,
        };
      })
      .filter((event) => {
        return event.startDate && event.startDate >= now;
      })
      .sort((a, b) => a.startDate - b.startDate);

    // Use the nearest upcoming event
    let eventSlide = [];

    if (upcomingEvents.length > 0) {
      const event = upcomingEvents[0];

      eventSlide = [
        {
          tag: "UPCOMING EVENT",
          club: event.category || "Campus Events",
          title: event.title || event.name || "Upcoming Event",
          subtitle: event.startDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          description:
            event.description || "Discover what's happening on campus.",
          link: `event.html?id=${encodeURIComponent(event.id)}`,
        },
      ];
    }

    studentSlides = [...eventSlide, ...clubSlides];
    activeSlideIndex = 0;

    if (auth.currentUser && studentSlides.length > 0) {
      showSlide();
      restartSlide();
    } else {
      setHeroState(false);
    }
  } catch (error) {
    console.error("Error loading student slides:", error);
  }
}

auth.onAuthStateChanged((user) => {
  const loggedIn = !!user;

  setHeroState(loggedIn);

  if (loggedIn) {
    loadStudentSlides();
  } else {
    studentSlides = [];
    activeSlideIndex = 0;

    if (studentSlide) studentSlide.innerHTML = "";
    if (studentDots) studentDots.innerHTML = "";

    restartSlide();
  }
});

window.addEventListener("beforeunload", () => {
  if (slideTimer) {
    clearInterval(slideTimer);
  }
});
