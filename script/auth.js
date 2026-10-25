const message = document.getElementById("form-message");

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

function registerUser() {
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (password !== confirmPassword) {
    showMessage("Your passwords do not match.");
    return;
  }

  auth
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("User registered:", user);
      return db.collection("users").doc(user.uid).set({
        username: username,
        email: email,
        role: "user",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    })
    .then(() => {
      showMessage("Registration successful!", false);
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    })
    .catch((error) => {
      console.error("Error registering user:", error);
      showMessage(error.message);
    });
}

document.getElementById("register-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  registerUser();
});

document.getElementById("login-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  loginUser();
});
