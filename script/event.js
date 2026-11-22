const eventTitle = document.getElementById("event-title");
const eventDescription = document.getElementById("event-description");
const eventSummary = document.getElementById("event-summary");
const eventCategory = document.getElementById("event-category");
const eventSchedule = document.getElementById("event-schedule");
const eventOrganizer = document.getElementById("event-organizer");

const eventDate = document.getElementById("event-date");
const eventTime = document.getElementById("event-time");
const eventLocation = document.getElementById("event-location");
const eventCapacity = document.getElementById("event-capacity");
const eventRegistrationStatus = document.getElementById("event-status");
const registerButton = document.getElementById("register-event");

let eventData;
const eventId = new URLSearchParams(window.location.search).get("id");

async function loadEventDetails() {
  try {
    await db
      .collection("events")
      .doc(eventId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          eventData = doc.data();
        } else {
          console.error("No such event document!");
          return;
        }
      });

    eventTitle.textContent = eventData.title || "Untitled Event";
    eventDescription.textContent =
      eventData.description || "No description available.";
    eventSummary.textContent = eventData.summary || "No summary available.";
    eventCategory.textContent = eventData.category || "Uncategorized";
    eventOrganizer.textContent = eventData.organizer || "Unknown Organizer";

    if (eventData.schedule && eventData.schedule.length > 0) {
      eventSchedule.innerHTML = eventData.schedule
        .map(
          (timeline) =>
            `<div class="timeline-item">
                <span class="timeline-time">${timeline.split(";")[0]}</span>
                <div>
                  <h3>${timeline.split(";")[1]}</h3>
                </div>
              </div>`,
        )
        .join("");
    }

    if (eventData.startAt && eventData.endAt) {
      const startDate = eventData.startAt.toDate();
      const endDate = eventData.endAt.toDate();

      eventDate.textContent = startDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      eventTime.textContent = `${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    eventLocation.textContent = eventData.location || "Location not specified.";
    eventCapacity.textContent = `${eventData.registeredCount ?? 0} / ${eventData.capacity ?? "N/A"} registered`;
    if (eventData.registration === false) {
      eventRegistrationStatus.textContent = "Registration Closed";
      registerButton.disabled = true;
    } else if (eventData.registeredCount >= eventData.capacity) {
      eventRegistrationStatus.textContent = "Event Full";
      registerButton.disabled = true;
    }
  } catch (error) {
    console.error("Error loading event data:", error);
  }
}
auth.onAuthStateChanged((user) => {
  if (user) loadEventDetails();
});
