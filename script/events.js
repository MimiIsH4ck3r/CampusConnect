const upcomingContainer = document
  .getElementById("upcoming-events")
  .getElementsByClassName("event-timeline")[0];
const pastContainer = document
  .getElementById("event-history")
  .getElementsByClassName("event-timeline")[0];
const nextEventCard = document.getElementById("next-event-card");
const noNextEvent = document.getElementById("no-next-event");

function showNextEvent(event) {
  const startAt = event.startAt.toDate();
  const endAt = event.endAt.toDate();

  document.getElementById("next-event-month").textContent = startAt
    .toLocaleString("en-US", { month: "short" })
    .toUpperCase();
  document.getElementById("next-event-day").textContent = startAt.getDate();
  document.getElementById("next-event-year").textContent =
    startAt.getFullYear();
  document.getElementById("next-event-type").textContent = [
    event.category,
    event.organizer,
  ]
    .filter(Boolean)
    .join(" · ");
  document.getElementById("next-event-title").textContent =
    event.title || "Untitled event";
  document.getElementById("next-event-description").textContent =
    event.description || "No description available.";
  const timeElement = document.getElementById("next-event-time");
  const timeIcon = document.createElement("i");
  timeIcon.className = "fa-regular fa-clock";
  timeElement.replaceChildren(timeIcon);
  timeElement.append(
    ` ${startAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${endAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
  );

  const locationElement = document.getElementById("next-event-location");
  const locationIcon = document.createElement("i");
  locationIcon.className = "fa-solid fa-location-dot";
  locationElement.replaceChildren(locationIcon);
  locationElement.append(` ${event.location || "Location not specified"}`);
  document.getElementById("next-event-link").href =
    `./event.html?id=${encodeURIComponent(event.id)}`;
  nextEventCard.hidden = false;
  noNextEvent.hidden = true;
}

function showEvents(eventList, container) {
  if (eventList.length === 0) {
    container.innerHTML =
      container === upcomingContainer
        ? '<p class="history-note">No additional upcoming events.</p>'
        : '<p class="history-note">No past events to display.</p>';
    return;
  }

  container.innerHTML = eventList
    .map(
      (event) => `
        <div class="event-row">
              <div class="timeline-date">
                <span>${event.startAt.toDate().toLocaleString("en-US", { month: "short" }).toUpperCase()}</span>
                <strong>${event.startAt.toDate().getDate()}</strong>
                <small>${event.startAt.toDate().getFullYear()}</small>
              </div>

              <div class="timeline-content">
                <span class="event-type">${event.organizer}</span>
                <h3>${event.title}</h3>
                <p>
                  ${event.description}
                </p>
                <div class="event-meta">
                  <span>
                    <i class="fa-regular fa-clock"></i>
                    ${event.startAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${event.endAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span>
                    <i class="fa-solid fa-location-dot"></i>
                    ${event.location}
                  </span>
                </div>
              </div>

              <a href="event.html?id=${event.id}" class="event-detail-link"> Details ↗ </a>
            </div>
        `,
    )
    .join("");
}

async function loadEvents() {
  const eventList = [];
  try {
    await db
      .collection("events")
      .where("schoolId", "==", schoolId)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          eventList.push({ id: doc.id, ...doc.data() });
        });
        console.log("Loaded events:", eventList);
      });

    const now = new Date();

    const upcomingEvents = eventList
      .filter((event) => event.endAt.toDate() >= now)
      .sort((a, b) => a.startAt.toDate() - b.startAt.toDate());

    const pastEvents = eventList
      .filter((event) => event.endAt.toDate() < now)
      .sort((a, b) => b.startAt.toDate() - a.startAt.toDate());

    if (upcomingEvents.length > 0) {
      showNextEvent(upcomingEvents[0]);
      showEvents(upcomingEvents.slice(1), upcomingContainer);
    } else {
      nextEventCard.hidden = true;
      noNextEvent.hidden = false;
      showEvents([], upcomingContainer);
      upcomingContainer.querySelector(".history-note").textContent =
        "No upcoming events to display.";
    }

    showEvents(pastEvents, pastContainer);
  } catch (error) {
    console.error("Could not load events:", error);
    nextEventCard.hidden = true;
    noNextEvent.textContent =
      "We couldn't load upcoming events. Please try again later.";
    noNextEvent.hidden = false;
    upcomingContainer.innerHTML =
      "<p>We couldn't load upcoming events. Please try again later.</p>";
    pastContainer.innerHTML =
      "<p>We couldn't load past events. Please try again later.</p>";
  }
}

auth.onAuthStateChanged(async (user) => {
  const userDoc = await db.collection("users").doc(user.uid).get();
  if (userDoc) schoolId = userDoc.data().schoolId;
  loadEvents();
});
