const STORAGE_KEYS = {
  users: "feasthouse_users",
  currentUser: "feasthouse_current_user",
  cart: "feasthouse_cart",
  signinState: "feasthouse_signin_state",
};

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const SIGNIN_LOCK_THRESHOLD = 5;
const SIGNIN_LOCK_MS = 5 * 60 * 1000;

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function removeJSON(key) {
  localStorage.removeItem(key);
}

function getUsers() {
  return readJSON(STORAGE_KEYS.users, []);
}

function saveUsers(users) {
  writeJSON(STORAGE_KEYS.users, users);
}

function getCurrentUser() {
  const session = readJSON(STORAGE_KEYS.currentUser, null);
  if (!session || !session.user) {
    return null;
  }
  if (session.expiresAt && Date.now() > session.expiresAt) {
    clearCurrentUser();
    return null;
  }
  return session.user;
}

function setCurrentUser(user) {
  writeJSON(STORAGE_KEYS.currentUser, {
    user,
    token: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
}

function clearCurrentUser() {
  removeJSON(STORAGE_KEYS.currentUser);
}

function getSigninState() {
  return readJSON(STORAGE_KEYS.signinState, {
    failedAttempts: 0,
    lockUntil: 0,
  });
}

function setSigninState(state) {
  writeJSON(STORAGE_KEYS.signinState, state);
}

function clearSigninState() {
  removeJSON(STORAGE_KEYS.signinState);
}

function getCart() {
  return readJSON(STORAGE_KEYS.cart, []);
}

function saveCart(cart) {
  writeJSON(STORAGE_KEYS.cart, cart);
  updateCartBadge();
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

function isValidPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function isValidName(value) {
  return /^[A-Za-zÀ-ÿ\s'-]{2,}$/.test(String(value || "").trim());
}

function parsePrice(value) {
  const match = String(value || "").replace(/[^0-9.]/g, "");
  return Number.parseFloat(match || "0");
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function showMessage(id, text) {
  const box = document.getElementById(id);
  if (!box) return;
  box.textContent = text;
  box.style.display = "block";
}

function hideMessage(id) {
  const box = document.getElementById(id);
  if (!box) return;
  box.style.display = "none";
}

function isProtectedPage() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  return ["index.html", "order.html", "cart.html", ""].includes(page);
}

function isAuthPage() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  return page === "signin.html" || page === "signup.html";
}

function goToSignin() {
  const next = window.location.pathname.split("/").pop() || "index.html";
  const target = next === "signin.html" || next === "signup.html" ? "index.html" : next;
  window.location.href = `signin.html?next=${encodeURIComponent(target)}`;
}

function requireAuth() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  if (!isProtectedPage() || currentPage === "signin.html" || currentPage === "signup.html") {
    return;
  }
  if (!getCurrentUser()) {
    goToSignin();
  }
}

function markActiveNav() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
}

function renderAuthNav() {
  const currentUser = getCurrentUser();
  document.querySelectorAll(".nav-links").forEach((nav) => {
    const signInLink =
      nav.querySelector('a[href="signin.html"]') ||
      nav.querySelector('a[onclick*="show(\'signin\'"]');
    const signUpLink =
      nav.querySelector('a[href="signup.html"]') ||
      nav.querySelector('a[onclick*="show(\'signup\'"]');
    const logoutLink = nav.querySelector('a[href="logout"]');
    const isSpaNav = Boolean(
      nav.querySelector('a[onclick*="show(\'signin\'"]') ||
        nav.querySelector('a[onclick*="show(\'signup\'"]'),
    );

    if (!currentUser) {
      if (isSpaNav) {
        if (signInLink) {
          const signInItem = signInLink.closest("li");
          if (signInItem) signInItem.style.display = "";
        }
        if (signUpLink) {
          const signUpItem = signUpLink.closest("li");
          if (signUpItem) signUpItem.style.display = "";
        }
        if (logoutLink) {
          const logoutItem = logoutLink.closest("li");
          if (logoutItem) logoutItem.style.display = "none";
        }
        return;
      }

      if (logoutLink) {
        const logoutItem = logoutLink.closest("li");
        if (logoutItem) logoutItem.remove();
      }
      if (!signInLink && !signUpLink) {
        nav.insertAdjacentHTML(
          "beforeend",
          '<li><a href="signin.html">Sign In</a></li><li><a href="signup.html">Sign Up</a></li>',
        );
      }
      return;
    }

    if (isSpaNav) {
      if (signInLink) {
        const signInItem = signInLink.closest("li");
        if (signInItem) signInItem.style.display = "none";
      }
      if (signUpLink) {
        const signUpItem = signUpLink.closest("li");
        if (signUpItem) signUpItem.style.display = "none";
      }
      if (!logoutLink) {
        nav.insertAdjacentHTML(
          "beforeend",
          '<li><a href="logout" data-logout-link>Log Out</a></li>',
        );
      } else {
        const logoutItem = logoutLink.closest("li");
        if (logoutItem) logoutItem.style.display = "";
      }
      return;
    }

    if (signInLink) {
      const signInItem = signInLink.closest("li");
      if (signInItem) signInItem.remove();
    }
    if (signUpLink) {
      const signUpItem = signUpLink.closest("li");
      if (signUpItem) signUpItem.remove();
    }
    if (!logoutLink) {
      nav.insertAdjacentHTML(
        "beforeend",
        '<li><a href="logout" data-logout-link>Log Out</a></li>',
      );
    } else {
      const logoutItem = logoutLink.closest("li");
      if (logoutItem) logoutItem.style.display = "";
    }
  });
}

function updateCartBadge() {
  return;
}

function filterMenu(cat, btn) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  if (btn) {
    btn.classList.add("active");
  }
  document.querySelectorAll(".food-card").forEach((card) => {
    card.style.display = cat === "all" || card.dataset.cat === cat ? "block" : "none";
  });
}

function getCartItemFromCard(card) {
  const title = card.querySelector("h4")?.textContent.trim() || "Item";
  const priceText = card.querySelector(".food-price")?.textContent || "$0";
  const image = card.querySelector("img")?.src || "";
  const desc = card.querySelector(".desc")?.textContent.trim() || "";
  const category = card.dataset.cat || "meal";
  return {
    id: `${category}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title,
    price: parsePrice(priceText),
    image,
    desc,
    quantity: 1,
  };
}

function addItemToCart(item) {
  const cart = getCart();
  const existing = cart.find((entry) => entry.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push(item);
  }
  saveCart(cart);
}

function addToCartFromButton(button) {
  const card = button?.closest(".food-card");
  if (!card) {
    return;
  }
  addItemToCart(getCartItemFromCard(card));
  window.location.href = "cart.html";
}

function changeCartQuantity(id, delta) {
  const cart = getCart().map((item) => {
    if (item.id !== id) {
      return item;
    }
    return { ...item, quantity: item.quantity + delta };
  }).filter((item) => item.quantity > 0);
  saveCart(cart);
  renderCartPage();
}

function removeCartItem(id) {
  saveCart(getCart().filter((item) => item.id !== id));
  renderCartPage();
}

function clearCart() {
  saveCart([]);
  renderCartPage();
}

function renderCartPage() {
  const list = document.getElementById("cartItems");
  if (!list) {
    return;
  }

  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = subtotal === 0 ? 0 : subtotal >= 25 ? 0 : 2.99;
  const total = subtotal + delivery;

  const summarySubtotal = document.getElementById("subtotalValue");
  const summaryDelivery = document.getElementById("deliveryValue");
  const summaryTotal = document.getElementById("totalValue");
  const cartCount = document.getElementById("cartCount");
  if (summarySubtotal) summarySubtotal.textContent = money(subtotal);
  if (summaryDelivery) summaryDelivery.textContent = money(delivery);
  if (summaryTotal) summaryTotal.textContent = money(total);
  if (cartCount) cartCount.textContent = String(cart.reduce((sum, item) => sum + item.quantity, 0));

  if (!cart.length) {
    list.innerHTML = `
      <div class="empty-cart">
        <h3>Your cart is empty</h3>
        <p>Pick a meal from the menu and we will bring it here.</p>
        <a class="btn" href="order.html">Browse Menu</a>
      </div>
    `;
    return;
  }

  list.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.title}" />
          <div class="cart-item-body">
            <div class="cart-item-top">
              <div>
                <h4>${item.title}</h4>
                <p>${item.desc}</p>
              </div>
              <button class="icon-btn remove-item" data-item-id="${item.id}" type="button">Remove</button>
            </div>
            <div class="cart-item-bottom">
              <div class="qty-control">
                <button class="qty-btn" data-item-id="${item.id}" data-delta="-1" type="button">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" data-item-id="${item.id}" data-delta="1" type="button">+</button>
              </div>
              <div class="cart-item-price">${money(item.price * item.quantity)}</div>
            </div>
          </div>
        </div>
      `,
    )
    .join("");
}

function submitContact() {
  const first = document.getElementById("cf_first")?.value.trim();
  const last = document.getElementById("cf_last")?.value.trim();
  const email = document.getElementById("cf_email")?.value.trim();
  const subj = document.getElementById("cf_subject")?.value;
  const msg = document.getElementById("cf_msg")?.value.trim();
  const err = document.getElementById("contactError");
  const ok = document.getElementById("contactSuccess");
  if (err) err.style.display = "none";
  if (ok) ok.style.display = "none";
  if (!first || !last || !email || !subj || !msg) {
    if (err) {
      err.textContent = "Please fill in all contact fields.";
      err.style.display = "block";
    }
    return;
  }
  if (ok) {
    ok.style.display = "block";
    setTimeout(() => (ok.style.display = "none"), 5000);
  }
}

function doSignin() {
  const email = normalizeEmail(document.getElementById("si_email")?.value);
  const password = document.getElementById("si_pass")?.value || "";
  const users = getUsers();
  const state = getSigninState();
  hideMessage("signinError");
  hideMessage("signinSuccess");

  if (state.lockUntil && Date.now() < state.lockUntil) {
    const remaining = Math.ceil((state.lockUntil - Date.now()) / 60000);
    showMessage("signinError", `Too many failed attempts. Try again in ${remaining} minute(s).`);
    return;
  }

  if (!email || !password) {
    showMessage("signinError", "Enter your email and password.");
    return;
  }

  const user = users.find((entry) => entry.email === email);
  if (!user || user.password !== password) {
    const nextAttempts = (state.failedAttempts || 0) + 1;
    const lockUntil = nextAttempts >= SIGNIN_LOCK_THRESHOLD ? Date.now() + SIGNIN_LOCK_MS : 0;
    setSigninState({
      failedAttempts: lockUntil ? 0 : nextAttempts,
      lockUntil,
    });
    if (lockUntil) {
      showMessage("signinError", "Too many failed attempts. Please wait 5 minutes and try again.");
      return;
    }
    showMessage("signinError", "Invalid email or password.");
    return;
  }

  clearSigninState();
  setCurrentUser({ firstName: user.firstName, lastName: user.lastName, email: user.email });
  renderAuthNav();
  showMessage("signinSuccess", `Welcome back, ${user.firstName}. Redirecting to home...`);
  const next = new URLSearchParams(window.location.search).get("next") || "index.html";
  setTimeout(() => {
    window.location.href = next;
  }, 900);
}

function quickSignin() {
  doSignin();
}

function doSignup() {
  const firstName = document.getElementById("su_first")?.value.trim();
  const lastName = document.getElementById("su_last")?.value.trim();
  const email = normalizeEmail(document.getElementById("su_email")?.value);
  const phone = document.getElementById("su_phone")?.value.trim();
  const address = document.getElementById("su_address")?.value.trim();
  const password = document.getElementById("su_pass")?.value || "";
  const confirm = document.getElementById("su_confirm")?.value || "";
  const err = document.getElementById("signupError");
  const ok = document.getElementById("signupSuccess");
  hideMessage("signupError");
  hideMessage("signupSuccess");

  if (!firstName || !lastName || !email || !phone || !address || !password || !confirm) {
    showMessage("signupError", "Please complete every signup field.");
    return;
  }
  if (!isValidName(firstName) || !isValidName(lastName)) {
    showMessage("signupError", "Use a real first and last name.");
    return;
  }
  if (!isValidEmail(email)) {
    showMessage("signupError", "Enter a valid email address.");
    return;
  }
  if (!isValidPhone(phone)) {
    showMessage("signupError", "Enter a valid phone number.");
    return;
  }
  if (address.length < 8) {
    showMessage("signupError", "Enter a longer delivery address.");
    return;
  }
  if (password.length < 8) {
    showMessage("signupError", "Password must be at least 8 characters.");
    return;
  }
  if (!isStrongPassword(password)) {
    showMessage(
      "signupError",
      "Password needs uppercase, lowercase, a number, and a symbol.",
    );
    return;
  }
  if (password !== confirm) {
    showMessage("signupError", "Passwords do not match.");
    return;
  }

  const users = getUsers();
  if (users.some((entry) => entry.email === email)) {
    showMessage("signupError", "An account already exists with this email.");
    return;
  }

  users.push({ firstName, lastName, email, phone, address, password });
  saveUsers(users);
  clearSigninState();
  showMessage("signupSuccess", "Account created. Redirecting to sign in...");
  setTimeout(() => {
    window.location.href = "signin.html";
  }, 1100);
}

function quickSignup() {
  doSignup();
}

function placeOrder() {
  const cart = getCart();
  const err = document.getElementById("checkoutError");
  const ok = document.getElementById("checkoutSuccess");
  hideMessage("checkoutError");
  hideMessage("checkoutSuccess");

  if (!cart.length) {
    showMessage("checkoutError", "Your cart is empty.");
    return;
  }

  const fullName = document.getElementById("deliveryName")?.value.trim();
  const phone = document.getElementById("deliveryPhone")?.value.trim();
  const email = document.getElementById("deliveryEmail")?.value.trim();
  const address = document.getElementById("deliveryAddress")?.value.trim();
  const city = document.getElementById("deliveryCity")?.value.trim();
  const method = document.getElementById("paymentMethod")?.value;

  if (!fullName || !phone || !email || !address || !city || !method) {
    showMessage("checkoutError", "Please fill in the delivery details.");
    return;
  }

  writeJSON("feasthouse_last_order", {
    items: cart,
    customer: { fullName, phone, email, address, city, method },
    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    createdAt: new Date().toISOString(),
  });
  saveCart([]);
  if (ok) {
    ok.textContent = "Order placed successfully. We are preparing it now.";
    ok.style.display = "block";
  }
  if (err) {
    err.style.display = "none";
  }
  renderCartPage();
}

function logout() {
  clearCurrentUser();
  renderAuthNav();
  window.location.href = "signin.html";
}

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener(
    "click",
    (event) => {
      const logoutLink = event.target.closest("[data-logout-link]");
      if (!logoutLink) {
        return;
      }
      event.preventDefault();
      logout();
    },
    true,
  );

  markActiveNav();
  requireAuth();
  if (isAuthPage() && getCurrentUser()) {
    window.location.href = "index.html";
    return;
  }
  renderAuthNav();
  updateCartBadge();
  renderCartPage();

  document.addEventListener(
    "click",
    (event) => {
      const cartButton = event.target.closest(".food-grid .food-card .btn");
      if (cartButton) {
        event.preventDefault();
        event.stopPropagation();
        addToCartFromButton(cartButton);
        return;
      }

      const qtyButton = event.target.closest(".qty-btn");
      if (qtyButton) {
        changeCartQuantity(qtyButton.dataset.itemId, Number(qtyButton.dataset.delta || 0));
        return;
      }

      const removeButton = event.target.closest(".remove-item");
      if (removeButton) {
        removeCartItem(removeButton.dataset.itemId);
        return;
      }

      const clearButton = event.target.closest(".clear-cart");
      if (clearButton) {
        clearCart();
      }
    },
    true,
  );
});
