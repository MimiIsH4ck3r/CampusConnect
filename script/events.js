const upcomingContainer = document
  .getElementById("upcoming-events")
  .getElementsByClassName("event-timeline")[0];
const pastContainer = document
  .getElementById("event-history")
  .getElementsByClassName("event-timeline")[0];

function showEvents(eventList, container) {
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

    showEvents(upcomingEvents, upcomingContainer);
    showEvents(pastEvents, pastContainer);
  } catch (error) {
    console.error("Could not load events:", error);
    upcomingContainer.innerHTML =
      "<p>We couldn't load upcoming events. Please try again later.</p>";
    pastContainer.innerHTML =
      "<p>We couldn't load past events. Please try again later.</p>";
  }
}
loadEvents();
