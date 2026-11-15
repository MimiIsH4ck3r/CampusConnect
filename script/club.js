const clubName = document.getElementById("club-name");
const clubDescription = document.getElementById("club-description");
const clubShortDescription = document.getElementById("club-short-description");
const clubIcon = document.getElementById("club-icon");
const clubCategory = document.getElementById("club-category");
const clubActivities = document.getElementById("club-activities");

const clubMemberCount = document.getElementById("club-members");
const clubLocation = document.getElementById("club-location");
const clubSchedule = document.getElementById("club-schedule");
const clubLeader = document.getElementById("club-leader");

const clubContactEmail = document.getElementById("club-contact-email");

let clubData;
const clubId = new URLSearchParams(window.location.search).get("id");

async function loadClubData() {
  try {
    await db
      .collection("clubs")
      .doc(clubId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          clubData = doc.data();
        } else {
          console.error("No such club document!");
          return;
        }
      });

    clubName.textContent = clubData.name || "Unnamed Club";
    clubDescription.textContent =
      clubData.description || "No description available.";
    clubShortDescription.textContent =
      clubData.shortDescription || "No short description available.";
    clubCategory.textContent = clubData.category || "Uncategorized";
    clubIcon.innerHTML = `<i class="fa-solid fa-${clubData.icon || "users"}"></i>`;

    if (clubData.activities && clubData.activities.length > 0) {
      clubActivities.innerHTML = clubData.activities
        .map(
          (activity) => `
        <div class="activity-item">
          <i class="fa-solid fa-arrow-circle-right"></i>
          <div>
            <h3>${activity.split(";")[0]}</h3>
            <p>${activity.split(";")[1] || ""}</p>
          </div>
        </div>`,
        )
        .join("");
    }

    clubMemberCount.textContent = `${clubData.memberCount ?? 0} members`;
    clubLocation.textContent = clubData.location || "Location not specified";
    clubSchedule.textContent = clubData.schedule || "Schedule not specified";
    clubLeader.textContent = clubData.leader || "Leader not specified";

    clubContactEmail.href = `mailto:${clubData.contactEmail || ""}`;
  } catch (error) {
    console.error("Error loading club data:", error);
  }
}
loadClubData();
