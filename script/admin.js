// Switch dashboard sections
const navLinks = document.querySelectorAll("[data-section]");
const sections = document.querySelectorAll(".admin-section");
const pageTitle = document.getElementById("page-title");

let schoolId = "0001";
//
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const sectionName = link.dataset.section;

    document
      .querySelectorAll(".admin-nav-link")
      .forEach((nav) => nav.classList.remove("active"));

    if (link.classList.contains("admin-nav-link")) {
      link.classList.add("active");
    } else {
      document
        .querySelector(`[data-section="${sectionName}"].admin-nav-link`)
        ?.classList.add("active");
    }

    sections.forEach((section) => {
      section.classList.remove("active");
    });
    document.getElementById(`${sectionName}-section`)?.classList.add("active");

    pageTitle.textContent =
      sectionName.charAt(0).toUpperCase() + sectionName.slice(1);

    document.getElementById("admin-sidebar").classList.remove("open");
  });
});

document.getElementById("sidebar-toggle").addEventListener("click", () => {
  document.getElementById("admin-sidebar").classList.toggle("open");
});

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (userDoc) {
      const userRole = userDoc.data().role;
      schoolId = userDoc.data().schoolId;

      if (userRole === 2) {
        console.log("Admin user:", user.email);
      } else {
        console.warn(
          `Unauthorized role ("${userRole}") tried to access dashboard.`,
          user.email,
        );
        window.location.href = "index.html";
      }
    } else {
      console.error("No user profile document found in Firestore.");
      window.location.href = "index.html";
    }
  } else {
    console.warn("No user is signed in. Redirecting to login page.");
    window.location.href = "login.html";
  }
});

function logout() {
  auth
    .signOut()
    .then(() => {
      console.log("User signed out.");
      window.location.href = "login.html";
    })
    .catch((error) => {
      console.error("Error signing out:", error);
    });
}

const logoutButton = document.getElementById("admin-logout");
if (logoutButton) {
  logoutButton.addEventListener("click", logout);
} else {
  console.error("Logout button not found in the DOM.");
}

const totalClubsElement = document.getElementById("total-clubs");
const totalUsersElement = document.getElementById("total-users");
const totalEventsElement = document.getElementById("total-events");
// const totalNewsElement = document.getElementById("total-news");

const overviewEvents = document.getElementById("overview-events");
const overviewClubs = document.getElementById("overview-clubs");

async function loadOverviewData() {
  try {
    const [clubsSnap, usersSnap, eventsSnap] = await Promise.all([
      db.collection("clubs").where("schoolId", "==", schoolId).get(),
      db.collection("users").where("schoolId", "==", schoolId).get(),
      db.collection("events").where("schoolId", "==", schoolId).get(),
    ]);

    const clubsData = clubsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const usersData = usersSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const eventsData = eventsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(clubsData, usersData, eventsData);

    //alert("Clubs Data:\n" + JSON.stringify(clubsData, null, 2));
    //alert("Users Data:\n" + JSON.stringify(usersData, null, 2));
    //alert("Events Data:\n" + JSON.stringify(eventsData, null, 2));

    totalClubsElement.textContent = clubsData?.length || 0;
    totalUsersElement.textContent = usersData?.length || 0;
    totalEventsElement.textContent = eventsData?.length || 0;

    const now = new Date();

    const upcomingEvents = eventsData
      .filter((event) => new Date(event.endAt.seconds * 1000) >= now)
      .sort(
        (a, b) =>
          new Date(a.startAt.seconds * 1000) -
          new Date(b.startAt.seconds * 1000),
      );

    const pastEvents = eventsData
      .filter((event) => new Date(event.endAt.seconds * 1000) < now)
      .sort(
        (a, b) =>
          new Date(b.startAt.seconds * 1000) -
          new Date(a.startAt.seconds * 1000),
      );

    console.log(upcomingEvents, pastEvents);

    if (upcomingEvents.length > 0) {
      overviewEvents.innerHTML = upcomingEvents
        .map(
          (event) => ` 
        <div class="overview-item-content">
          <h4>${event.title}</h4>
          <p>${new Date(event.startAt.seconds * 1000).toLocaleDateString()} - ${new Date(event.endAt.seconds * 1000).toLocaleDateString()}</p>
        </div>
      `,
        )
        .join("");
    } else {
      overviewEvents.innerHTML =
        '<p class="empty-message">No upcoming events.</p>';
    }
  } catch (error) {
    console.error("Error loading admin data:", error);
  }
}
loadOverviewData();

// Initialize Bootstrap modal instances
const contentModal = new bootstrap.Modal(
  document.getElementById("content-modal"),
);
const deleteModal = new bootstrap.Modal(
  document.getElementById("delete-modal"),
);

// DOM Elements
const contentForm = document.getElementById("content-form");
const contentFormFields = document.getElementById("content-form-fields");
const modalTitle = document.getElementById("modal-title");
const confirmDeleteBtn = document.getElementById("confirm-delete");

const contentTypes = {
  club: {
    collection: "clubs",
    label: "Club",
    titleField: "name",
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "category", label: "Category", required: true },
      {
        name: "shortDescription",
        label: "Short description",
        type: "textarea",
      },
      { name: "description", label: "Description", type: "textarea" },
      { name: "memberCount", label: "Members", type: "number", required: true },
      { name: "icon", label: "Icon name" },
      {
        name: "activities",
        label: "Activities (one per line)",
        type: "textarea",
        array: true,
      },
      { name: "location", label: "Location" },
      { name: "schedule", label: "Schedule" },
      { name: "leader", label: "Leader" },
      { name: "contactEmail", label: "Contact email", type: "email" },
      { name: "active", label: "Active", type: "checkbox" },
    ],
  },
  event: {
    collection: "events",
    label: "Event",
    titleField: "title",
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "category", label: "Category", required: true },
      { name: "summary", label: "Summary", type: "textarea" },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        required: true,
      },
      { name: "organizer", label: "Organizer", required: true },
      { name: "location", label: "Location", required: true },
      {
        name: "startAt",
        label: "Start date and time",
        type: "datetime-local",
        required: true,
      },
      {
        name: "endAt",
        label: "End date and time",
        type: "datetime-local",
        required: true,
      },
      {
        name: "schedule",
        label: "Schedule (one item per line)",
        type: "textarea",
        array: true,
      },
      { name: "capacity", label: "Capacity", type: "number" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["draft", "upcoming", "ongoing", "completed", "cancelled"],
      },
      { name: "registration", label: "Registration open", type: "checkbox" },
    ],
  },
  news: {
    collection: "news",
    label: "News",
    titleField: "title",
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "category", label: "Category", required: true },
      { name: "summary", label: "Summary", type: "textarea", required: true },
      {
        name: "content",
        label: "Article content",
        type: "textarea",
        required: true,
      },
      { name: "author", label: "Author", required: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["draft", "published", "scheduled"],
        required: true,
      },
    ],
  },
};

let currentItemId = null;
let currentItemType = null;
const contentCache = {
  club: new Map(),
  event: new Map(),
  news: new Map(),
};

function resolveContentType(type) {
  const filteredType = Object.keys(contentTypes).find(
    (key) => key === type || contentTypes[key].collection === type,
  );
  if (!filteredType) {
    console.error(`Unsupported content type: ${type}`);
    return null;
  }
  return filteredType;
}

function toDate(value) {
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return value ? new Date(value) : null;
}

function toLocalDateTime(value) {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function renderContentField(field, data) {
  const value = data?.[field.name];
  const type = field.type || "text";
  const required = field.required ? "required" : "";
  const label = `<label class="form-label text-white" for="content-${field.name}">${field.label}</label>`;

  if (type === "checkbox") {
    return `
      <div class="form-check mb-3">
        <input class="form-check-input" id="content-${field.name}" type="checkbox" name="${field.name}" ${value ? "checked" : ""}>
        ${label}
      </div>
    `;
  }

  let input;
  if (type === "textarea") {
    const textareaValue =
      field.array && Array.isArray(value) ? value.join("\n") : value;
    input = `<textarea class="form-control" id="content-${field.name}" name="${field.name}" rows="3" ${required}>${textareaValue}</textarea>`;
  } else if (type === "select") {
    const options = field.options
      .map(
        (option) =>
          `<option value="${option}" ${value === option ? "selected" : ""}>${option}</option>`,
      )
      .join("");
    input = `<select class="form-select" id="content-${field.name}" name="${field.name}" ${required}>${options}</select>`;
  } else {
    const inputValue =
      type === "datetime-local" ? toLocalDateTime(value) : value;
    input = `<input class="form-control" id="content-${field.name}" type="${type}" name="${field.name}" value="${inputValue}" ${required}>`;
  }

  return `<div class="mb-3">${label}${input}</div>`;
}

function openContentModal(data = null, type) {
  const contentType = resolveContentType(type);
  if (!contentType) return;

  const config = contentTypes[contentType];
  currentItemType = contentType;
  currentItemId = data?.id || null;
  modalTitle.textContent = `${currentItemId ? "Edit" : "Add"} ${config.label}`;
  contentFormFields.innerHTML = `
    ${config.fields.map((field) => renderContentField(field, data)).join("")}
  `;

  if (!data) {
    const checkbox = contentForm.elements.namedItem(
      contentType === "club" ? "active" : "registration",
    );
    if (checkbox?.type === "checkbox") checkbox.checked = true;
  }

  contentModal.show();
}

function openDeleteModal(id, itemName = "this item", type = currentItemType) {
  const contentType = resolveContentType(type);
  if (!contentType) return;

  currentItemId = id;
  currentItemType = contentType;
  document.getElementById("delete-message").textContent =
    `Are you sure you want to delete "${itemName}"?`;
  deleteModal.show();
}

const buttons = document.querySelectorAll("[data-create]");
buttons.forEach((button) =>
  button.addEventListener("click", () => {
    openContentModal(null, button.dataset.create);
  }),
);

async function loadContentList(type) {
  const contentType = resolveContentType(type);
  if (!contentType) return;

  const tableBodies = {
    club: document.getElementById("admin-club-list"),
    event: document.getElementById("admin-event-list"),
    news: document.getElementById("admin-news-list"),
  };
  const body = tableBodies[contentType];
  if (!body) return;

  try {
    const snapshot = await db
      .collection(contentTypes[contentType].collection)
      .where("schoolId", "==", schoolId)
      .get();
    const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    contentCache[contentType] = new Map(
      records.map((record) => [record.id, record]),
    );

    body.innerHTML = records
      .map((record) => {
        let columns;
        if (contentType === "club") {
          columns = `
            <td>${record.name}</td>
            <td>${record.category}</td>
            <td>${record.memberCount ?? 0}</td>
            <td>${record.active === false ? "Inactive" : "Active"}</td>
          `;
        } else if (contentType === "event") {
          const startAt = toDate(record.startAt);
          const endAt = toDate(record.endAt);
          const now = new Date();
          const status =
            record.status ||
            (startAt && endAt && !Number.isNaN(endAt.getTime())
              ? endAt < now
                ? "completed"
                : startAt > now
                  ? "upcoming"
                  : "ongoing"
              : "draft");
          columns = `
            <td>${record.title}</td>
            <td>${startAt && !Number.isNaN(startAt.getTime()) ? startAt.toLocaleString() : "Not scheduled"}</td>
            <td>${record.organizer}</td>
            <td>${status}</td>
          `;
        } else {
          columns = `
            <td>${record.title}</td>
            <td>${record.category}</td>
            <td>${record.author}</td>
            <td>${record.status || "draft"}</td>
          `;
        }

        return `
          <tr>
            ${columns}
            <td>
              <button class="btn btn-sm btn-primary" data-content-action="edit" data-type="${contentType}" data-id="${record.id}">Edit</button>
              <button class="btn btn-sm btn-danger" data-content-action="delete" data-type="${contentType}" data-id="${record.id}">Delete</button>
            </td>
          </tr>
        `;
      })
      .join("");

    if (records.length === 0) {
      const emptyLabels = { club: "clubs", event: "events", news: "articles" };
      body.innerHTML = `<tr><td colspan="5" class="empty-message">No ${emptyLabels[contentType]} found.</td></tr>`;
    }
  } catch (error) {
    console.error(`Error loading ${contentType} data:`, error);
    body.innerHTML =
      '<tr><td colspan="5" class="empty-message">Unable to load content.</td></tr>';
  }
}

document
  .querySelectorAll("#admin-club-list, #admin-event-list, #admin-news-list")
  .forEach((body) => {
    body.addEventListener("click", (event) => {
      const button = event.target.closest("[data-content-action]");
      if (!button) return;

      const contentType = resolveContentType(button.dataset.type);
      if (!contentType) return;
      const record = contentCache[contentType].get(button.dataset.id);

      if (button.dataset.contentAction === "edit" && record) {
        openContentModal(record, contentType);
      } else if (button.dataset.contentAction === "delete" && record) {
        const title =
          record[contentTypes[contentType].titleField] || "this item";
        openDeleteModal(record.id, title, contentType);
      }
    });
  });

contentForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(contentForm);
  const data = Object.fromEntries(formData.entries());

  if (currentItemType === "club") {
    data.active = contentForm.elements.namedItem("active")?.checked || false;
    data.activities = data.activities
      ? data.activities
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
  } else {
    data.registration =
      contentForm.elements.namedItem("registration")?.checked || false;
  }

  if (data.startAt)
    data.startAt = firebase.firestore.Timestamp.fromDate(
      new Date(data.startAt),
    );
  if (data.endAt)
    data.endAt = firebase.firestore.Timestamp.fromDate(new Date(data.endAt));

  const collection = db
    .collection(currentItemType + "s")
    .where("schoolId", "==", schoolId);

  if (currentItemId) {
    await collection.doc(currentItemId).set(data, { merge: true });
  } else {
    if (currentItemType === "event") data.registeredCount = 0;
    await collection.add(data);
  }

  contentModal.hide();
  loadContentList(currentItemType);
});

confirmDeleteBtn.addEventListener("click", async function () {
  if (currentItemId && currentItemType) {
    const contentType = currentItemType;
    confirmDeleteBtn.disabled = true;
    try {
      await db
        .collection(contentTypes[contentType].collection)
        .where("schoolId", "==", schoolId)
        .doc(currentItemId)
        .delete();
      deleteModal.hide();
      currentItemId = null;
      currentItemType = null;
      await loadContentList(contentType);
    } catch (error) {
      console.error(`Error deleting ${contentType}:`, error);
    } finally {
      confirmDeleteBtn.disabled = false;
    }
  }
});

loadContentList("club");
loadContentList("event");
loadContentList("news");
