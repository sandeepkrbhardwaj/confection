import { showToast } from './app.js';

let cart = JSON.parse(localStorage.getItem('c3d_cart')) || [];

// Create a unique key for custom-built sweets based on their design configurations
// This allows grouping identical configurations together in the cart
function generateItemKey(item) {
  if (item.isCustom && item.config) {
    const c = item.config;
    const toppingsStr = (c.toppings || []).sort().join('-');
    return `${item.id || 'custom'}_${c.type}_${c.baseColor.replace('#','')}_${c.icingColor.replace('#','')}_${c.sprinkles}_${toppingsStr}`;
  }
  return item.id || `std_${item.name.replace(/\s+/g, '_')}`;
}

export function getCart() {
  return cart;
}

export function addToCart(product, isCustom = false) {
  const itemToAdd = {
    ...product,
    isCustom,
    // Add generic base ID if standard, or mark custom
    id: product.id || (isCustom ? 'custom_sweet' : `std_${product.name}`),
    quantity: 1
  };
  
  const key = generateItemKey(itemToAdd);
  itemToAdd.cartKey = key;

  const existingIndex = cart.findIndex(item => item.cartKey === key);

  if (existingIndex !== -1) {
    cart[existingIndex].quantity += 1;
  } else {
    cart.push(itemToAdd);
  }

  saveCart();
  updateCartUI();
  showToast(`Added ${product.name} to your sweet bag! 🍰`, 'success');
  
  // Slide open the cart drawer for a highly interactive feedback loop!
  openCartDrawer();
}

export function removeFromCart(cartKey) {
  const item = cart.find(i => i.cartKey === cartKey);
  if (item) {
    cart = cart.filter(i => i.cartKey !== cartKey);
    saveCart();
    updateCartUI();
    showToast(`Removed ${item.name} from your bag.`, 'info');
  }
}

export function updateQuantity(cartKey, change) {
  const item = cart.find(i => i.cartKey === cartKey);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(cartKey);
    } else {
      saveCart();
      updateCartUI();
    }
  }
}

export function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
}

export function getCartTotal() {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function saveCart() {
  localStorage.setItem('c3d_cart', JSON.stringify(cart));
}

// Open and Close drawer helper animations
export function openCartDrawer() {
  document.getElementById('cart-drawer').classList.add('active');
  document.getElementById('cart-drawer-overlay').classList.add('active');
}

export function closeCartDrawer() {
  document.getElementById('cart-drawer').classList.remove('active');
  document.getElementById('cart-drawer-overlay').classList.remove('active');
}

// Dynamic rendering of the Cart Drawer DOM
export function updateCartUI() {
  const itemsContainer = document.getElementById('cart-items-list');
  const badgeCount = document.getElementById('cart-badge-count');
  const navTotal = document.getElementById('cart-total-tag');
  
  const subtotalField = document.getElementById('cart-subtotal');
  const grandTotalField = document.getElementById('cart-grand-total');

  if (!itemsContainer) return; // Views not loaded yet

  const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = getCartTotal();

  // Update navbar tags
  badgeCount.textContent = totalQuantity;
  navTotal.textContent = `$${totalPrice.toFixed(2)}`;

  // Update drawer total calculations
  subtotalField.textContent = `$${totalPrice.toFixed(2)}`;
  grandTotalField.textContent = `$${totalPrice.toFixed(2)}`;

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="empty-cart-state">
        <span class="empty-cart-icon">🍩</span>
        <h4>Your bag is empty!</h4>
        <p>Explore the studio and custom design your own sweets.</p>
        <a href="#shop" class="btn btn-primary" id="cart-explore-btn">Browse Shop</a>
      </div>
    `;
    
    // Wire link button in empty state
    const exploreBtn = document.getElementById('cart-explore-btn');
    if (exploreBtn) {
      exploreBtn.addEventListener('click', (e) => {
        closeCartDrawer();
      });
    }
    return;
  }

  // Populate items
  itemsContainer.innerHTML = cart.map(item => {
    let descSnippet = item.description || "Custom confection creation";
    if (item.isCustom && item.config) {
      const c = item.config;
      descSnippet = `Base: ${c.type} (${c.baseColor}), Icing: ${c.icingColor}, Sprinkles: ${c.sprinkles}`;
      if (c.toppings && c.toppings.length > 0) {
        descSnippet += `, Toppings: ${c.toppings.join(', ')}`;
      }
    }

    return `
      <div class="cart-item" data-key="${item.cartKey}">
        <div class="cart-item-visual">
          ${item.emoji || '🧁'}
        </div>
        <div class="cart-item-details">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-desc">${descSnippet}</div>
          <div class="cart-item-bottom">
            <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            
            <div class="quantity-controls">
              <button class="qty-btn minus-qty" data-key="${item.cartKey}">-</button>
              <span class="qty-num">${item.quantity}</span>
              <button class="qty-btn plus-qty" data-key="${item.cartKey}">+</button>
            </div>
            
            <button class="cart-item-remove remove-item-btn" data-key="${item.cartKey}" title="Remove Item">
              <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Reinitialize icons rendered inside drawer
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Attach event handlers to cart list controls
  itemsContainer.querySelectorAll('.minus-qty').forEach(btn => {
    btn.addEventListener('click', () => updateQuantity(btn.dataset.key, -1));
  });

  itemsContainer.querySelectorAll('.plus-qty').forEach(btn => {
    btn.addEventListener('click', () => updateQuantity(btn.dataset.key, 1));
  });

  itemsContainer.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.key));
  });
}

// Auto wire structural elements
document.addEventListener('DOMContentLoaded', () => {
  const cartBtn = document.getElementById('cart-trigger-btn');
  const closeBtn = document.getElementById('close-cart-btn');
  const overlay = document.getElementById('cart-drawer-overlay');

  if (cartBtn) cartBtn.addEventListener('click', openCartDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);
  if (overlay) overlay.addEventListener('click', closeCartDrawer);

  updateCartUI();
});
