// CampusConnect Admin Dashboard
// Uses one reusable Bootstrap modal.

// -------------------- Navigation --------------------

const navLinks = document.querySelectorAll("[data-section]");
const sections = document.querySelectorAll(".admin-section");
const pageTitle = document.getElementById("page-title");

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const section = link.dataset.section;
    document.querySelectorAll(".admin-nav-link").forEach((nav) => {
      nav.classList.remove("active");
    });
    document
      .querySelector(`[data-section="${section}"].admin-nav-link`)
      ?.classList.add("active");

    sections.forEach((item) => item.classList.remove("active"));
    document.getElementById(`${section}-section`)?.classList.add("active");
    if (pageTitle) {
      pageTitle.textContent =
        section.charAt(0).toUpperCase() + section.slice(1);
    }
    document.getElementById("admin-sidebar")?.classList.remove("open");
  });
});

document.getElementById("sidebar-toggle")?.addEventListener("click", () => {
  document.getElementById("admin-sidebar")?.classList.toggle("open");
});

document.getElementById("admin-logout")?.addEventListener("click", async () => {
  try {
    await auth.signOut();
    window.location.href = "login.html";
  } catch (error) {
    console.error("Logout error:", error);
    alert("Unable to log out. Please try again.");
  }
});

// -------------------- Admin authentication --------------------

let schoolId = null;
let adminReady = false;

auth.onAuthStateChanged(async (user) => {
  schoolId = null;
  adminReady = false;

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists) {
      window.location.href = "index.html";
      return;
    }

    const profile = userDoc.data();

    if (profile.role !== 2 || !profile.schoolId) {
      window.location.href = "index.html";
      return;
    }

    schoolId = profile.schoolId;
    adminReady = true;

    console.log("Admin:", user.email);
    console.log("School:", schoolId);

    await Promise.all([
      loadOverviewData(),
      loadClubs(),
      loadEvents(),
      loadNews(),
    ]);
  } catch (error) {
    console.error("Admin authentication error:", error);
    window.location.href = "index.html";
  }
});

// -------------------- Shared helper functions --------------------

function toDate(value) {
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  if (value) return new Date(value);
  return null;
}

function toLocalDateTime(value) {
  const date = toDate(value);

  if (!date || isNaN(date.getTime())) return "";

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function getLines(id) {
  return document
    .getElementById(id)
    .value.trim()
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

async function getSchoolDocument(collection, id) {
  if (!adminReady || !schoolId) {
    throw new Error("Admin access has not been verified.");
  }

  const snapshot = db.collection(collection).doc(id);
  const doc = await snapshot.get();
  if (!doc.exists || doc.data().schoolId !== schoolId) {
    throw new Error("You are not allowed to edit this document.");
  }
  return snapshot;
}

// -------------------- Reusable modal --------------------

document.body.insertAdjacentHTML(
  "beforeend",
  `
    <div class="modal fade" id="admin-content-modal" tabindex="-1"
        aria-labelledby="admin-content-modal-title" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
                <form id="admin-content-form">
                    <div class="modal-header">
                        <h5 class="modal-title" id="admin-content-modal-title">
                            Add content
                        </h5>
                        <button type="button" class="btn-close"
                            data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>

                    <div class="modal-body" id="admin-content-form-fields"></div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary"
                            data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-primary">
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
`,
);

const adminModalElement = document.getElementById("admin-content-modal");
const adminModal = bootstrap.Modal.getOrCreateInstance(adminModalElement);
const adminContentForm = document.getElementById("admin-content-form");
const adminFormFields = document.getElementById("admin-content-form-fields");

function showAdminModal(title, formHTML, submitFunction) {
  document.getElementById("admin-content-modal-title").textContent = title;
  adminFormFields.innerHTML = formHTML;
  adminContentForm.onsubmit = submitFunction;
  adminModal.show();
}

// -------------------- Dashboard overview --------------------

async function loadOverviewData() {
  if (!adminReady || !schoolId) return;

  try {
    const [clubs, users, events] = await Promise.all([
      db.collection("clubs").where("schoolId", "==", schoolId).get(),
      db.collection("users").where("schoolId", "==", schoolId).get(),
      db.collection("events").where("schoolId", "==", schoolId).get(),
    ]);

    document.getElementById("total-clubs").textContent = clubs.size;
    document.getElementById("total-users").textContent = users.size;
    document.getElementById("total-events").textContent = events.size;

    const now = new Date();

    const upcomingEvents = events.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((event) => {
        const end = toDate(event.endAt);
        return end && end >= now;
      })
      .sort((a, b) => toDate(a.startAt) - toDate(b.startAt));

    const overview = document.getElementById("overview-events");

    if (upcomingEvents.length === 0) {
      overview.innerHTML = '<p class="empty-message">No upcoming events.</p>';
      return;
    }

    overview.innerHTML = upcomingEvents
      .map(
        (event) => `
            <div class="overview-item-content">
                <h4>${event.title}</h4>
                <p>
                    ${toDate(event.startAt)?.toLocaleDateString() || "TBA"}
                    -
                    ${toDate(event.endAt)?.toLocaleDateString() || "TBA"}
                </p>
            </div>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Overview error:", error);
  }
}

// clubs

let editingClubId = null;
let clubCache = new Map();

function openClubModal(club = null) {
  editingClubId = club ? club.id : null;

  const formHTML = `
        <div class="mb-3">
            <label for="club-name" class="form-label">Club name</label>
            <input id="club-name" class="form-control" type="text"
                value="${club?.name || ""}" required>
        </div>

        <div class="mb-3">
            <label for="club-category" class="form-label">Category</label>
            <input id="club-category" class="form-control" type="text"
                value="${club?.category || ""}" required>
        </div>

        <div class="mb-3">
            <label for="club-short-description" class="form-label">
                Short description
            </label>
            <input id="club-short-description" class="form-control" type="text"
                value="${club?.shortDescription || ""}">
        </div>

        <div class="mb-3">
            <label for="club-description" class="form-label">Description</label>
            <textarea id="club-description" class="form-control" rows="3">${club?.description || ""}</textarea>
        </div>

        <div class="row">
            <div class="col-md-6 mb-3">
                <label for="club-member-count" class="form-label">
                    Number of members
                </label>
                <input id="club-member-count" class="form-control"
                    type="number" min="0"
                    value="${club?.memberCount ?? 0}">
            </div>

            <div class="col-md-6 mb-3">
                <label for="club-icon" class="form-label">Icon</label>
                <input id="club-icon" class="form-control" type="text"
                    value="${club?.icon || ""}"
                    placeholder="Example: 🎨">
            </div>
        </div>

        <div class="mb-3">
            <label for="club-activities" class="form-label">
                Activities (one per line)
            </label>
            <textarea id="club-activities" class="form-control" rows="3">${
              Array.isArray(club?.activities) ? club.activities.join("\n") : ""
            }</textarea>
        </div>

        <div class="mb-3">
            <label for="club-location" class="form-label">Location</label>
            <input id="club-location" class="form-control" type="text"
                value="${club?.location || ""}">
        </div>

        <div class="mb-3">
            <label for="club-schedule" class="form-label">Schedule</label>
            <input id="club-schedule" class="form-control" type="text"
                value="${club?.schedule || ""}">
        </div>

        <div class="row">
            <div class="col-md-6 mb-3">
                <label for="club-leader" class="form-label">Club leader</label>
                <input id="club-leader" class="form-control" type="text"
                    value="${club?.leader || ""}">
            </div>

            <div class="col-md-6 mb-3">
                <label for="club-contact-email" class="form-label">
                    Contact email
                </label>
                <input id="club-contact-email" class="form-control"
                    type="email" value="${club?.contactEmail || ""}">
            </div>
        </div>

        <div class="form-check">
            <input id="club-active" class="form-check-input" type="checkbox"
                ${club ? (club.active !== false ? "checked" : "") : "checked"}>
            <label for="club-active" class="form-check-label">
                Active
            </label>
        </div>
    `;

  showAdminModal(editingClubId ? "Edit Club" : "Add Club", formHTML, saveClub);
}

async function loadClubs() {
  if (!adminReady || !schoolId) return;

  try {
    const snapshot = await db
      .collection("clubs")
      .where("schoolId", "==", schoolId)
      .get();

    const clubs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    clubCache = new Map(clubs.map((club) => [club.id, club]));

    const body = document.getElementById("admin-club-list");

    if (clubs.length === 0) {
      body.innerHTML = '<tr><td colspan="5">No clubs found.</td></tr>';
      return;
    }

    body.innerHTML = clubs
      .map(
        (club) => `
            <tr>
                <td>${club.name}</td>
                <td>${club.category}</td>
                <td>${club.memberCount ?? 0}</td>
                <td>${club.active === false ? "Inactive" : "Active"}</td>
                <td>
                    <button class="btn btn-sm btn-primary"
                        data-action="edit" data-id="${club.id}">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger"
                        data-action="delete" data-id="${club.id}">
                        Delete
                    </button>
                </td>
            </tr>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Error loading clubs:", error);
  }
}

async function saveClub(event) {
  event.preventDefault();

  if (!adminReady || !schoolId) return;

  const club = {
    name: document.getElementById("club-name").value.trim(),
    category: document.getElementById("club-category").value.trim(),
    shortDescription: document
      .getElementById("club-short-description")
      .value.trim(),
    description: document.getElementById("club-description").value.trim(),
    memberCount:
      Number(document.getElementById("club-member-count").value.trim()) || 0,
    icon: document.getElementById("club-icon").value.trim(),
    activities: getLines("club-activities"),
    location: document.getElementById("club-location").value.trim(),
    schedule: document.getElementById("club-schedule").value.trim(),
    leader: document.getElementById("club-leader").value.trim(),
    contactEmail: document.getElementById("club-contact-email").value.trim(),
    active: document.getElementById("club-active").checked,
    schoolId: schoolId,
  };

  try {
    if (editingClubId) {
      const snapshot = await getSchoolDocument("clubs", editingClubId);
      await snapshot.update(club);
    } else {
      await db.collection("clubs").add(club);
    }

    adminModal.hide();
    await loadClubs();
    await loadOverviewData();
  } catch (error) {
    console.error("Error saving club:", error);
    alert("Unable to save club.");
  }
}

async function deleteClub(id, name) {
  if (!confirm(`Delete club "${name}"?`)) return;

  try {
    const snapshot = await getSchoolDocument("clubs", id);
    await snapshot.delete();

    await loadClubs();
    await loadOverviewData();
  } catch (error) {
    console.error("Error deleting club:", error);
    alert("Unable to delete club.");
  }
}

// -------------------- EVENTS --------------------

let editingEventId = null;
let eventCache = new Map();

// Open the event form.
// If eventItem exists, its current information will fill the inputs.
function openEventModal(eventItem = null) {
  editingEventId = eventItem ? eventItem.id : null;

  const formHTML = `
        <div class="mb-3">
            <label for="event-title" class="form-label">Event title</label>
            <input id="event-title" class="form-control" type="text"
                value="${eventItem?.title || ""}" required>
        </div>

        <div class="mb-3">
            <label for="event-category" class="form-label">Category</label>
            <input id="event-category" class="form-control" type="text"
                value="${eventItem?.category || ""}">
        </div>

        <div class="mb-3">
            <label for="event-summary" class="form-label">Summary</label>
            <textarea id="event-summary" class="form-control" rows="2">${eventItem?.summary || ""}</textarea>
        </div>

        <div class="mb-3">
            <label for="event-description" class="form-label">Description</label>
            <textarea id="event-description" class="form-control" rows="3">${eventItem?.description || ""}</textarea>
        </div>

        <div class="row">
            <div class="col-md-6 mb-3">
                <label for="event-organizer" class="form-label">Organizer</label>
                <input id="event-organizer" class="form-control" type="text"
                    value="${eventItem?.organizer || ""}">
            </div>

            <div class="col-md-6 mb-3">
                <label for="event-location" class="form-label">Location</label>
                <input id="event-location" class="form-control" type="text"
                    value="${eventItem?.location || ""}">
            </div>
        </div>

        <div class="row">
            <div class="col-md-6 mb-3">
                <label for="event-start" class="form-label">
                    Start date and time
                </label>
                <input id="event-start" class="form-control"
                    type="datetime-local"
                    value="${toLocalDateTime(eventItem?.startAt)}"
                    required>
            </div>

            <div class="col-md-6 mb-3">
                <label for="event-end" class="form-label">
                    End date and time
                </label>
                <input id="event-end" class="form-control"
                    type="datetime-local"
                    value="${toLocalDateTime(eventItem?.endAt)}"
                    required>
            </div>
        </div>

        <div class="mb-3">
            <label for="event-schedule" class="form-label">
                Schedule (e.g. 08:00 AM;Opening Ceremony, one item per line)
            </label>
            <textarea id="event-schedule" class="form-control" rows="3">${
              Array.isArray(eventItem?.schedule)
                ? eventItem.schedule.join("\n")
                : ""
            }</textarea>
        </div>

        <div class="row">
            <div class="col-md-6 mb-3">
                <label for="event-capacity" class="form-label">Capacity</label>
                <input id="event-capacity" class="form-control"
                    type="number" min="0"
                    value="${eventItem?.capacity ?? ""}">
            </div>

            <div class="col-md-6 mb-3">
                <label for="event-status" class="form-label">Status</label>
                <select id="event-status" class="form-select">
                    <option value="draft"
                        ${eventItem?.status === "draft" || !eventItem?.status ? "selected" : ""}>
                        Draft
                    </option>

                    <option value="upcoming"
                        ${eventItem?.status === "upcoming" ? "selected" : ""}>
                        Upcoming
                    </option>

                    <option value="ongoing"
                        ${eventItem?.status === "ongoing" ? "selected" : ""}>
                        Ongoing
                    </option>

                    <option value="completed"
                        ${eventItem?.status === "completed" ? "selected" : ""}>
                        Completed
                    </option>

                    <option value="cancelled"
                        ${eventItem?.status === "cancelled" ? "selected" : ""}>
                        Cancelled
                    </option>
                </select>
            </div>
        </div>

        <div class="form-check">
            <input id="event-registration" class="form-check-input"
                type="checkbox"
                ${
                  eventItem
                    ? eventItem.registration
                      ? "checked"
                      : ""
                    : "checked"
                }>

            <label for="event-registration" class="form-check-label">
                Allow registration
            </label>
        </div>
    `;

  showAdminModal(
    editingEventId ? "Edit Event" : "Add Event",
    formHTML,
    saveEvent,
  );
}

// Load all events belonging to this admin's school.
async function loadEvents() {
  if (!adminReady || !schoolId) return;

  try {
    const snapshot = await db
      .collection("events")
      .where("schoolId", "==", schoolId)
      .get();

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Cache events so we can retrieve their data when Edit is clicked.
    eventCache = new Map(events.map((item) => [item.id, item]));

    const body = document.getElementById("admin-event-list");

    if (events.length === 0) {
      body.innerHTML = '<tr><td colspan="5">No events found.</td></tr>';
      return;
    }

    body.innerHTML = events
      .map((eventItem) => {
        const start = toDate(eventItem.startAt);
        const end = toDate(eventItem.endAt);
        const now = new Date();

        // Use the saved status if available.
        // Otherwise, determine it from the event dates.
        const status =
          eventItem.status ||
          (!start || !end
            ? "draft"
            : end < now
              ? "completed"
              : start > now
                ? "upcoming"
                : "ongoing");

        return `
                <tr>
                    <td>${eventItem.title}</td>

                    <td>
                        ${start?.toLocaleString() || "Not scheduled"}
                    </td>

                    <td>${eventItem.organizer}</td>

                    <td>${status}</td>

                    <td>
                        <button class="btn btn-sm btn-primary"
                            data-action="edit"
                            data-id="${eventItem.id}">
                            Edit
                        </button>

                        <button class="btn btn-sm btn-danger"
                            data-action="delete"
                            data-id="${eventItem.id}">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
      })
      .join("");
  } catch (error) {
    console.error("Error loading events:", error);
  }
}

// Save a new event or update an existing one.
async function saveEvent(event) {
  event.preventDefault();

  if (!adminReady || !schoolId) return;

  const start = new Date(document.getElementById("event-start").value);
  const end = new Date(document.getElementById("event-end").value);

  // Check whether the dates are valid.
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    alert("Please enter valid event dates. The end must be after the start.");
    return;
  }

  const eventData = {
    title: document.getElementById("event-title").value.trim(),
    category: document.getElementById("event-category").value.trim(),
    summary: document.getElementById("event-summary").value.trim(),
    description: document.getElementById("event-description").value.trim(),
    organizer: document.getElementById("event-organizer").value.trim(),
    location: document.getElementById("event-location").value.trim(),

    // Convert JavaScript Dates into Firestore Timestamps.
    startAt: firebase.firestore.Timestamp.fromDate(start),
    endAt: firebase.firestore.Timestamp.fromDate(end),

    schedule: getLines("event-schedule"),

    capacity: document.getElementById("event-capacity").value.trim()
      ? Number(document.getElementById("event-capacity").value.trim())
      : null,

    status: document.getElementById("event-status").value.trim(),

    registration: document.getElementById("event-registration").checked,

    schoolId: schoolId,
  };

  try {
    if (editingEventId) {
      // Update an existing event.
      const ref = await getSchoolDocument("events", editingEventId);

      await ref.update(eventData);
    } else {
      // Create a new event.
      eventData.registeredCount = 0;

      await db.collection("events").add(eventData);
    }

    adminModal.hide();

    await loadEvents();
    await loadOverviewData();
  } catch (error) {
    console.error("Error saving event:", error);
    alert("Unable to save event.");
  }
}

// Delete an event.
async function deleteEvent(id, title) {
  if (!confirm(`Delete event "${title}"?`)) return;

  try {
    const ref = await getSchoolDocument("events", id);

    await ref.delete();

    await loadEvents();
    await loadOverviewData();
  } catch (error) {
    console.error("Error deleting event:", error);
    alert("Unable to delete event.");
  }
}

// ==========================================
// NEWS MANAGEMENT
// ==========================================

let editingNewsId = null;
let newsCache = new Map();

function openNewsModal(newsItem = null) {
  editingNewsId = newsItem ? newsItem.id : null;

  const formHTML = `
        <div class="mb-3">
            <label class="form-label">Title</label>
            <input type="text" id="news-title" class="form-control"
                value="${newsItem?.title || ""}" required>
        </div>

        <div class="mb-3">
            <label class="form-label">Summary</label>
            <textarea id="news-summary" class="form-control" rows="2"
                required>${newsItem?.summary || ""}</textarea>
        </div>

        <div class="mb-3">
            <label class="form-label">Content</label>
            <textarea id="news-content" class="form-control" rows="6"
                required>${newsItem?.content || ""}</textarea>
        </div>

        <div class="mb-3">
            <label class="form-label">Author</label>
            <input type="text" id="news-author" class="form-control"
                value="${newsItem?.author || ""}" required>
        </div>

        <div class="mb-3">
            <label class="form-label">Status</label>
            <select id="news-status" class="form-select">
                <option value="draft"
                    ${newsItem?.status === "draft" ? "selected" : ""}>
                    Draft
                </option>
                <option value="published"
                    ${newsItem?.status === "published" ? "selected" : ""}>
                    Published
                </option>
                <option value="scheduled"
                    ${newsItem?.status === "scheduled" ? "selected" : ""}>
                    Scheduled
                </option>
            </select>
        </div>
    `;

  showAdminModal(editingNewsId ? "Edit News" : "Add News", formHTML, saveNews);
}

// Load all news belonging to this school
async function loadNews() {
  if (!adminReady || !schoolId) return;

  const container = document.getElementById("admin-news-list");

  try {
    const snapshot = await db
      .collection("news")
      .where("schoolId", "==", schoolId)
      .get();

    newsCache.clear();

    const news = snapshot.docs.map((doc) => {
      const item = { id: doc.id, ...doc.data() };
      newsCache.set(doc.id, item);
      return item;
    });

    if (news.length === 0) {
      container.innerHTML = `
                <p class="text-muted">No news articles found.</p>
            `;
      return;
    }

    container.innerHTML = news
      .map(
        (item) => `
            <tr>
                <td>${item.title || ""}</td>
                <td>${item.author || ""}</td>
                <td>${item.status || "draft"}</td>
                <td>
                    <button class="btn btn-sm btn-primary"
                        data-action="edit"
                        data-id="${item.id}">
                        Edit
                    </button>

                    <button class="btn btn-sm btn-danger"
                        data-action="delete"
                        data-id="${item.id}">
                        Delete
                    </button>
                </td>
            </tr>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Error loading news:", error);
    alert("Could not load news articles.");
  }
}

// Save a new article or update an existing one
async function saveNews(event) {
  event.preventDefault();

  if (!adminReady || !schoolId) return;

  const newsData = {
    title: document.getElementById("news-title").value.trim(),
    summary: document.getElementById("news-summary").value.trim(),
    content: document.getElementById("news-content").value.trim(),
    author: document.getElementById("news-author").value.trim(),
    status: document.getElementById("news-status").value.trim(),
    schoolId: schoolId,
  };
  const existingNews = editingNewsId ? newsCache.get(editingNewsId) : null;
  const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();

  newsData.createdAt = existingNews?.createdAt || serverTimestamp;
  newsData.updatedAt = serverTimestamp;
  newsData.publishedAt =
    newsData.status === "published"
      ? existingNews?.status === "published" && existingNews.publishedAt
        ? existingNews.publishedAt
        : serverTimestamp
      : null;

  try {
    if (editingNewsId) {
      const ref = await getSchoolDocument("news", editingNewsId);
      await ref.update(newsData);
    } else {
      await db.collection("news").add(newsData);
    }

    adminModal.hide();
    await loadNews();
  } catch (error) {
    console.error("Error saving news:", error);
    alert("Could not save the news article.");
  }
}

// Delete an article
async function deleteNews(id, title) {
  if (!confirm(`Are you sure you want to delete "${title}"?`)) {
    return;
  }

  try {
    const ref = await getSchoolDocument("news", id);
    await ref.delete();

    await loadNews();
  } catch (error) {
    console.error("Error deleting news:", error);
    alert("Could not delete the news article.");
  }
}

// ==========================================
// CONTENT ACTION LISTENERS
// ==========================================

// Handle Edit and Delete buttons for clubs, events and news
document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("[data-action]");

  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  // Clubs
  if (button.closest("#admin-club-list")) {
    const club = clubCache.get(id);

    if (!club) return;

    if (action === "edit") openClubModal(club);
    if (action === "delete") deleteClub(id, club.name);
  }

  // Events
  if (button.closest("#admin-event-list")) {
    const eventItem = eventCache.get(id);

    if (!eventItem) return;

    if (action === "edit") openEventModal(eventItem);
    if (action === "delete") deleteEvent(id, eventItem.title);
  }

  // News
  if (button.closest("#admin-news-list")) {
    const newsItem = newsCache.get(id);

    if (!newsItem) return;

    if (action === "edit") openNewsModal(newsItem);
    if (action === "delete") deleteNews(id, newsItem.title);
  }
});

// ==========================================
// ADD CONTENT BUTTONS
// ==========================================

document.querySelectorAll("[data-create]").forEach((button) => {
  button.addEventListener("click", () => {
    const type = button.dataset.create;

    if (type === "club") openClubModal();
    if (type === "event") openEventModal();
    if (type === "news") openNewsModal();
  });
});
