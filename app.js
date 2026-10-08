const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem("ife_cart") || "[]")
};

function formatMoney(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));
}

async function loadProducts() {
  const grid = document.getElementById("productGrid");
  const empty = document.getElementById("empty");

  try {
    const response = await fetch(
      `${window.SUPABASE_URL}/rest/v1/ife_products?select=*&archived=eq.false&order=created_at.desc`,
      {
        headers: {
          apikey: window.SUPABASE_PUBLISHABLE_KEY,
          Authorization:
            `Bearer ${window.SUPABASE_PUBLISHABLE_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error("Could not load products");
    }

    state.products = await response.json();

    renderProducts("All");

  } catch (error) {
    console.error("Product loading error:", error);

    grid.innerHTML = "";

    empty.hidden = false;

    empty.innerHTML = `
      <h3>Our collection is loading.</h3>
      <p>Please try again shortly.</p>
    `;
  }
}

function renderProducts(filter = "All") {
  const grid = document.getElementById("productGrid");
  const empty = document.getElementById("empty");

  const products =
    filter === "All"
      ? state.products
      : state.products.filter(
          product => product.category === filter
        );

  grid.innerHTML = products.map(product => {

    const image = product.image_url;

    const outOfStock =
      Number(product.stock) <= 0;

    return `
      <article class="product-card">

        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(product.name)}"
        >

        <div class="product-info">

          <p>
            ${escapeHTML(product.category)}
          </p>

          <h3>
            ${escapeHTML(product.name)}
          </h3>

          <p>
            ${escapeHTML(product.description)}
          </p>

          <div class="product-price">
            ${formatMoney(product.price)}
          </div>

          <button
            class="add-to-cart"
            data-id="${escapeHTML(product.id)}"
            ${outOfStock ? "disabled" : ""}
          >
            ${outOfStock ? "Out of stock" : "Add to bag"}
          </button>

        </div>

      </article>
    `;

  }).join("");

  empty.hidden = products.length > 0;
}

function addToCart(productId) {

  const product =
    state.products.find(
      item => String(item.id) === String(productId)
    );

  if (!product) return;

  if (Number(product.stock) <= 0) {
    alert("Sorry, this product is currently out of stock.");
    return;
  }

  state.cart.push(product);

  saveCart();
  renderCart();

  document
    .getElementById("cartPanel")
    .classList.add("open");
}

function removeFromCart(index) {
  state.cart.splice(index, 1);

  saveCart();
  renderCart();
}

function saveCart() {

  localStorage.setItem(
    "ife_cart",
    JSON.stringify(state.cart)
  );

  document.getElementById("cartCount").textContent =
    state.cart.length;
}

function renderCart() {

  const container =
    document.getElementById("cartItems");

  if (!state.cart.length) {

    container.innerHTML =
      "<p>Your bag is empty.</p>";

  } else {

    container.innerHTML =
      state.cart.map((product, index) => {

        return `
          <div class="cart-row">

            <img
              src="${escapeHTML(product.image_url)}"
              alt="${escapeHTML(product.name)}"
            >

            <div>

              <strong>
                ${escapeHTML(product.name)}
              </strong>

              <p>
                ${formatMoney(product.price)}
              </p>

              <button
                onclick="removeFromCart(${index})"
              >
                Remove
              </button>

            </div>

          </div>
        `;

      }).join("");
  }

  const total =
    state.cart.reduce(
      (sum, product) =>
        sum + Number(product.price || 0),
      0
    );

  document.getElementById("cartTotal").textContent =
    formatMoney(total);

  saveCart();
}

function checkoutWhatsApp() {

  if (!state.cart.length) {
    alert("Your bag is empty.");
    return;
  }

  const total =
    state.cart.reduce(
      (sum, product) =>
        sum + Number(product.price || 0),
      0
    );

  const products =
    state.cart
      .map(product =>
        `• ${product.name} — ${formatMoney(product.price)}`
      )
      .join("\n");

  const message = `
Hello Ife Collection 👋

I would like to place an order.

PRODUCTS
${products}

TOTAL
${formatMoney(total)}

Please confirm availability and delivery details.

Thank you.
  `.trim();

  const whatsappURL =
    `https://wa.me/${window.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  window.open(
    whatsappURL,
    "_blank"
  );
}

document.addEventListener("click", event => {

  if (event.target.matches(".add-to-cart")) {

    addToCart(
      event.target.dataset.id
    );

  }

  if (event.target.matches(".filter")) {

    document
      .querySelectorAll(".filter")
      .forEach(button =>
        button.classList.remove("active")
      );

    event.target.classList.add("active");

    renderProducts(
      event.target.dataset.filter
    );
  }

  const category =
    event.target.closest(".category-card");

  if (category) {

    const filter =
      category.dataset.filter;

    document
      .querySelectorAll(".filter")
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.filter === filter
        );

      });

    renderProducts(filter);
  }
});

document
  .getElementById("cartBtn")
  .addEventListener("click", () => {

    document
      .getElementById("cartPanel")
      .classList.add("open");
  });

document
  .getElementById("closeCart")
  .addEventListener("click", () => {

    document
      .getElementById("cartPanel")
      .classList.remove("open");
  });

document
  .getElementById("checkoutBtn")
  .addEventListener(
    "click",
    checkoutWhatsApp
  );

saveCart();
renderCart();
loadProducts();
