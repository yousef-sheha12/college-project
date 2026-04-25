/* --- مفاتيح التخزين المحلي (LocalStorage Keys) --- */
const KEYS = {
  USERS: "feasthouse_users",
  USER_LOGGED_IN: "feasthouse_current_user",
  CART: "feasthouse_cart",
};

/* --- التحقق من تسجيل الدخول (Authentication Check) --- */
function checkAuth() {
  const user = getData(KEYS.USER_LOGGED_IN, null);
  let currentPage = window.location.pathname.split("/").pop();

  if (currentPage === "") currentPage = "index.html";

  const authPages = ["signin.html", "signup.html"];

  // إذا لم يكن المستخدم مسجلاً وكان في صفحة تتطلب تسجيل دخول، يتم توجيهه لصفحة الدخول
  if (!user && !authPages.includes(currentPage)) {
    window.location.href = "signin.html";
  }
}

/* --- وظائف مساعدة للبيانات والتنسيق (Helper Functions) --- */

// حفظ البيانات في التخزين المحلي
function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// جلب البيانات من التخزين المحلي
function getData(key, defaultValue) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
}

// تنسيق المبالغ المالية
function formatMoney(amount) {
  return "$" + Number(amount).toFixed(2);
}

/* --- إدارة السلة (Cart Management) --- */

function getCart() {
  return getData(KEYS.CART, []);
}

function saveCart(cart) {
  saveData(KEYS.CART, cart);
  renderCart();
}

// إضافة منتج للسلة
function addToCart(product) {
  let cart = getCart();
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    product.quantity = 1;
    cart.push(product);
  }

  saveCart(cart);
  window.location.href = "cart.html";
}

/* --- إدارة المستخدمين (User Management) --- */

function getAllUsers() {
  return getData(KEYS.USERS, []);
}

function getLoggedInUser() {
  return getData(KEYS.USER_LOGGED_IN, null);
}

// تسجيل الخروج
function logout() {
  localStorage.removeItem(KEYS.USER_LOGGED_IN);
  window.location.href = "signin.html";
}

/* --- عمليات تسجيل الدخول (Sign-in Logic) --- */

function doSignin() {
  const emailInput = document
    .getElementById("si_email")
    ?.value.toLowerCase()
    .trim();
  const passInput = document.getElementById("si_pass")?.value;
  const errorBox = document.getElementById("signinError");
  const successBox = document.getElementById("signinSuccess");

  if (!emailInput || !passInput) {
    alert("يرجى إدخال البريد الإلكتروني وكلمة المرور");
    return;
  }

  const users = getAllUsers();
  const foundUser = users.find(
    (u) => u.email === emailInput && u.password === passInput,
  );

  if (foundUser) {
    saveData(KEYS.USER_LOGGED_IN, foundUser);
    if (successBox) successBox.style.display = "block";
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  } else {
    if (errorBox) {
      errorBox.textContent = "بيانات الدخول غير صحيحة!";
      errorBox.style.display = "block";
    }
  }
}

/* --- عمليات إنشاء حساب جديد (Sign-up Logic) --- */

function doSignup() {
  const firstName = document.getElementById("su_first")?.value.trim();
  const lastName = document.getElementById("su_last")?.value.trim();
  const email = document.getElementById("su_email")?.value.toLowerCase().trim();
  const phone = document.getElementById("su_phone")?.value.trim();
  const address = document.getElementById("su_address")?.value.trim();
  const pass = document.getElementById("su_pass")?.value;
  const confirm = document.getElementById("su_confirm")?.value;

  if (!firstName || !lastName || !email || !pass || !confirm) {
    alert("يرجى ملء جميع الخانات الأساسية");
    return;
  }

  if (pass !== confirm) {
    alert("كلمات المرور غير متطابقة");
    return;
  }

  let users = getAllUsers();
  if (users.some((u) => u.email === email)) {
    alert("هذا البريد الإلكتروني مسجل بالفعل!");
    return;
  }

  users.push({ firstName, lastName, email, phone, address, password: pass });
  saveData(KEYS.USERS, users);

  const successBox = document.getElementById("signupSuccess");
  if (successBox) successBox.style.display = "block";

  setTimeout(() => {
    window.location.href = "signin.html";
  }, 1000);
}

/* --- تحديث القائمة العلوية (Update Navbar) --- */

function updateNavbar() {
  const user = getLoggedInUser();
  const navLinks = document.querySelector(".nav-links");
  if (!navLinks) return;

  if (user) {
    // إخفاء أزرار الدخول والتسجيل إذا كان مسجلاً
    const signinLink = navLinks.querySelector('a[href="signin.html"]');
    const signupLink = navLinks.querySelector('a[href="signup.html"]');

    if (signinLink) signinLink.parentElement.style.display = "none";
    if (signupLink) signupLink.parentElement.style.display = "none";

    // إضافة زر تسجيل الخروج مع اسم المستخدم
    if (!document.querySelector(".logout-btn")) {
      const li = document.createElement("li");
      li.innerHTML = `<a href="#" class="logout-btn" onclick="logout()">Logout (${user.firstName})</a>`;
      navLinks.appendChild(li);
    }
  }
}

/* --- عرض محتويات السلة (Render Cart) --- */

function renderCart() {
  const cartItemsBox = document.getElementById("cartItems");
  if (!cartItemsBox) return;

  const cart = getCart();
  if (cart.length === 0) {
    cartItemsBox.innerHTML = "<p class='empty-msg'>سلتك فارغة حالياً.</p>";
    updateCartSummary(0);
    return;
  }

  let total = 0;
  cartItemsBox.innerHTML = cart
    .map((item, index) => {
      total += item.price * item.quantity;
      return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.title}">
        <div class="cart-item-body">
          <h4>${item.title}</h4>
          <p>price : ${formatMoney(item.price)}</p>
          <div class="qty-control">
            <button class="inc-btn" onclick="updateQty(${index}, -1)">-</button>
            <span>${item.quantity}</span>
            <button class="dec-btn" onclick="updateQty(${index}, 1)">+</button>
          </div>
        </div>
        <button class="remove-btn" onclick="removeFromCart(${index})" style="background:#fee2e2; color:#b91c1c; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">حذف</button>
      </div>
    `;
    })
    .join("");

  updateCartSummary(total);
}

/* --- تحديث كمية المنتج أو حذفه (Update Qty / Remove) --- */

window.updateQty = function (index, change) {
  let cart = getCart();
  cart[index].quantity += change;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  saveCart(cart);
};

window.removeFromCart = function (index) {
  let cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
};

/* --- تحديث ملخص السلة (Update Cart Summary) --- */

function updateCartSummary(subtotal) {
  const subE = document.getElementById("subtotalValue");
  const deliveryE = document.getElementById("deliveryValue");
  const totalE = document.getElementById("totalValue");
  const cartCountE = document.getElementById("cartCount");

  if (subE) subE.textContent = formatMoney(subtotal);
  if (deliveryE) deliveryE.textContent = "$0.00";
  if (totalE) totalE.textContent = formatMoney(subtotal);

  const cart = getCart();
  if (cartCountE) {
    const totalQty = cart.reduce((count, item) => count + item.quantity, 0);
    cartCountE.textContent = totalQty;
  }
}

/* --- إتمام الطلب (Place Order Logic) --- */

window.placeOrder = function () {
  const name = document.getElementById("deliveryName")?.value.trim();
  const phone = document.getElementById("deliveryPhone")?.value.trim();
  const address = document.getElementById("deliveryAddress")?.value.trim();
  const cart = getCart();

  if (cart.length === 0) {
    alert("سلتك فارغة!");
    return;
  }

  if (!name || !phone || !address) {
    alert("يرجى ملء بيانات التوصيل الأساسية (الاسم، الهاتف، العنوان)");
    return;
  }

  alert("تم استلام طلبك يا " + name + "! سنتواصل معك قريباً.");
  saveData(KEYS.CART, []);
  window.location.href = "index.html";
};

/* --- تشغيل الوظائف عند تحميل الصفحة (Initialization) --- */

checkAuth();

document.addEventListener("DOMContentLoaded", () => {
  updateNavbar();
  renderCart();

  // تفعيل أزرار "إضافة للسلة" في بطاقات الطعام
  const addButtons = document.querySelectorAll(".food-card .btn");
  addButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".food-card");
      if (!card) return;

      const product = {
        id: card.querySelector("h4").textContent.trim(),
        title: card.querySelector("h4").textContent.trim(),
        price: parseFloat(
          card.querySelector(".food-price").textContent.replace("$", ""),
        ),
        image: card.querySelector("img").src,
      };
      addToCart(product);
    });
  });

  // تفعيل زر مسح السلة
  const clearBtn = document.querySelector(".clear-cart");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("هل تريد بالتأكيد مسح السلة؟")) {
        saveData(KEYS.CART, []);
        renderCart();
      }
    });
  }
});
