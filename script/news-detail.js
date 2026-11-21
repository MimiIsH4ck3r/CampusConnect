const newsId = new URLSearchParams(window.location.search).get("id");
const newsArticle = document.getElementById("news-article");
const newsError = document.getElementById("news-error");

function showNewsError(message) {
  newsArticle.hidden = true;
  newsError.textContent = message;
  newsError.hidden = false;
}

function formatNewsDate(newsItem) {
  if (!newsItem.publishedAt) return "Date not available";

  return newsItem.publishedAt.toDate().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
async function loadNewsDetails(user) {
  if (!newsId) {
    showNewsError("This news story could not be found.");
    return;
  }

  try {
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists || !userDoc.data().schoolId) {
      throw new Error("The current user does not have a school assigned.");
    }

    const snapshot = await db.collection("news").doc(newsId).get();
    if (
      !snapshot.exists ||
      snapshot.data().schoolId !== userDoc.data().schoolId ||
      snapshot.data().status !== "published"
    ) {
      showNewsError("This news story is unavailable.");
      return;
    }

    const newsItem = snapshot.data();
    document.title = `${newsItem.title || "News Story"} | CampusConnect`;
    document.getElementById("news-title").textContent =
      newsItem.title || "Untitled article";
    document.getElementById("news-summary").textContent =
      newsItem.summary || "";
    document.getElementById("news-author").textContent = newsItem.author
      ? `By ${newsItem.author}`
      : "CampusConnect";
    document.getElementById("news-date").textContent = formatNewsDate(newsItem);
    document.getElementById("news-content").textContent =
      newsItem.content || "No article content available.";

    newsArticle.hidden = false;
    newsError.hidden = true;
  } catch (error) {
    console.error("Could not load news story:", error);
    showNewsError("We couldn't load this news story. Please try again later.");
  }
}

auth.onAuthStateChanged((user) => {
  if (user) loadNewsDetails(user);
});
