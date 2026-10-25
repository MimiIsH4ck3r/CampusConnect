const button = document.getElementById("logout-button");
const requiresAuth = document.body.dataset.authRequired === "true";
let authStateResolved = false;
let pendingDestination = null;

function goToLogin(destination) {
  const target = new URL(destination, window.location.href);
  const returnTo = `${target.pathname}${target.search}${target.hash}`;
  window.location.href = `./login.html?returnTo=${encodeURIComponent(returnTo)}`;
}

async function logout() {
  if (!auth.currentUser) return;
  try {
    await auth.signOut();
    window.location.href = "./index.html";
  } catch (error) {
    console.error("Error logging out:", error);
    alert("Unable to log out. Please try again.");
  }
}

function updateButton(user) {
  button.textContent = user ? "Logout" : "Login";
  button.onclick = user
    ? logout
    : () => {
        window.location.href = "./login.html";
      };
}

document.querySelectorAll("[data-auth-required]").forEach((link) => {
  link.addEventListener("click", (e) => {
    if (authStateResolved && auth.currentUser) return;

    e.preventDefault();

    if (authStateResolved) {
      goToLogin(link.href);
      return;
    }
    pendingDestination = link.href;
  });
});

auth.onAuthStateChanged((user) => {
  authStateResolved = true;
  updateButton(user);

  if (requiresAuth && !user) {
    goToLogin(window.location.href);
    return;
  }

  if (pendingDestination) {
    const destination = pendingDestination;
    pendingDestination = null;
    if (user) {
      window.location.href = destination;
    } else {
      goToLogin(destination);
    }
  }
});
