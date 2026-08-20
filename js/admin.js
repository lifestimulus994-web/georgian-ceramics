const BUCKET = "product-images";

let categories = [];
let subcategories = [];
let products = [];
let editingProductId = null;
let pendingImageFiles = [];

// ============ AUTH ============
async function checkSession() {
  const { data } = await sb.auth.getSession();
  if (data.session) {
    showApp();
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById("loginScreen").hidden = false;
  document.getElementById("adminApp").hidden = true;
}

async function showApp() {
  document.getElementById("loginScreen").hidden = true;
  document.getElementById("adminApp").hidden = false;
  await loadAll();
}

async function login(email, password) {
  const errEl = document.getElementById("loginError");
  errEl.textContent = "";
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    errEl.textContent = "ელფოსტა ან პაროლი არასწორია.";
    return;
  }
  showApp();
}

async function logout() {
  await sb.auth.signOut();
  showLogin();
}

// ============ DATA ============
async function loadAll() {
  const [catRes, subRes, prodRes, imgRes, linkRes] = await Promise.all([
    sb.from("categories").select("id,name,sort_order").order("sort_order"),
    sb.from("subcategories").select("id,category_id,name"),
    sb.from("products").select("id,name,price,category_id,sort_order").order("sort_order"),
    sb.from("product_images").select("id,product_id,url,sort_order").order("sort_order"),
    sb.from("product_subcategories").select("product_id,subcategory_id"),
  ]);

  categories = catRes.data || [];
  subcategories = subRes.data || [];

  const imagesByProduct = {};
  (imgRes.data || []).forEach(img => {
    (imagesByProduct[img.product_id] ||= []).push(img);
  });
  const subsByProduct = {};
  (linkRes.data || []).forEach(l => {
    (subsByProduct[l.product_id] ||= []).push(l.subcategory_id);
  });

  products = (prodRes.data || []).map(p => ({
    ...p,
    images: imagesByProduct[p.id] || [],
    subcategoryIds: subsByProduct[p.id] || [],
  }));

  renderCategorySelects();
  renderCategoryList();
  renderSubcategoryList();
  renderProductList();
}

function categoryName(id) {
  return categories.find(c => c.id === id)?.name || "—";
}

// ============ CATEGORIES ============
function renderCategorySelects() {
  const options = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  document.getElementById("pCategory").innerHTML = options || `<option value="">ჯერ დაამატეთ კატეგორია</option>`;
  document.getElementById("sCategory").innerHTML = options || `<option value="">ჯერ დაამატეთ კატეგორია</option>`;
  renderSubcategoryCheckboxes();
}

function renderCategoryList() {
  const list = document.getElementById("categoryList");
  if (!categories.length) {
    list.innerHTML = `<p class="admin-error" style="color:var(--ink-soft)">კატეგორია ჯერ არ არის დამატებული.</p>`;
    return;
  }
  list.innerHTML = categories.map(c => `
    <div class="admin-list-row">
      <span>${c.name}</span>
      <div class="admin-list-row-actions">
        <button class="btn btn-danger btn-sm" data-delete-category="${c.id}">წაშლა</button>
      </div>
    </div>
  `).join("");
}

async function addCategory(name) {
  const errEl = document.getElementById("categoryError");
  errEl.textContent = "";
  const { error } = await sb.from("categories").insert({ name, sort_order: categories.length });
  if (error) {
    errEl.textContent = "შეცდომა: " + error.message;
    return;
  }
  await loadAll();
}

async function deleteCategory(id) {
  if (!confirm("წავშალო ეს კატეგორია? ქვეკატეგორიებიც წაიშლება.")) return;
  const { error } = await sb.from("categories").delete().eq("id", id);
  if (error) {
    alert("ვერ წაიშალა: ჯერ წაშალეთ ამ კატეგორიის პროდუქტები. (" + error.message + ")");
    return;
  }
  await loadAll();
}

// ============ SUBCATEGORIES ============
function renderSubcategoryList() {
  const list = document.getElementById("subcategoryList");
  if (!subcategories.length) {
    list.innerHTML = `<p class="admin-error" style="color:var(--ink-soft)">ქვეკატეგორია ჯერ არ არის დამატებული.</p>`;
    return;
  }
  list.innerHTML = subcategories.map(s => `
    <div class="admin-list-row">
      <span>${s.name} <em style="color:var(--ink-soft); font-style:normal;">— ${categoryName(s.category_id)}</em></span>
      <div class="admin-list-row-actions">
        <button class="btn btn-danger btn-sm" data-delete-subcategory="${s.id}">წაშლა</button>
      </div>
    </div>
  `).join("");
}

async function addSubcategory(categoryId, name) {
  const errEl = document.getElementById("subcategoryError");
  errEl.textContent = "";
  const { error } = await sb.from("subcategories").insert({ category_id: categoryId, name });
  if (error) {
    errEl.textContent = "შეცდომა: " + error.message;
    return;
  }
  await loadAll();
}

async function deleteSubcategory(id) {
  if (!confirm("წავშალო ეს ქვეკატეგორია?")) return;
  const { error } = await sb.from("subcategories").delete().eq("id", id);
  if (error) {
    alert("ვერ წაიშალა: " + error.message);
    return;
  }
  await loadAll();
}

// ============ PRODUCTS ============
function renderSubcategoryCheckboxes() {
  const wrap = document.getElementById("pSubcategories");
  const categoryId = document.getElementById("pCategory").value;
  const subs = subcategories.filter(s => s.category_id === categoryId);
  if (!subs.length) {
    wrap.innerHTML = `<em>ამ კატეგორიას ქვეკატეგორია არ აქვს</em>`;
    return;
  }
  const editingProduct = editingProductId ? products.find(p => p.id === editingProductId) : null;
  const checkedIds = editingProduct ? editingProduct.subcategoryIds : [];
  wrap.innerHTML = subs.map(s => `
    <label class="admin-checkbox-chip">
      <input type="checkbox" value="${s.id}" ${checkedIds.includes(s.id) ? "checked" : ""}>
      ${s.name}
    </label>
  `).join("");
}

function renderProductList() {
  const list = document.getElementById("productList");
  if (!products.length) {
    list.innerHTML = `<p class="admin-error" style="color:var(--ink-soft)">პროდუქტი ჯერ არ არის დამატებული.</p>`;
    return;
  }
  list.innerHTML = products.map(p => `
    <div class="admin-product-row">
      ${p.images[0] ? `<img src="${p.images[0].url}" class="admin-product-thumb">` : `<div class="admin-product-thumb"></div>`}
      <div class="admin-product-info">
        <strong>${p.name}</strong>
        <span>${categoryName(p.category_id)} · ${p.price} ₾</span>
      </div>
      <div class="admin-product-row-actions">
        <button class="btn btn-ghost btn-sm" data-edit-product="${p.id}">რედაქტირება</button>
        <button class="btn btn-danger btn-sm" data-delete-product="${p.id}">წაშლა</button>
      </div>
    </div>
  `).join("");
}

function storagePathFromUrl(url) {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

function resetProductForm() {
  editingProductId = null;
  pendingImageFiles = [];
  document.getElementById("productForm").reset();
  document.getElementById("productFormTitle").textContent = "ახალი პროდუქტის დამატება";
  document.getElementById("pSubmitBtn").textContent = "დამატება";
  document.getElementById("pCancelBtn").hidden = true;
  document.getElementById("pExistingImages").innerHTML = "";
  renderSubcategoryCheckboxes();
}

function startEditProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  editingProductId = id;
  pendingImageFiles = [];
  document.getElementById("pName").value = p.name;
  document.getElementById("pPrice").value = p.price;
  document.getElementById("pCategory").value = p.category_id;
  renderSubcategoryCheckboxes();
  document.getElementById("productFormTitle").textContent = "პროდუქტის რედაქტირება — " + p.name;
  document.getElementById("pSubmitBtn").textContent = "შენახვა";
  document.getElementById("pCancelBtn").hidden = false;
  document.getElementById("pImages").value = "";
  renderExistingImages(p);
  document.getElementById("productForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderExistingImages(p) {
  const wrap = document.getElementById("pExistingImages");
  wrap.innerHTML = p.images.map(img => `
    <div class="admin-image-thumb">
      <img src="${img.url}">
      <button type="button" data-delete-image="${img.id}" data-image-url="${img.url}">✕</button>
    </div>
  `).join("");
}

async function deleteProductImage(imageId, url) {
  const path = storagePathFromUrl(url);
  await sb.from("product_images").delete().eq("id", imageId);
  if (path) await sb.storage.from(BUCKET).remove([path]);
  const p = products.find(x => x.id === editingProductId);
  if (p) p.images = p.images.filter(img => img.id !== imageId);
  if (p) renderExistingImages(p);
  renderProductList();
}

async function uploadImages(files, productId) {
  const rows = [];
  for (const file of files) {
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file);
    if (error) throw error;
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    rows.push({ product_id: productId, url: data.publicUrl, sort_order: rows.length });
  }
  if (rows.length) {
    const { error } = await sb.from("product_images").insert(rows);
    if (error) throw error;
  }
}

async function saveProduct() {
  const errEl = document.getElementById("productError");
  errEl.textContent = "";

  const name = document.getElementById("pName").value.trim();
  const price = Number(document.getElementById("pPrice").value);
  const categoryId = document.getElementById("pCategory").value;
  const checkedSubs = Array.from(document.querySelectorAll("#pSubcategories input:checked")).map(i => i.value);
  const files = Array.from(document.getElementById("pImages").files || []);

  if (!categoryId) {
    errEl.textContent = "ჯერ დაამატეთ კატეგორია.";
    return;
  }

  try {
    let productId = editingProductId;

    if (productId) {
      const { error } = await sb.from("products").update({ name, price, category_id: categoryId }).eq("id", productId);
      if (error) throw error;
      await sb.from("product_subcategories").delete().eq("product_id", productId);
    } else {
      const { data, error } = await sb.from("products").insert({ name, price, category_id: categoryId, sort_order: products.length }).select().single();
      if (error) throw error;
      productId = data.id;
    }

    if (checkedSubs.length) {
      const { error } = await sb.from("product_subcategories").insert(checkedSubs.map(sid => ({ product_id: productId, subcategory_id: sid })));
      if (error) throw error;
    }

    if (files.length) {
      await uploadImages(files, productId);
    }

    resetProductForm();
    await loadAll();
  } catch (err) {
    errEl.textContent = "შეცდომა: " + err.message;
  }
}

async function deleteProduct(id) {
  if (!confirm("წავშალო ეს პროდუქტი?")) return;
  const p = products.find(x => x.id === id);
  const paths = (p?.images || []).map(img => storagePathFromUrl(img.url)).filter(Boolean);
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) {
    alert("ვერ წაიშალა: " + error.message);
    return;
  }
  if (paths.length) await sb.storage.from(BUCKET).remove(paths);
  if (editingProductId === id) resetProductForm();
  await loadAll();
}

// ============ TABS ============
function setupTabs() {
  document.querySelectorAll(".admin-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("is-active"));
      document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("is-active"));
      tab.classList.add("is-active");
      document.getElementById("tab-" + tab.dataset.tab).classList.add("is-active");
    });
  });
}

// ============ EVENTS ============
function setupEvents() {
  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    login(document.getElementById("loginEmail").value.trim(), document.getElementById("loginPassword").value);
  });

  document.getElementById("logoutBtn").addEventListener("click", logout);

  document.getElementById("categoryForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("cName");
    addCategory(input.value.trim());
    input.value = "";
  });

  document.getElementById("categoryList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-delete-category]");
    if (btn) deleteCategory(btn.dataset.deleteCategory);
  });

  document.getElementById("subcategoryForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const catId = document.getElementById("sCategory").value;
    const input = document.getElementById("sName");
    if (!catId) return;
    addSubcategory(catId, input.value.trim());
    input.value = "";
  });

  document.getElementById("subcategoryList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-delete-subcategory]");
    if (btn) deleteSubcategory(btn.dataset.deleteSubcategory);
  });

  document.getElementById("pCategory").addEventListener("change", renderSubcategoryCheckboxes);

  document.getElementById("productForm").addEventListener("submit", (e) => {
    e.preventDefault();
    saveProduct();
  });

  document.getElementById("pCancelBtn").addEventListener("click", resetProductForm);

  document.getElementById("pExistingImages").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-delete-image]");
    if (!btn) return;
    deleteProductImage(btn.dataset.deleteImage, btn.dataset.imageUrl);
  });

  document.getElementById("productList").addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-edit-product]");
    if (editBtn) return startEditProduct(editBtn.dataset.editProduct);
    const delBtn = e.target.closest("[data-delete-product]");
    if (delBtn) deleteProduct(delBtn.dataset.deleteProduct);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupEvents();
  checkSession();
});
