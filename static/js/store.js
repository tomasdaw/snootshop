const CART_KEY = "snoot_cart";

function formatPrice(cents) {
  return "$" + (cents / 100).toFixed(2);
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartUI();
}

function addToCart(productId, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ id: productId, quantity });
  }
  saveCart(cart);
  showToast("Added to cart!");
}

function updateQuantity(productId, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.id === productId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter((i) => i.id !== productId);
  saveCart(cart);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function getCartTotal(products) {
  const cart = getCart();
  return cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
}

function updateCartUI() {
  const count = getCartCount();
  const countEl = document.getElementById("cart-count");
  if (countEl) {
    countEl.textContent = count;
    countEl.classList.toggle("hidden", count === 0);
  }
  renderCartItems();
}

function renderCartItems() {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");
  if (!container) return;

  const cart = getCart();
  const products = window.PRODUCTS || [];

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🐾</div>
        <p>Your cart is empty</p>
        <p style="font-size:0.85rem;margin-top:8px;">Add something your pet will love!</p>
      </div>`;
    if (totalEl) totalEl.textContent = "$0.00";
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  let html = "";
  let total = 0;

  for (const item of cart) {
    const product = products.find((p) => p.id === item.id);
    if (!product) continue;
    const lineTotal = product.price * item.quantity;
    total += lineTotal;
    html += `
      <div class="cart-item" data-id="${product.id}">
        <img class="cart-item-image" src="${product.image}" alt="${product.name}">
        <div class="cart-item-details">
          <div class="cart-item-name">${product.name}</div>
          <div class="cart-item-price">${formatPrice(product.price)}</div>
          <div class="quantity-controls">
            <button class="qty-btn" onclick="updateQuantity('${product.id}', -1)">−</button>
            <span>${item.quantity}</span>
            <button class="qty-btn" onclick="updateQuantity('${product.id}', 1)">+</button>
            <button class="remove-btn" onclick="removeFromCart('${product.id}')">Remove</button>
          </div>
        </div>
      </div>`;
  }

  container.innerHTML = html;
  if (totalEl) totalEl.textContent = formatPrice(total);
  if (checkoutBtn) checkoutBtn.disabled = false;
}

function openCart() {
  document.getElementById("cart-overlay").classList.add("open");
  document.getElementById("cart-drawer").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  document.getElementById("cart-overlay").classList.remove("open");
  document.getElementById("cart-drawer").classList.remove("open");
  document.body.style.overflow = "";
}

async function checkout() {
  const cart = getCart();
  if (cart.length === 0) return;

  const btn = document.getElementById("checkout-btn");
  btn.textContent = "Processing...";
  btn.disabled = true;

  try {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      showToast(data.error || "Checkout failed. Check Stripe setup.");
      btn.textContent = "Checkout";
      btn.disabled = false;
    }
  } catch {
    showToast("Network error. Is the server running?");
    btn.textContent = "Checkout";
    btn.disabled = false;
  }
}

function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

function initGallery() {
  const thumbs = document.querySelectorAll(".gallery-thumb");
  const main = document.getElementById("gallery-main");
  if (!main || thumbs.length === 0) return;

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      thumbs.forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
      main.src = thumb.querySelector("img").src;
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartUI();
  initGallery();

  document.getElementById("cart-btn")?.addEventListener("click", openCart);
  document.getElementById("cart-overlay")?.addEventListener("click", closeCart);
  document.getElementById("close-cart")?.addEventListener("click", closeCart);
  document.getElementById("checkout-btn")?.addEventListener("click", checkout);
});
