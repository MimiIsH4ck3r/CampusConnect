const searchInput = document.getElementById("club-search-input");
const clearButton = document.getElementById("clear-search");
const categoryButtons = document.querySelectorAll(".category-button");
const clubList = document.getElementById("club-list");
const clubCount = document.getElementById("club-count");
const resultsHeading = document.getElementById("results-heading");
const noClubs = document.getElementById("no-clubs");
const resetButton = document.getElementById("reset-filters");

let selectedCategory = "all";
let clubs = [];

function showClubs() {
  const searchText = searchInput.value.trim().toLowerCase();

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch = [club.name, club.category, club.description].some(
      (value) =>
        String(value || "")
          .toLowerCase()
          .includes(searchText),
    );

    const matchesCategory =
      selectedCategory === "all" ||
      String(club.category || "").toLowerCase() ===
        selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  clubList.innerHTML = "";

  clubCount.textContent = `${filteredClubs.length} club${filteredClubs.length === 1 ? "" : "s"}`;

  noClubs.classList.toggle("hidden", filteredClubs.length > 0);
  noClubs.hidden = filteredClubs.length > 0;

  if (searchText) {
    resultsHeading.textContent = "Search results";
  } else if (selectedCategory === "all") {
    resultsHeading.textContent = "All clubs";
  } else {
    const activeButton = document.querySelector(".category-button.active");

    resultsHeading.textContent =
      activeButton?.textContent.trim() || "Filtered clubs";
  }

  clubList.innerHTML = filteredClubs
    .map(
      (club) => `
        <div
          class="col-12 col-md-6 col-lg-4 club-result"
          data-category="${club.category || ""}"
        >
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
              ${club.description || "No description available."}
            </p>

            <div class="club-card-footer">
              <span class="club-members">
                <i class="fa-solid fa-user-group"></i>
                ${club.memberCount ?? 0} sample members
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
        </div>
      `,
    )
    .join("");
}

async function loadClubs() {
  clubList.innerHTML = "<p>Loading clubs...</p>";

  try {
    const snapshot = await db
      .collection("clubs")
      .where("active", "==", true)
      .get();

    clubs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    showClubs();
  } catch (error) {
    console.error("Could not load clubs:", error);
    clubList.innerHTML =
      "<p>We couldn't load clubs. Please try again later.</p>";
    clubCount.textContent = "";
  }
}

searchInput.addEventListener("input", showClubs);

clearButton.addEventListener("click", () => {
  searchInput.value = "";
  showClubs();
  searchInput.focus();
});

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedCategory = button.dataset.category;

    categoryButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });

    showClubs();
  });
});

resetButton.addEventListener("click", () => {
  searchInput.value = "";
  selectedCategory = "all";

  categoryButtons.forEach((button) => {
    const active = button.dataset.category === "all";
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  showClubs();
});

loadClubs();
