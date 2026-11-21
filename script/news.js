const featuredNewsElement = document.getElementById("featured-news");
const noFeaturedNews = document.getElementById("no-featured-news");
const newsList = document.getElementById("news-list");

function getNewsDate(newsItem) {
  return newsItem.publishedAt?.toDate() || new Date(0);
}

function formatNewsDate(newsItem) {
  if (!newsItem.publishedAt) return "Date not available";

  return newsItem.publishedAt.toDate().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

async function loadNews() {
  newsList.innerHTML = '<p class="news-note">Loading campus news...</p>';

  try {
    const user = auth.currentUser;
    if (!user) return;

    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists || !userDoc.data().schoolId) {
      throw new Error("The current user does not have a school assigned.");
    }

    const snapshot = await db
      .collection("news")
      .where("schoolId", "==", userDoc.data().schoolId)
      .get();

    const publishedNews = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((newsItem) => newsItem.status === "published")
      .sort((a, b) => b.publishedAt.toDate() - a.publishedAt.toDate());

    if (publishedNews.length === 0) {
      featuredNewsElement.hidden = true;
      noFeaturedNews.hidden = false;
      newsList.innerHTML =
        '<p class="news-note">There are no other published stories yet.</p>';
      return;
    }
    const featuredNews = publishedNews[0];
    ((featuredNewsElement.innerHTML = `
            <div class="featured-news-copy">
              <span id="featured-news-category" class="news-category">${featuredNews.category || "Campus News"}</span>
              <h3 id="featured-news-title">${featuredNews.title || "Untitled article"}</h3>
              <p id="featured-news-summary">${featuredNews.summary || "Read the latest from your school."}</p>
              <div class="news-meta">
                <span id="featured-news-author">${featuredNews.author ? `By ${featuredNews.author}` : "CampusConnect"}</span>
                <span id="featured-news-date">${formatNewsDate(featuredNews)}</span>
              </div>
              <a id="featured-news-link" href="./news-detail.html?id=${encodeURIComponent(featuredNews.id)}" class="btn btn-primary">
                Read the story
              </a>
            </div>
            <div class="featured-news-art" aria-hidden="true">
              <i class="fa-regular fa-newspaper"></i>
            </div>
          `),
      (featuredNewsElement.hidden = false));
    noFeaturedNews.hidden = true;

    const newsItems = publishedNews.slice(1);
    if (newsItems.length === 0) {
      newsList.innerHTML =
        '<p class="news-note">There are no other published stories yet.</p>';
      return;
    }

    newsList.innerHTML = newsItems
      .map(
        (newsItem) => `
        <div class="col-12 col-md-6 col-lg-4">
          <article class="news-card">
            <h3>${newsItem.title || "Untitled article"}</h3>
            <p>${newsItem.summary || "Read the latest from your school."}</p>
            <div class="news-meta">
              <span>${newsItem.author ? `By ${newsItem.author}` : "CampusConnect"}</span>
              <span>${formatNewsDate(newsItem)}</span>
            </div>
            <a class="news-card-link" href="./news-detail.html?id=${encodeURIComponent(newsItem.id)}">
              Read story <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </a>
          </article>
        </div>
      `,
      )
      .join("");
  } catch (error) {
    console.error("Could not load campus news:", error);
    featuredNewsElement.hidden = true;
    noFeaturedNews.textContent =
      "We couldn't load campus news. Please try again later.";
    noFeaturedNews.hidden = false;
    newsList.innerHTML = `<p class="news-note">We couldn't load campus news. Please try again later.</p>`;
  }
}

auth.onAuthStateChanged((user) => {
  if (user) loadNews();
});
