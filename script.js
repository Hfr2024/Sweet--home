const DEFAULT_DATA = {
  site: {
    name: "Sweet Home",
    title: "حلويات تُصنع<br><em>بحب</em> كل يوم.",
    description:
      "اختار من تشكيلتنا من الحلويات الشرقية والغربية والنواعم، وحدد فرعك واستلم طلبك بسهولة.",
    logo: "",
    hero: ""
  },
  products: [],
  branches: [],
  payments: [
    "الدفع عند الاستلام",
    "InstaPay",
    "Vodafone Cash",
    "Visa"
  ],
  delivery: "التوصيل داخل مدينة المنصورة فقط"
};

let D = DEFAULT_DATA;
let cart = [];
let currentCat = "الكل";

const $ = id => document.getElementById(id);

async function loadData() {
  try {
    const r = await fetch("/api/data?x=" + Date.now(), {
      cache: "no-store"
    });

    if (r.ok) {
      D = await r.json();
    }
  } catch (e) {
    D = DEFAULT_DATA;
  }

  render();
}

function money(n) {
  return Number(n || 0).toLocaleString("ar-EG") + " جنيه";
}

function render() {
  if ($("siteName")) $("siteName").textContent = D.site.name || "Sweet Home";

  if ($("siteTitle"))
    $("siteTitle").innerHTML =
      D.site.title || DEFAULT_DATA.site.title;

  if ($("siteDescription"))
    $("siteDescription").textContent =
      D.site.description || DEFAULT_DATA.site.description;

  renderCats();
  renderProducts();
  renderBranches();
  renderCart();
}

function renderCats() {
  const cats = [
    "الكل",
    ...new Set(
      (D.products || [])
        .map(p => p.category)
        .filter(Boolean)
    )
  ];

  const box = $("categories");
  if (!box) return;

  box.innerHTML = cats
    .map(
      c =>
        `<button class="${c === currentCat ? "active" : ""}" onclick="setCat('${String(c).replace(/'/g, "\\'")}')">${c}</button>`
    )
    .join("");
}

function setCat(cat) {
  currentCat = cat;
  renderCats();
  renderProducts();
}

function renderProducts() {
  const box = $("productsGrid");
  if (!box) return;

  const products = (D.products || []).filter(
    p => currentCat === "الكل" || p.category === currentCat
  );

  if (!products.length) {
    box.innerHTML =
      '<div class="empty">لا توجد منتجات في هذا القسم حاليًا.</div>';
    return;
  }

  box.innerHTML = products
    .map(
      p => `
      <div class="product">
        ${
          p.image
            ? `<img src="${p.image}" alt="${p.name || ""}">`
            : `<div class="product-image">Sweet Home</div>`
        }
        <div class="product-info">
          <h3>${p.name || ""}</h3>
          <p>${p.description || ""}</p>
          <strong>${money(p.price)}</strong>
          <button class="btn" onclick="addToCart('${p.id}')">
            أضف للسلة
          </button>
        </div>
      </div>
    `
    )
    .join("");
}

function renderBranches() {
  const grid = $("branchesGrid");

  if (grid) {
    grid.innerHTML = (D.branches || [])
      .map(
        b => `
        <div class="branch">
          <h3>${b.name || ""}</h3>
          <p>📍 ${b.address || ""}</p>
          <a href="tel:${b.phone || ""}">
            📞 ${b.phone || ""}
          </a>
          <a
            target="_blank"
            rel="noopener"
            href="https://wa.me/${normalizeWhatsApp(b.wa || b.whatsapp || b.phone)}"
          >
            واتساب الفرع
          </a>
        </div>
      `
      )
      .join("");
  }

  const select = $("branchSelect");

  if (select) {
    select.innerHTML =
      '<option value="">اختار الفرع</option>' +
      (D.branches || [])
        .map(
          (b, i) =>
            `<option value="${i}">${b.name || ""}</option>`
        )
        .join("");
  }

  const payment = $("paymentSelect");

  if (payment) {
    payment.innerHTML = (D.payments || [])
      .map(p => `<option>${p}</option>`)
      .join("");
  }
}

function addToCart(id) {
  const product = D.products.find(p => String(p.id) === String(id));

  if (!product) return;

  const item = cart.find(x => String(x.id) === String(id));

  if (item) {
    item.qty++;
  } else {
    cart.push({
      id: product.id,
      qty: 1
    });
  }

  saveCart();
  renderCart();
}

function saveCart() {
  try {
    localStorage.setItem("sweet_home_cart", JSON.stringify(cart));
  } catch (e) {}
}

function changeQty(id, amount) {
  const item = cart.find(x => String(x.id) === String(id));

  if (!item) return;

  item.qty += amount;

  if (item.qty <= 0) {
    cart = cart.filter(x => String(x.id) !== String(id));
  }

  saveCart();
  renderCart();
}

function renderCart() {
  const box = $("cartItems");
  const count = $("cartCount");

  if (count) {
    count.textContent = cart.reduce(
      (sum, x) => sum + x.qty,
      0
    );
  }

  if (!box) return;

  if (!cart.length) {
    box.innerHTML = "<p>السلة فارغة.</p>";
    return;
  }

  box.innerHTML = cart
    .map(item => {
      const p = D.products.find(
        x => String(x.id) === String(item.id)
      );

      if (!p) return "";

      return `
        <div class="cart-item">
          <div>
            <strong>${p.name}</strong>
            <div>${money(p.price)}</div>
          </div>

          <div>
            <button onclick="changeQty('${p.id}',-1)">−</button>
            <span>${item.qty}</span>
            <button onclick="changeQty('${p.id}',1)">+</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function openCart() {
  const cartBox = $("cartModal");

  if (cartBox) {
    cartBox.classList.add("open");
  }
}

function closeCart() {
  const cartBox = $("cartModal");

  if (cartBox) {
    cartBox.classList.remove("open");
  }
}

/* إصلاح واتساب */
function normalizeWhatsApp(number) {
  let n = String(number || "").trim();

  n = n.replace(/\D/g, "");

  if (n.startsWith("00")) {
    n = n.substring(2);
  }

  if (n.startsWith("20")) {
    return n;
  }

  if (n.startsWith("0")) {
    return "20" + n.substring(1);
  }

  return n;
}

function sendOrder() {
  if (!cart.length) {
    alert("أضف منتجًا أولاً");
    return;
  }

  const branchSelect = $("branchSelect");
  const customerName = $("customerName");
  const customerPhone = $("customerPhone");
  const customerAddress = $("customerAddress");
  const paymentSelect = $("paymentSelect");

  if (!branchSelect || !branchSelect.value) {
    alert("اختر الفرع أولاً");
    return;
  }

  const branch = D.branches[Number(branchSelect.value)];

  if (!branch) {
    alert("الفرع غير موجود");
    return;
  }

  const wa = normalizeWhatsApp(
    branch.wa || branch.whatsapp || branch.phone
  );

  if (!wa || wa.length < 11) {
    alert("رقم واتساب الفرع غير صحيح. راجع رقم الفرع من لوحة الإدارة.");
    return;
  }

  let total = 0;

  const lines = cart
    .map(item => {
      const p = D.products.find(
        x => String(x.id) === String(item.id)
      );

      if (!p) return "";

      const value = Number(p.price || 0) * Number(item.qty || 0);

      total += value;

      return `• ${p.name} × ${item.qty} = ${value} جنيه`;
    })
    .filter(Boolean)
    .join("\n");

  const message =
`طلب جديد من Sweet Home

الاسم: ${customerName ? customerName.value.trim() : ""}
الموبايل: ${customerPhone ? customerPhone.value.trim() : ""}
العنوان: ${customerAddress ? customerAddress.value.trim() : ""}
الفرع: ${branch.name || ""}
طريقة الدفع: ${paymentSelect ? paymentSelect.value : ""}

المنتجات:
${lines}

الإجمالي: ${total} جنيه

${D.delivery || ""}`;

  const whatsappURL =
    "https://wa.me/" +
    wa +
    "?text=" +
    encodeURIComponent(message);

  window.location.href = whatsappURL;
}

function openAdmin() {
  window.location.href = "?admin=1";
}

async function adminLogin() {
  const passwordInput = $("adminPassword");

  if (!passwordInput) return;

  const password = passwordInput.value;

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        password
      })
    });

    if (response.ok) {
      sessionStorage.setItem(
        "sweet_home_admin",
        password
      );

      window.location.href = "?admin=1";
    } else {
      alert("كلمة المرور غير صحيحة");
    }
  } catch (e) {
    alert("تعذر الاتصال بالخادم");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    const saved = localStorage.getItem("sweet_home_cart");

    if (saved) {
      cart = JSON.parse(saved);
    }
  } catch (e) {
    cart = [];
  }

  loadData();
});
