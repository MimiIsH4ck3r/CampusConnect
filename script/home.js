const guestHero = document.getElementById("guest-hero");
const studentHero = document.getElementById("student-hero");
const studentSlide = document.getElementById("student-slide");
const studentDots = document.getElementById("student-slide-dots");
const guestContent = document.getElementById("guest-content");
const studentContent = document.getElementById("student-content");

let studentSlides = [];
let activeSlideIndex = 0;
let slideTimer = null;

let schoolId = "0001";

function setHeroState(isLoggedIn) {
  if (guestHero) {
    guestHero.classList.toggle("hidden", isLoggedIn);
  }

  if (studentHero) {
    studentHero.classList.toggle("hidden", !isLoggedIn);
  }

  if (guestContent) {
    guestContent.classList.toggle("hidden", isLoggedIn);
  }

  if (studentContent) {
    studentContent.classList.toggle("hidden", !isLoggedIn);
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

function getNewsDate(newsItem) {
  return newsItem.publishedAt?.toDate() || new Date(0);
}

function sortNewsNewest(newsItems) {
  return [...newsItems].sort((first, second) => {
    const firstDate = getNewsDate(first)?.getTime() ?? 0;
    const secondDate = getNewsDate(second)?.getTime() ?? 0;

    return (
      secondDate - firstDate ||
      String(first.title || "").localeCompare(String(second.title || ""))
    );
  });
}

function formatNewsDate(newsItem) {
  if (!newsItem.publishedAt) return "Date not available";

  return newsItem.publishedAt.toDate().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

async function loadStudentSlides() {
  try {
    const [clubSnapshot, eventSnapshot] = await Promise.all([
      db.collection("clubs").where("schoolId", "==", schoolId).limit(3).get(),
      db.collection("events").where("schoolId", "==", schoolId).get(),
    ]);

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

const clubListElement = document.getElementById("club-list");
const eventListElement = document.getElementById("event-list");
const homeNewsList = document.getElementById("home-news-list");

async function loadHomeClubs() {
  try {
    const snapshot = await db
      .collection("clubs")
      .where("schoolId", "==", schoolId)
      .get();

    const homeClubs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    clubListElement.innerHTML = homeClubs
      .map(
        (club) =>
          `
      <div class="col-12 col-lg-4 col-md-6">
        <div class="club-card">
            <div class="club-card-top">
              <div class="club-icon ${(club.category || "").toLowerCase()}">
                <i class="fa-solid fa-${club.icon || "users"}"></i>
              </div>
              <span class="club-category">
                ${club.category || "Uncategorized"}
              </span>
            </div>

            <h3 class="card-title">${club.name || "Unnamed club"}</h3>

            <p class="description">
              ${club.shortDescription || "No description available."}
            </p>

            <div class="club-card-footer">
              <span class="club-members">
                <i class="fa-solid fa-user-group"></i>
                ${club.memberCount ?? 0}  members
              </span>

              <a
                href="club.html?id=${encodeURIComponent(club.id)}"
                class="club-explore"
                data-auth-required
              >
                Explore ↗
              </a>
            </div>
          </div>
      </div>`,
      )
      .join("");
  } catch (error) {
    console.error("Error loading home clubs:", error);
  }
}

const now = new Date();
async function loadHomeEvents() {
  try {
    const snapshot = await db
      .collection("events")
      .where("schoolId", "==", schoolId)
      .get();

    const homeEvents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const upcomingEvents = homeEvents
      .filter((event) => event.endAt.toDate() >= now)
      .sort((a, b) => a.startAt.toDate() - b.startAt.toDate());
    if (upcomingEvents.length == 0) {
      eventListElement.innerHTML =
        '<p class="history-note">No events coming up.</p>';
      return;
    }

    eventListElement.innerHTML = upcomingEvents
      .map(
        (event) =>
          `
            <div class="col-12 col-lg-4 col-md-6">
              <div class="event-card">
                <div class="event-date">
                  <span class="event-month">${event.startAt.toDate().toLocaleString("en-US", { month: "short" }).toUpperCase()} ${event.startAt.toDate().getDate()}</span>
                  <span>${event.startAt.toDate().getFullYear()}</span>
                </div>

                <div class="event-details">
                  <span class="event-time">${event.startAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${event.endAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <h3 class="card-title">${event.title}</h3>

                  <div class="d-flex align-items-center gap-2">
                    <span class="event-organizer">${event.organizer} ·</span>
                    <span class="event-location">${event.location}</span>
                  </div>
                </div>

                <a href="event.html?id=${event.id}" class="card-link" data-auth-required
                  >View Event →</a
                >
              </div>
            </div>
      `,
      )
      .join("");
  } catch (error) {
    console.log(error);
  }
}

async function loadHomeNews() {
  try {
    const snapshot = await db
      .collection("news")
      .where("schoolId", "==", schoolId)
      .get();

    const newsItems = sortNewsNewest(
      snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((newsItem) => newsItem.status === "published"),
    ).slice(0, 3);

    if (newsItems.length === 0) {
      homeNewsList.innerHTML =
        '<p class="news-note">No campus news to display yet.</p>';
      return;
    }

    homeNewsList.innerHTML = newsItems
      .map(
        (newsItem) => `
          <div class="col-12 col-md-6 col-lg-4">
            <article class="news-card">
              <span class="news-category">${newsItem.category || "Campus News"}</span>
              <h3>${newsItem.title || "Untitled article"}</h3>
              <p>${newsItem.summary || "Read the latest from your school."}</p>
              <div class="news-meta">
                <span>${newsItem.author ? `By ${newsItem.author}` : "CampusConnect"}</span>
                <span>${formatNewsDate(newsItem)}</span>
              </div>
              <a class="news-card-link" href="./news-detail.html?id=${encodeURIComponent(newsItem.id)}" data-auth-required>
                Read story <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </a>
            </article>
          </div>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Error loading home news:", error);
    homeNewsList.innerHTML =
      '<p class="news-note">We couldn\'t load campus news. Please try again later.</p>';
  }
}

auth.onAuthStateChanged(async (user) => {
  const loggedIn = !!user;

  setHeroState(loggedIn);

  if (loggedIn) {
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (userDoc) schoolId = userDoc.data().schoolId;
    loadHomeClubs();
    loadStudentSlides();
    loadHomeEvents();
    loadHomeNews();
  } else {
    studentSlides = [];
    activeSlideIndex = 0;
    schoolId = "0001";

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
