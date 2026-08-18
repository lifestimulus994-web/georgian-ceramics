const WHATSAPP_NUMBER = "995593613363";

const PRODUCTS = [
  // ჯამები
  { id: 1, name: "თიხის ჯამი „მთა“", category: "bowls", categoryLabel: "ჯამი", price: 45, img: "2611817" },
  { id: 2, name: "მინანქრიანი ჯამი „მწვანე ველი“", category: "bowls", categoryLabel: "ჯამი", price: 52, img: "95218" },
  { id: 3, name: "სუფრის ჯამი „ბუნებრივი“", category: "bowls", categoryLabel: "ჯამი", price: 38, img: "57042" },
  { id: 4, name: "ხელნაკეთი ჯამი „ტკბილეული“", category: "bowls", categoryLabel: "ჯამი", price: 42, img: "4499229" },

  // დოქები
  { id: 5, name: "თიხის დოქი „ქართლი“", category: "jugs", categoryLabel: "დოქი", price: 68, img: "11975310" },
  { id: 6, name: "დოქი „მინიმალი“", category: "jugs", categoryLabel: "დოქი", price: 74, img: "3733769" },
  { id: 7, name: "ხელნაძერწი დოქი „ხალხური“", category: "jugs", categoryLabel: "დოქი", price: 82, img: "8066099" },

  // ჭიქა-ფინჯნები
  { id: 8, name: "ფინჯანი „კახეთი“", category: "mugs", categoryLabel: "ფინჯანი", price: 28, img: "1405761" },
  { id: 9, name: "შავი ფინჯანი „ღამე“", category: "mugs", categoryLabel: "ფინჯანი", price: 26, img: "730286" },
  { id: 10, name: "თეთრი ჭიქა „სუფთა ხაზი“", category: "mugs", categoryLabel: "ჭიქა", price: 24, img: "1693652" },
  { id: 11, name: "ფინჯანი „წითელი მიწა“", category: "mugs", categoryLabel: "ფინჯანი", price: 27, img: "3784328" },
  { id: 12, name: "ფინჯანი თეფშით „ბრუნჩი“", category: "mugs", categoryLabel: "ნაკრები", price: 46, img: "685527" },

  // თეფშები
  { id: 13, name: "თეფშების ნაკრები „საოჯახო“", category: "plates", categoryLabel: "ნაკრები", price: 96, img: "13385627" },
  { id: 14, name: "მრგვალი თეთრი თეფშები", category: "plates", categoryLabel: "თეფშები", price: 58, img: "11065504" },
  { id: 15, name: "მოხატული თეფში „ვაზა-ყვავილი“", category: "plates", categoryLabel: "თეფში", price: 34, img: "11889255" },
  { id: 16, name: "სამზარეულოს ნაკრები „თეთრი“", category: "plates", categoryLabel: "ნაკრები", price: 104, img: "8251822" },

  // ვაზები
  { id: 17, name: "ფერადი ვაზების წყვილი", category: "vases", categoryLabel: "ვაზა", price: 76, img: "4611612" },
  { id: 18, name: "ხელნაკეთი ვაზა „მიწა“", category: "vases", categoryLabel: "ვაზა", price: 64, img: "10011988" },
  { id: 19, name: "თეთრი ვაზა „საოჯახო მაგიდა“", category: "vases", categoryLabel: "ვაზა", price: 58, img: "271696" },
  { id: 20, name: "ვაზა „გამხმარი ყვავილები“", category: "vases", categoryLabel: "ვაზა", price: 49, img: "11372166" },
  { id: 21, name: "თეთრი ვაზა „გაზაფხული“", category: "vases", categoryLabel: "ვაზა", price: 55, img: "7946789" },

  // სასაჩუქრე ნაკრებები
  { id: 22, name: "სასაჩუქრე ნაკრები „კახური“", category: "gifts", categoryLabel: "საჩუქარი", price: 120, img: "18273370" },
  { id: 23, name: "სასაჩუქრე ნაკრები „თბილისური“", category: "gifts", categoryLabel: "საჩუქარი", price: 135, img: "4065905" },
  { id: 24, name: "სასაჩუქრე ყუთი „ხელნაკეთი“", category: "gifts", categoryLabel: "საჩუქარი", price: 150, img: "6608165" },
];

function pexelsUrl(id, w = 600) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
}

function waLink(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function productById(id) {
  return PRODUCTS.find(p => p.id === id);
}

function renderProducts(filter = "all") {
  const grid = document.getElementById("productGrid");
  const items = filter === "all" ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);

  grid.innerHTML = items.map(p => `
    <article class="product-card reveal" data-category="${p.category}">
      <div class="product-media">
        <img src="${pexelsUrl(p.img, 600)}" alt="${p.name}" loading="lazy">
        <span class="product-tag">${p.categoryLabel}</span>
      </div>
      <div class="product-body">
        <h3>${p.name}</h3>
        <div class="product-footer">
          <span class="product-price">${p.price} ₾</span>
          <button class="btn btn-order" data-add-id="${p.id}">
            <svg viewBox="0 0 24 24" class="ico-sm" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            <span class="btn-order-label">დამატება</span>
          </button>
        </div>
      </div>
    </article>
  `).join("");

  observeReveal();
}

// ============ CART ============
const CART_KEY = "gc_cart";
let cart = loadCart();

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(id) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, qty: 1 });
  }
  saveCart();
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
}

function cartTotal() {
  return cart.reduce((sum, item) => {
    const p = productById(item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
}

function cartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function buildCartMessage() {
  const lines = cart.map(item => {
    const p = productById(item.id);
    if (!p) return "";
    return `• ${p.name} x${item.qty} — ${p.price * item.qty} ₾`;
  }).filter(Boolean);
  const total = cartTotal();
  return `გამარჯობა, მინდა შემდეგი პროდუქტების შეკვეთა:\n${lines.join("\n")}\n\nჯამი: ${total} ₾`;
}

function renderCart() {
  const itemsEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const countEl = document.getElementById("cartCount");
  const orderBtn = document.getElementById("cartOrderBtn");
  const drawer = document.getElementById("cartDrawer");

  const count = cartCount();
  countEl.textContent = count;
  countEl.classList.toggle("is-empty", count === 0);
  drawer.classList.toggle("is-empty", cart.length === 0);

  itemsEl.innerHTML = cart.map(item => {
    const p = productById(item.id);
    if (!p) return "";
    return `
      <div class="cart-item" data-id="${p.id}">
        <div class="cart-item-media"><img src="${pexelsUrl(p.img, 200)}" alt="${p.name}"></div>
        <div class="cart-item-body">
          <h4>${p.name}</h4>
          <span class="cart-item-price">${p.price * item.qty} ₾</span>
          <div class="cart-item-qty">
            <button class="cart-qty-btn" data-qty-id="${p.id}" data-delta="-1" aria-label="შემცირება">−</button>
            <span class="cart-qty-val">${item.qty}</span>
            <button class="cart-qty-btn" data-qty-id="${p.id}" data-delta="1" aria-label="გაზრდა">+</button>
          </div>
        </div>
        <button class="cart-item-remove" data-remove-id="${p.id}" aria-label="წაშლა">✕</button>
      </div>
    `;
  }).join("");

  totalEl.textContent = `${cartTotal()} ₾`;
  orderBtn.href = cart.length ? waLink(buildCartMessage()) : "#";
}

function openCart() {
  document.getElementById("cartDrawer").classList.add("is-open");
  document.getElementById("cartOverlay").classList.add("is-open");
  document.getElementById("cartDrawer").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  document.getElementById("cartDrawer").classList.remove("is-open");
  document.getElementById("cartOverlay").classList.remove("is-open");
  document.getElementById("cartDrawer").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function setupCart() {
  document.getElementById("cartBtn").addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  document.getElementById("cartOverlay").addEventListener("click", closeCart);
  document.getElementById("cartClear").addEventListener("click", clearCart);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCart();
  });

  document.getElementById("productGrid").addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add-id]");
    if (!addBtn) return;
    addToCart(Number(addBtn.dataset.addId));
    addBtn.classList.add("is-added");
    const label = addBtn.querySelector(".btn-order-label");
    const prevLabel = label ? label.textContent : "";
    if (label) label.textContent = "დამატებულია";
    setTimeout(() => {
      addBtn.classList.remove("is-added");
      if (label) label.textContent = prevLabel;
    }, 1200);
    openCart();
  });

  document.getElementById("cartItems").addEventListener("click", (e) => {
    const qtyBtn = e.target.closest("[data-qty-id]");
    if (qtyBtn) {
      changeQty(Number(qtyBtn.dataset.qtyId), Number(qtyBtn.dataset.delta));
      return;
    }
    const removeBtn = e.target.closest("[data-remove-id]");
    if (removeBtn) {
      removeFromCart(Number(removeBtn.dataset.removeId));
    }
  });

  renderCart();
}

function setupFilters() {
  const filters = document.getElementById("filters");
  filters.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    filters.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    renderProducts(btn.dataset.filter);
  });
}

let revealObserver;
function observeReveal() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
  }
  document.querySelectorAll(".reveal:not(.is-visible)").forEach(el => revealObserver.observe(el));
}

// Navbar hide on scroll down / show on scroll up — rAF throttled
function setupHeaderScroll() {
  const header = document.getElementById("siteHeader");
  let lastY = window.scrollY;
  let ticking = false;

  function update() {
    const y = window.scrollY;
    if (y > 80 && y > lastY) {
      header.classList.add("is-hidden");
    } else {
      header.classList.remove("is-hidden");
    }
    header.classList.toggle("is-scrolled", y > 20);
    lastY = y;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}

function setupBurger() {
  const burger = document.getElementById("burger");
  const nav = document.getElementById("mainNav");
  burger.addEventListener("click", () => {
    burger.classList.toggle("is-open");
    nav.classList.toggle("is-open");
  });
  nav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      burger.classList.remove("is-open");
      nav.classList.remove("is-open");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderProducts("all");
  setupFilters();
  setupCart();
  setupHeaderScroll();
  setupBurger();
  document.querySelectorAll(".reveal-static").forEach(el => el.classList.add("reveal"));
  observeReveal();
});
