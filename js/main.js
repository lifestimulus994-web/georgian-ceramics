const WHATSAPP_NUMBER = "995593613363";

let CATEGORIES = [];
let SUBCATEGORIES = [];
let PRODUCTS = [];

let activeCategory = "all";
let activeSubcategory = "all";
let selectedVariant = {}; // productId -> subcategoryId chosen by the customer

function waLink(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function productById(id) {
  return PRODUCTS.find(p => p.id === id);
}

// ============ LOAD CATALOG FROM SUPABASE ============
async function loadCatalog() {
  const grid = document.getElementById("productGrid");

  const [catRes, subRes, prodRes, imgRes, linkRes] = await Promise.all([
    sb.from("categories").select("id,name,sort_order").order("sort_order"),
    sb.from("subcategories").select("id,category_id,name"),
    sb.from("products").select("id,name,price,category_id,sort_order").order("sort_order"),
    sb.from("product_images").select("id,product_id,url,sort_order").order("sort_order"),
    sb.from("product_subcategories").select("product_id,subcategory_id"),
  ]);

  if (catRes.error || prodRes.error) {
    grid.innerHTML = `<p class="catalog-empty">კატალოგის ჩატვირთვა ვერ მოხერხდა. სცადეთ მოგვიანებით.</p>`;
    return;
  }

  CATEGORIES = catRes.data || [];
  SUBCATEGORIES = subRes.data || [];

  const imagesByProduct = {};
  (imgRes.data || []).forEach(img => {
    (imagesByProduct[img.product_id] ||= []).push(img.url);
  });

  const subsByProduct = {};
  (linkRes.data || []).forEach(l => {
    (subsByProduct[l.product_id] ||= []).push(l.subcategory_id);
  });

  PRODUCTS = (prodRes.data || []).map(p => ({
    ...p,
    images: imagesByProduct[p.id] || [],
    subcategoryIds: subsByProduct[p.id] || [],
  }));

  renderFilters();
  renderProducts();
}

// ============ FILTERS ============
function renderFilters() {
  const filters = document.getElementById("filters");
  const buttons = [`<button class="filter-btn is-active" data-filter="all">ყველა</button>`]
    .concat(CATEGORIES.map(c => `<button class="filter-btn" data-filter="${c.id}">${c.name}</button>`));
  filters.innerHTML = buttons.join("");
  renderSubFilters();
}

function renderSubFilters() {
  const subFilters = document.getElementById("subFilters");
  activeSubcategory = "all";
  if (activeCategory === "all") {
    subFilters.innerHTML = "";
    return;
  }
  const subs = SUBCATEGORIES.filter(s => s.category_id === activeCategory);
  if (!subs.length) {
    subFilters.innerHTML = "";
    return;
  }
  const buttons = [`<button class="filter-btn is-active" data-subfilter="all">ყველა</button>`]
    .concat(subs.map(s => `<button class="filter-btn" data-subfilter="${s.id}">${s.name}</button>`));
  subFilters.innerHTML = buttons.join("");
}

function setupFilters() {
  document.getElementById("filters").addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    document.querySelectorAll("#filters .filter-btn").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    activeCategory = btn.dataset.filter;
    renderSubFilters();
    renderProducts();
  });

  document.getElementById("subFilters").addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    document.querySelectorAll("#subFilters .filter-btn").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    activeSubcategory = btn.dataset.subfilter;
    renderProducts();
  });
}

// ============ PRODUCT GRID ============
function renderProducts() {
  const grid = document.getElementById("productGrid");

  let items = activeCategory === "all" ? PRODUCTS : PRODUCTS.filter(p => p.category_id === activeCategory);
  if (activeSubcategory !== "all") {
    items = items.filter(p => p.subcategoryIds.includes(activeSubcategory));
  }

  if (!items.length) {
    grid.innerHTML = `<p class="catalog-empty">ამ კატეგორიაში ჯერ პროდუქტი არ არის დამატებული.</p>`;
    return;
  }

  grid.innerHTML = items.map(p => {
    const img = p.images[0];
    const category = CATEGORIES.find(c => c.id === p.category_id);
    const variants = p.subcategoryIds
      .map(id => SUBCATEGORIES.find(s => s.id === id))
      .filter(Boolean);

    if (variants.length && !variants.some(v => v.id === selectedVariant[p.id])) {
      selectedVariant[p.id] = variants[0].id;
    }

    return `
    <article class="product-card reveal" data-category="${p.category_id}">
      <div class="product-media">
        ${img ? `<img src="${img}" alt="${p.name}" loading="lazy">` : `<div class="product-media-placeholder"></div>`}
        ${category ? `<span class="product-tag">${category.name}</span>` : ""}
      </div>
      <div class="product-body">
        <h3>${p.name}</h3>
        ${variants.length ? `<div class="product-variants" data-product-id="${p.id}">${variants.map(v => `<button type="button" class="product-subtag${v.id === selectedVariant[p.id] ? " is-selected" : ""}" data-variant-id="${v.id}">${v.name}</button>`).join("")}</div>` : ""}
        <div class="product-footer">
          <span class="product-price">${p.price} ₾</span>
          <button class="btn btn-order" data-add-id="${p.id}">
            <svg viewBox="0 0 24 24" class="ico-sm" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            <span class="btn-order-label">დამატება</span>
          </button>
        </div>
      </div>
    </article>
  `;
  }).join("");

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

function subcategoryName(id) {
  return SUBCATEGORIES.find(s => s.id === id)?.name || "";
}

function addToCart(id, subId = "") {
  const existing = cart.find(item => item.id === id && item.subId === subId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, subId, qty: 1 });
  }
  saveCart();
  renderCart();
}

function changeQty(id, subId, delta) {
  const item = cart.find(i => i.id === id && i.subId === subId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i !== item);
  }
  saveCart();
  renderCart();
}

function removeFromCart(id, subId) {
  cart = cart.filter(i => !(i.id === id && i.subId === subId));
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
    const variant = item.subId ? ` (${subcategoryName(item.subId)})` : "";
    return `• ${p.name}${variant} x${item.qty} — ${p.price * item.qty} ₾`;
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
    const img = p.images[0];
    const variantName = item.subId ? subcategoryName(item.subId) : "";
    return `
      <div class="cart-item" data-id="${p.id}">
        <div class="cart-item-media">${img ? `<img src="${img}" alt="${p.name}">` : ""}</div>
        <div class="cart-item-body">
          <h4>${p.name}${variantName ? ` <span class="cart-item-variant">— ${variantName}</span>` : ""}</h4>
          <span class="cart-item-price">${p.price * item.qty} ₾</span>
          <div class="cart-item-qty">
            <button class="cart-qty-btn" data-qty-id="${p.id}" data-qty-sub="${item.subId}" data-delta="-1" aria-label="შემცირება">−</button>
            <span class="cart-qty-val">${item.qty}</span>
            <button class="cart-qty-btn" data-qty-id="${p.id}" data-qty-sub="${item.subId}" data-delta="1" aria-label="გაზრდა">+</button>
          </div>
        </div>
        <button class="cart-item-remove" data-remove-id="${p.id}" data-remove-sub="${item.subId}" aria-label="წაშლა">✕</button>
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
    const variantBtn = e.target.closest("[data-variant-id]");
    if (variantBtn) {
      const group = variantBtn.closest(".product-variants");
      selectedVariant[group.dataset.productId] = variantBtn.dataset.variantId;
      group.querySelectorAll(".product-subtag").forEach(b => b.classList.remove("is-selected"));
      variantBtn.classList.add("is-selected");
      return;
    }

    const addBtn = e.target.closest("[data-add-id]");
    if (!addBtn) return;
    const productId = addBtn.dataset.addId;
    addToCart(productId, selectedVariant[productId] || "");
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
      changeQty(qtyBtn.dataset.qtyId, qtyBtn.dataset.qtySub, Number(qtyBtn.dataset.delta));
      return;
    }
    const removeBtn = e.target.closest("[data-remove-id]");
    if (removeBtn) {
      removeFromCart(removeBtn.dataset.removeId, removeBtn.dataset.removeSub);
    }
  });

  renderCart();
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
  loadCatalog();
  setupFilters();
  setupCart();
  setupHeaderScroll();
  setupBurger();
  document.querySelectorAll(".reveal-static").forEach(el => el.classList.add("reveal"));
  observeReveal();
});
