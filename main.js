// ===== PAGE NAVIGATION (Multi-page) =====
document.addEventListener("DOMContentLoaded", function () {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
});

// ===== MENU FILTER (Order page) =====
function filterMenu(cat, btn) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".food-card").forEach((card) => {
    card.style.display =
      cat === "all" || card.dataset.cat === cat ? "block" : "none";
  });
}

// ===== CONTACT FORM =====
function submitContact() {
  const first = document.getElementById("cf_first").value.trim();
  const last = document.getElementById("cf_last").value.trim();
  const email = document.getElementById("cf_email").value.trim();
  const subj = document.getElementById("cf_subject").value;
  const msg = document.getElementById("cf_msg").value.trim();
  const err = document.getElementById("contactError");
  const ok = document.getElementById("contactSuccess");
  err.style.display = "none";
  ok.style.display = "none";
  if (!first || !last || !email || !subj || !msg) {
    err.style.display = "block";
    return;
  }
  ok.style.display = "block";
  setTimeout(() => (ok.style.display = "none"), 5000);
}

// ===== SIGN IN =====
function doSignin() {
  const ok = document.getElementById("signinSuccess");
  ok.style.display = "block";
  setTimeout(() => {
    ok.style.display = "none";
  }, 4000);
}
function quickSignin() {
  doSignin();
}

// ===== SIGN UP =====
function doSignup() {
  const ok = document.getElementById("signupSuccess");
  ok.style.display = "block";
  setTimeout(() => (ok.style.display = "none"), 5000);
}
function quickSignup() {
  doSignup();
}
