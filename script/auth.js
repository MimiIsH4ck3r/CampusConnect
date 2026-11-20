const message = document.getElementById("form-message");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");

function showMessage(msg, isError = true) {
  message.textContent = msg;
  message.style.color = isError ? "red" : "green";
}

function getPostLoginDestination() {
  const returnTo = new URLSearchParams(window.location.search).get("returnTo");
  return returnTo || "./index.html";
}

function loginUser() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password).then((userCredential) => {
    const user = userCredential.user;
    console.log("User logged in:", user);
    showMessage("Login successful!", false);
    setTimeout(() => {
      window.location.href = getPostLoginDestination();
    }, 1500);
  });
}

async function registerUser() {
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const schoolId = document.getElementById("school-id").value;

  if (password !== confirmPassword) {
    showMessage("Your passwords do not match.");
    return;
  }

  if (!schoolId) {
    showMessage("Please choose your school.");
    schoolButton?.focus();
    return;
  }

  if (password.length < 6) {
    showMessage("Password must be at least 6 characters long.");
    return;
  }
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password,
    );
    const user = userCredential.user;
    console.log("User registered:", user);

    await db.collection("users").doc(user.uid).set({
      username: username,
      email: email,
      role: 0,
      schoolId: schoolId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    showMessage("Registration successful!", false);

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  } catch (error) {
    console.error("Error registering user:", error);
    showMessage(error.message);
  }
}

const schoolDropdown = registerForm?.querySelector(".dropdown");
const schoolButton = schoolDropdown?.querySelector(".dropdown-toggle");
const schoolMenu = schoolDropdown?.querySelector(".dropdown-menu");
const schoolIdInput = document.getElementById("school-id");

async function loadSchools() {
  if (!schoolMenu || !schoolButton) return;

  try {
    const querySnapshot = await db.collection("school").get();
    const schoolList = querySnapshot.docs.map((doc) => doc.data());

    if (schoolList.length === 0) {
      schoolButton.textContent = "No schools available";
      schoolButton.disabled = true;
      return;
    }

    schoolMenu.innerHTML = schoolList
      .map(
        (school) =>
          `<li><button type="button" class="dropdown-item" data-school-id="${school.id}">${school.name}</button></li>`,
      )
      .join("");

    schoolButton.disabled = false;
  } catch (error) {
    console.error("Error loading schools:", error);
    schoolButton.textContent = "Schools unavailable";
    schoolButton.disabled = true;
    showMessage("Unable to load schools. Please try again later.");
  }
}

schoolMenu?.addEventListener("click", (event) => {
  const option = event.target.closest("button[data-school-id]");
  if (!option || !schoolIdInput || !schoolButton) return;

  schoolIdInput.value = option.dataset.schoolId;
  schoolButton.textContent = option.textContent;
  showMessage("");
});

loadSchools();
// Event Listeners
registerForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  registerUser();
});

loginForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  loginUser(); // Ensure this function is upgraded to v9+ as well
});
