import { 
  signUp, login, logout, subscribeAuth, 
  subscribeProducts, addProduct, editProduct, deleteProduct,
  subscribeOrders, submitOrder, updateOrderStatus,
  subscribeMaintenanceMode, toggleMaintenanceMode,
  isFirebaseEnabled, saveProfileSettings
} from './firebase-db.js';
import { addToCart, getCart, getCartTotal, clearCart, updateCartUI, openCartDrawer, closeCartDrawer } from './cart.js';
import { initAmbientBackground, initCustomizer3D, initHomeHero3D } from './three-customizer.js';

// App Core State
let currentUser = null;
let productsList = [];
let ordersList = [];
let isMaintenanceActive = false;
let customizerInstance = null;
let currentCustomizerConfig = {
  type: 'donut',
  baseColor: '#e6ad50',
  icingColor: '#ff7597',
  sprinkles: 'rainbow',
  toppings: ['icing']
};

// Available sweets base configuration palettes
const PRESET_COLORS = {
  dough: ['#e6ad50', '#c68a4c', '#5c3816', '#ffeed4'], // Donut bases
  wrapper: ['#ff7597', '#9b51e0', '#00dec7', '#ffffff', '#ffd700', '#222222'], // Cupcake wrappers
  macaron: ['#ff7597', '#8cd67a', '#c2a3e6', '#ffd59e', '#7cc6e6', '#e07a5f'], // Macaron shells
  icing: ['#ff7597', '#ffffff', '#6c5ce7', '#ffd700', '#3d2314', '#00dec7', '#e74c3c'] // Icing / filling cream
};

// ----------------------------------------------------
// TOAST NOTIFICATIONS UTILITY
// ----------------------------------------------------
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'info';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  // Slide out and remove after 3.5s
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
}

// ----------------------------------------------------
// ROUTER & NAVIGATION CONTROLLER
// ----------------------------------------------------
function navigateToHash() {
  const hash = window.location.hash || '#home';
  const viewName = hash.replace('#', '');
  
  // Intercept route if Maintenance Mode is active and user is not an Admin
  if (isMaintenanceActive && (!currentUser || currentUser.role !== 'admin')) {
    if (hash !== '#maintenance') {
      window.location.hash = '#maintenance';
      return;
    }
  } else if (hash === '#maintenance' && (!isMaintenanceActive || (currentUser && currentUser.role === 'admin'))) {
    // Redirect admin/normal users back to home if maintenance is off or they bypass it
    window.location.hash = '#home';
    return;
  }

  // Update navbar active link state
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === hash) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Render view
  loadView(viewName);
}

// Load corresponding HTML layout dynamic structure
function loadView(viewName) {
  const appView = document.getElementById('app-view');
  if (!appView) return;

  // Clear 3D studio references if leaving customizer page
  if (viewName !== 'customizer') {
    customizerInstance = null;
  }

  switch(viewName) {
    case 'home':
      appView.innerHTML = getHomeTemplate();
      // Initialize ambient canvas background once view loads
      initAmbientBackground();
      // Start 3D interactive hero showcase
      setTimeout(() => initHomeHero3D('home-3d-preview'), 50);
      break;
    case 'shop':
      renderShopView(appView);
      break;
    case 'customizer':
      renderCustomizerView(appView);
      break;
    case 'profile':
      renderProfileView(appView);
      break;
    case 'admin':
      renderAdminView(appView);
      break;
    case 'maintenance':
      renderMaintenanceView(appView);
      break;
    default:
      appView.innerHTML = `
        <div class="container text-center" style="padding: 100px 0;">
          <h2>404 Page Not Found 🍩</h2>
          <p>The sweet you are looking for has been eaten.</p>
          <a href="#home" class="btn btn-primary" style="margin-top:20px;">Back Home</a>
        </div>
      `;
  }

  // Refresh Lucide Icons on the rendered page
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ----------------------------------------------------
// PAGE VIEW TEMPLATES & RENDERING FUNCTIONS
// ----------------------------------------------------

// 1. Home View
function getHomeTemplate() {
  return `
    <div class="container">
      <section class="hero-section">
        <div class="hero-content">
          <span class="hero-subtitle">Interactive 3D Sweet Experience</span>
          <h1 class="hero-title">Custom Design Your <span>Sweet Dream</span></h1>
          <p class="hero-description">
            Welcome to Confection3D! We bake customized premium donuts, cupcakes, and macarons configured by you in high-fidelity 3D. Create, customize toppings, select flavors, and order in real-time.
          </p>
          <div class="hero-actions">
            <a href="#customizer" class="btn btn-primary">
              <span>Enter 3D Studio</span>
              <i data-lucide="sparkles"></i>
            </a>
            <a href="#shop" class="btn btn-secondary">Explore Catalog</a>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-3d-canvas-wrapper glass-panel">
            <!-- Floating interactive sweet viewer -->
            <div id="home-3d-preview" style="width: 100%; height: 100%;"></div>
            <div class="hero-badge-floating glass-panel">
              <span class="floating-badge-icon">🍩</span>
              <div>
                <h5 style="font-weight:700;">100% Procedural</h5>
                <p style="font-size:0.8rem; color:var(--text-muted);">Real-time WebGL materials</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Shop Features Section -->
      <section class="features-grid">
        <div class="feature-card glass-panel">
          <div class="feature-icon-wrapper"><i data-lucide="package"></i></div>
          <h3>3D Sweet Builder</h3>
          <p>Choose toppings, base fillings, icing colors, and sprinkles. Watch your candy rotate in real-time before baking.</p>
        </div>
        <div class="feature-card glass-panel">
          <div class="feature-icon-wrapper"><i data-lucide="truck"></i></div>
          <h3>Express Baking</h3>
          <p>Once submitted, our confection chefs bake your customized designs instantly and ship them straight to your door.</p>
        </div>
        <div class="feature-card glass-panel">
          <div class="feature-icon-wrapper"><i data-lucide="shield-check"></i></div>
          <h3>Firebase Authentication</h3>
          <p>Save custom models, track order logs, manage billing details, and customize profiles with cloud sync.</p>
        </div>
      </section>
    </div>
  `;
}

// 2. Shop Catalog View
function renderShopView(appView) {
  appView.innerHTML = `
    <div class="container">
      <div class="shop-header">
        <div class="shop-title-section">
          <h2>Sweet Shop Catalog</h2>
          <p style="color:var(--text-muted);">Pick one of our premium preset bakes, or load them into the 3D Studio to customize!</p>
        </div>
        <div class="shop-filters-wrapper">
          <ul class="shop-filters" id="catalog-filters">
            <li><button class="filter-btn active" data-filter="all">All Sweets</button></li>
            <li><button class="filter-btn" data-filter="donuts">Donuts</button></li>
            <li><button class="filter-btn" data-filter="cupcakes">Cupcakes</button></li>
            <li><button class="filter-btn" data-filter="macarons">Macarons</button></li>
          </ul>
        </div>
      </div>
      
      <div class="products-grid" id="shop-products-grid">
        <div style="grid-column: 1/-1; text-align: center; padding: 50px 0;">
          <div class="spinner" style="margin: 0 auto 20px auto;"></div>
          <p>Retrieving sweet catalog items...</p>
        </div>
      </div>
    </div>
  `;

  // Bind filter buttons
  const filters = document.getElementById('catalog-filters');
  filters.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      displayShopItems(btn.dataset.filter);
    });
  });

  displayShopItems('all');
}

function displayShopItems(filter = 'all') {
  const grid = document.getElementById('shop-products-grid');
  if (!grid) return;

  const filtered = filter === 'all' 
    ? productsList 
    : productsList.filter(p => p.category === filter);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 80px 0;" class="glass-panel">
        <span style="font-size:3.5rem;">🧁</span>
        <h4 style="margin-top:15px; font-weight:700;">No items found!</h4>
        <p style="color:var(--text-muted);">Looks like the catalog is currently empty for this category.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <div class="product-card glass-panel">
      <div class="product-image-container">
        <span class="product-emoji">${item.emoji || '🧁'}</span>
        <span class="product-tag">${item.category}</span>
      </div>
      <div class="product-info">
        <h3 class="product-title">${item.name}</h3>
        <p class="product-desc">${item.description}</p>
        <div class="product-footer">
          <span class="product-price">$${item.price.toFixed(2)}</span>
          <div class="card-actions">
            <!-- Customized editor loader -->
            <button class="card-btn btn-custom load-customizer-btn" data-id="${item.id}" title="Edit in 3D Studio">
              <i data-lucide="edit-3"></i>
            </button>
            <button class="card-btn add-catalog-cart-btn" data-id="${item.id}" title="Add to Bag">
              <i data-lucide="shopping-bag"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();

  // Bind add-to-cart clicks
  grid.querySelectorAll('.add-catalog-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const prod = productsList.find(p => p.id === btn.dataset.id);
      if (prod) addToCart(prod);
    });
  });

  // Bind customizer loader clicks
  grid.querySelectorAll('.load-customizer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const prod = productsList.find(p => p.id === btn.dataset.id);
      if (prod && prod.config) {
        currentCustomizerConfig = { ...prod.config };
        window.location.hash = '#customizer';
      }
    });
  });
}

// 3. 3D Studio Customizer View
function renderCustomizerView(appView) {
  appView.innerHTML = `
    <div class="customizer-layout">
      <!-- 3D Canvas side -->
      <div class="canvas-panel">
        <div class="customizer-canvas-container" id="customizer-canvas"></div>
        
        <!-- Hover camera helpers -->
        <div class="studio-overlay-controls glass-panel">
          <button id="btn-zoom-in" title="Zoom In"><i data-lucide="zoom-in"></i></button>
          <button id="btn-zoom-out" title="Zoom Out"><i data-lucide="zoom-out"></i></button>
          <button id="btn-reset-cam" title="Reset View"><i data-lucide="refresh-cw"></i></button>
        </div>
      </div>

      <!-- Control Settings sidebar -->
      <div class="control-panel">
        <h2>Sweet Designer Studio</h2>
        <p class="subtitle">Bake your creation in interactive real-time 3D</p>
        
        <!-- Base Sweet Type selection -->
        <div class="customizer-section">
          <h4>1. Choose Sweet Type</h4>
          <div class="sweet-type-selector">
            <button class="type-option ${currentCustomizerConfig.type === 'donut' ? 'active' : ''}" data-type="donut">
              <span class="option-emoji">🍩</span>
              <span class="option-name">Donut</span>
            </button>
            <button class="type-option ${currentCustomizerConfig.type === 'cupcake' ? 'active' : ''}" data-type="cupcake">
              <span class="option-emoji">🧁</span>
              <span class="option-name">Cupcake</span>
            </button>
            <button class="type-option ${currentCustomizerConfig.type === 'macaron' ? 'active' : ''}" data-type="macaron">
              <span class="option-emoji">🧆</span>
              <span class="option-name">Macaron</span>
            </button>
          </div>
        </div>

        <!-- Dynamic configs based on type -->
        <div id="dynamic-customizer-controls">
          <!-- Populated dynamically -->
        </div>

        <!-- Add to cart summary section -->
        <div class="customizer-checkout-section">
          <div class="customizer-price-row">
            <span class="price-title">Estimated Price:</span>
            <span class="price-val" id="customizer-calc-price">$5.25</span>
          </div>
          <button class="btn btn-primary btn-add-custom-cart" id="btn-add-customizer-cart">
            <i data-lucide="shopping-bag"></i>
            <span>Add Custom Design to Bag</span>
          </button>
        </div>
      </div>
    </div>
  `;

  // Start 3D viewport canvas
  customizerInstance = initCustomizer3D('customizer-canvas', currentCustomizerConfig);

  // Wires base type selector click listeners
  const panel = appView.querySelector('.control-panel');
  panel.querySelectorAll('.type-option').forEach(btn => {
    btn.addEventListener('click', () => {
      panel.querySelectorAll('.type-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const newType = btn.dataset.type;
      
      // Update default preset color values based on selected shape category
      currentCustomizerConfig.type = newType;
      currentCustomizerConfig.baseColor = newType === 'donut' ? PRESET_COLORS.dough[0] 
                                        : newType === 'cupcake' ? PRESET_COLORS.wrapper[0] 
                                        : PRESET_COLORS.macaron[0];
      currentCustomizerConfig.toppings = newType === 'donut' ? ['icing'] 
                                       : newType === 'cupcake' ? ['cherry', 'cream'] 
                                       : ['cream'];
      currentCustomizerConfig.sprinkles = newType === 'macaron' ? 'none' : 'rainbow';

      renderDynamicControls();
      updateCustomizer3D();
    });
  });

  // Zoom controls wiring
  document.getElementById('btn-zoom-in').addEventListener('click', () => customizerInstance?.zoomIn());
  document.getElementById('btn-zoom-out').addEventListener('click', () => customizerInstance?.zoomOut());
  document.getElementById('btn-reset-cam').addEventListener('click', () => customizerInstance?.resetCamera());

  // Checkout Add Customizer click event
  document.getElementById('btn-add-customizer-cart').addEventListener('click', () => {
    const formattedItem = {
      name: `Custom ${currentCustomizerConfig.type.charAt(0).toUpperCase() + currentCustomizerConfig.type.slice(1)}`,
      description: `User customized 3D design`,
      price: getCustomizerCalculatedPrice(),
      category: `${currentCustomizerConfig.type}s`,
      emoji: currentCustomizerConfig.type === 'donut' ? '🍩' 
             : currentCustomizerConfig.type === 'cupcake' ? '🧁' 
             : '🧆',
      config: { ...currentCustomizerConfig }
    };
    addToCart(formattedItem, true);
  });

  // Render initial dynamic sliders
  renderDynamicControls();
  updateCustomizerPrice();
}

function updateCustomizer3D() {
  if (customizerInstance) {
    customizerInstance.update(currentCustomizerConfig);
    updateCustomizerPrice();
  }
}

function updateCustomizerPrice() {
  const priceField = document.getElementById('customizer-calc-price');
  if (priceField) {
    priceField.textContent = `$${getCustomizerCalculatedPrice().toFixed(2)}`;
  }
}

// Calculate base price + topping increments
function getCustomizerCalculatedPrice() {
  let basePrice = 3.50; // Standard base sweet cost
  if (currentCustomizerConfig.type === 'cupcake') basePrice = 4.25;
  if (currentCustomizerConfig.type === 'macaron') basePrice = 2.95;

  let toppingsCost = 0;
  if (currentCustomizerConfig.sprinkles && currentCustomizerConfig.sprinkles !== 'none') toppingsCost += 0.50;
  
  if (currentCustomizerConfig.toppings) {
    toppingsCost += currentCustomizerConfig.toppings.length * 0.40;
  }
  return basePrice + toppingsCost;
}

// Render configuration inputs depending on type
function renderDynamicControls() {
  const container = document.getElementById('dynamic-customizer-controls');
  if (!container) return;

  const t = currentCustomizerConfig.type;
  
  let baseLabel = "Dough Flavor Color";
  let baseColorsPreset = PRESET_COLORS.dough;
  
  if (t === 'cupcake') {
    baseLabel = "Shiny Cup Liner color";
    baseColorsPreset = PRESET_COLORS.wrapper;
  } else if (t === 'macaron') {
    baseLabel = "Macaron Shell Color";
    baseColorsPreset = PRESET_COLORS.macaron;
  }

  // Set default values if out of bounds
  if (!baseColorsPreset.includes(currentCustomizerConfig.baseColor)) {
    currentCustomizerConfig.baseColor = baseColorsPreset[0];
  }
  if (!PRESET_COLORS.icing.includes(currentCustomizerConfig.icingColor)) {
    currentCustomizerConfig.icingColor = PRESET_COLORS.icing[0];
  }

  let html = `
    <!-- Base Color -->
    <div class="customizer-section">
      <h4>2. ${baseLabel}</h4>
      <div class="color-picker-group">
        ${baseColorsPreset.map(c => `
          <button class="color-option base-color-btn ${currentCustomizerConfig.baseColor === c ? 'active' : ''}" 
            style="background-color: ${c};" data-color="${c}"></button>
        `).join('')}
      </div>
    </div>

    <!-- Icing / Cream Color -->
    <div class="customizer-section">
      <h4>3. ${t === 'macaron' ? 'Cream Filling Flavor' : 'Glaze Icing Flavor'}</h4>
      <div class="color-picker-group">
        ${PRESET_COLORS.icing.map(c => `
          <button class="color-option icing-color-btn ${currentCustomizerConfig.icingColor === c ? 'active' : ''}" 
            style="background-color: ${c};" data-color="${c}"></button>
        `).join('')}
      </div>
    </div>
  `;

  // Sprinkles (Not for macaron)
  if (t !== 'macaron') {
    html += `
      <div class="customizer-section">
        <h4>4. Select Sprinkle Type</h4>
        <div class="sweet-type-selector">
          <button class="type-option sprinkle-btn ${currentCustomizerConfig.sprinkles === 'rainbow' ? 'active' : ''}" data-sprinkles="rainbow">
            <span class="option-emoji">🌈</span>
            <span class="option-name">Rainbow</span>
          </button>
          <button class="type-option sprinkle-btn ${currentCustomizerConfig.sprinkles === 'gold' ? 'active' : ''}" data-sprinkles="gold">
            <span class="option-emoji">✨</span>
            <span class="option-name">Gold Dust</span>
          </button>
          <button class="type-option sprinkle-btn ${currentCustomizerConfig.sprinkles === 'none' ? 'active' : ''}" data-sprinkles="none">
            <span class="option-emoji">❌</span>
            <span class="option-name">None</span>
          </button>
        </div>
      </div>
    `;
  }

  // Topping addons
  const availableToppings = [];
  if (t === 'donut') {
    availableToppings.push({ key: 'icing', label: 'Glaze Drizzle 🍩' });
  } else if (t === 'cupcake') {
    availableToppings.push({ key: 'cream', label: 'Whipped Cream 🍦' });
    availableToppings.push({ key: 'cherry', label: 'Glazed Cherry 🍒' });
  }

  if (availableToppings.length > 0) {
    html += `
      <div class="customizer-section">
        <h4>5. Add Extra Toppings</h4>
        <div class="topping-grid">
          ${availableToppings.map(top => {
            const active = currentCustomizerConfig.toppings.includes(top.key);
            return `
              <div class="topping-checkbox ${active ? 'active' : ''}" data-key="${top.key}">
                <div class="checkbox-dot"></div>
                <span class="topping-name">${top.label}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  // Bind color pickers clicks
  container.querySelectorAll('.base-color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.base-color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCustomizerConfig.baseColor = btn.dataset.color;
      updateCustomizer3D();
    });
  });

  container.querySelectorAll('.icing-color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.icing-color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCustomizerConfig.icingColor = btn.dataset.color;
      updateCustomizer3D();
    });
  });

  // Bind sprinkles clicks
  container.querySelectorAll('.sprinkle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.sprinkle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCustomizerConfig.sprinkles = btn.dataset.sprinkles;
      updateCustomizer3D();
    });
  });

  // Bind topping checklist clicks
  container.querySelectorAll('.topping-checkbox').forEach(box => {
    box.addEventListener('click', () => {
      const key = box.dataset.key;
      let tops = [...currentCustomizerConfig.toppings];
      
      if (tops.includes(key)) {
        tops = tops.filter(k => k !== key);
        box.classList.remove('active');
      } else {
        tops.push(key);
        box.classList.add('active');
      }
      currentCustomizerConfig.toppings = tops;
      updateCustomizer3D();
    });
  });

  if (window.lucide) window.lucide.createIcons();
}

// 4. User Profile & Account Authentication View
function renderProfileView(appView) {
  if (!currentUser) {
    // Show login/sign up selector
    appView.innerHTML = `
      <div class="container">
        <div class="auth-container glass-panel">
          <div class="auth-tabs">
            <button class="auth-tab active" id="auth-login-tab">Login</button>
            <button class="auth-tab" id="auth-signup-tab">Sign Up</button>
          </div>
          
          <!-- Login Form -->
          <form id="login-form">
            <div class="auth-form-group">
              <label for="login-email">Email Address</label>
              <input type="email" id="login-email" class="input-field" placeholder="you@email.com" required autocomplete="username">
            </div>
            <div class="auth-form-group">
              <label for="login-password">Password</label>
              <input type="password" id="login-password" class="input-field" placeholder="••••••••" required autocomplete="current-password">
            </div>
            <button type="submit" class="btn btn-primary btn-auth-submit">
              <span>Sign In</span>
              <i data-lucide="log-in"></i>
            </button>
            <div class="test-creds-box" style="margin-top: 20px; padding: 15px; border-radius: 8px; background: rgba(255,255,255,0.03); border:1px dashed var(--border-light); text-align: center;">
              <p style="font-size:0.8rem; color:var(--text-muted);">Admin demo credentials:</p>
              <p style="font-size:0.85rem; font-family:monospace; margin-top:5px;">admin@confection3d.com / admin123</p>
            </div>
          </form>

          <!-- Signup Form (Hidden initially) -->
          <form id="signup-form" style="display:none;">
            <div class="auth-form-group">
              <label for="signup-name">Display Name</label>
              <input type="text" id="signup-name" class="input-field" placeholder="Your Sweet Name" required autocomplete="name">
            </div>
            <div class="auth-form-group">
              <label for="signup-email">Email Address</label>
              <input type="email" id="signup-email" class="input-field" placeholder="you@email.com" required autocomplete="username">
            </div>
            <div class="auth-form-group">
              <label for="signup-password">Password (min 6 characters)</label>
              <input type="password" id="signup-password" class="input-field" placeholder="••••••••" required minlength="6" autocomplete="new-password">
            </div>
            <button type="submit" class="btn btn-primary btn-auth-submit">
              <span>Create Account</span>
              <i data-lucide="user-plus"></i>
            </button>
          </form>
        </div>
      </div>
    `;

    // Wire auth form tabs switcher
    const loginTab = document.getElementById('auth-login-tab');
    const signupTab = document.getElementById('auth-signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    loginTab.addEventListener('click', () => {
      loginTab.classList.add('active');
      signupTab.classList.remove('active');
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
    });

    signupTab.addEventListener('click', () => {
      signupTab.classList.add('active');
      loginTab.classList.remove('active');
      signupForm.style.display = 'block';
      loginForm.style.display = 'none';
    });

    // Wire submit handles
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const pass = document.getElementById('login-password').value;
      try {
        const user = await login(email, pass);
        showToast(`Welcome back, ${user.displayName}! 🧁`, 'success');
        renderProfileView(appView);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const pass = document.getElementById('signup-password').value;
      try {
        const user = await signUp(email, pass, name);
        showToast(`Welcome to the Sweet Family, ${user.displayName}! 🍩`, 'success');
        renderProfileView(appView);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    if (window.lucide) window.lucide.createIcons();
  } else {
    // Loaded user dashboard view
    const userOrders = ordersList.filter(o => o.userId === currentUser.uid);

    appView.innerHTML = `
      <div class="container">
        <div class="profile-grid">
          <!-- Profile sidebar details -->
          <div class="profile-sidebar glass-panel">
            <div class="profile-avatar-circle">
              ${currentUser.displayName.charAt(0).toUpperCase()}
            </div>
            <h3 class="profile-name">${currentUser.displayName}</h3>
            <p class="profile-email">${currentUser.email}</p>
            
            <div class="profile-actions">
              ${currentUser.role === 'admin' ? `
                <a href="#admin" class="btn btn-accent admin-nav-btn">
                  <i data-lucide="settings"></i>
                  <span>Admin Panel</span>
                </a>
              ` : ''}
              <button class="btn btn-secondary" id="profile-logout-btn">
                <i data-lucide="log-out"></i>
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <!-- User Orders section -->
          <div class="profile-main-content">
            <div class="order-history-panel glass-panel">
              <h3>Your Past Orders</h3>
              <div class="orders-list">
                ${userOrders.length === 0 ? `
                  <div style="text-align: center; padding: 40px 0; color:var(--text-muted);">
                    <p style="font-size:3rem;">🍪</p>
                    <p style="margin-top:10px;">You haven't ordered any sweets yet.</p>
                    <a href="#shop" class="btn btn-primary" style="margin-top:15px;">Shop Sweets</a>
                  </div>
                ` : userOrders.map(order => {
                  const dateStr = new Date(order.date).toLocaleDateString(undefined, { 
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  });
                  return `
                    <div class="order-card">
                      <div class="order-header-row">
                        <span class="order-id">ID: #${order.id}</span>
                        <span class="order-status status-${order.status}">${order.status}</span>
                      </div>
                      <div class="order-items-summary">
                        ${order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                      </div>
                      <div class="order-footer-row">
                        <span class="order-date">${dateStr}</span>
                        <span class="order-total">Total: $${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Profile Settings Panel -->
            <div class="profile-settings-panel glass-panel">
              <h3>Baking & Shipping Preferences</h3>
              <form id="profile-settings-form">
                <div class="auth-form-group">
                  <label for="pref-name">Display Name</label>
                  <input type="text" id="pref-name" class="input-field" value="${currentUser.displayName || ''}" required>
                </div>
                
                <h4 style="color: var(--accent-color); font-size: 1rem; text-transform: uppercase; margin-top: 25px; margin-bottom: 12px; border-bottom: 1px solid var(--border-light); padding-bottom: 5px;">Default Delivery Address</h4>
                
                <div class="auth-form-group">
                  <label for="pref-street">Street Address</label>
                  <input type="text" id="pref-street" class="input-field" value="${currentUser.address?.street || ''}" placeholder="123 Sweet Lane">
                </div>
                
                <div class="form-row-2">
                  <div class="auth-form-group">
                    <label for="pref-city">City</label>
                    <input type="text" id="pref-city" class="input-field" value="${currentUser.address?.city || ''}" placeholder="Confection City">
                  </div>
                  <div class="form-row-2">
                    <div class="auth-form-group">
                      <label for="pref-state">State</label>
                      <input type="text" id="pref-state" class="input-field" value="${currentUser.address?.state || ''}" placeholder="CA">
                    </div>
                    <div class="auth-form-group">
                      <label for="pref-zip">ZIP Code</label>
                      <input type="text" id="pref-zip" class="input-field" value="${currentUser.address?.zip || ''}" placeholder="90210">
                    </div>
                  </div>
                </div>
                
                <button type="submit" class="btn btn-primary" style="margin-top: 15px;">
                  <i data-lucide="save"></i>
                  <span>Save Shipping Preferences</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    // Logout click bind
    document.getElementById('profile-logout-btn').addEventListener('click', async () => {
      await logout();
      showToast("Logged out successfully.", "info");
      window.location.hash = '#home';
    });

    // Wire settings form submit
    const settingsForm = document.getElementById('profile-settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dName = document.getElementById('pref-name').value.trim();
        const street = document.getElementById('pref-street').value.trim();
        const city = document.getElementById('pref-city').value.trim();
        const state = document.getElementById('pref-state').value.trim();
        const zip = document.getElementById('pref-zip').value.trim();
        
        try {
          await saveProfileSettings(currentUser.uid, {
            displayName: dName,
            address: { street, city, state, zip }
          });
          showToast("Shipping preferences updated!", "success");
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }
}

// 5. Admin Dashboard (Catalog editing, orders, toggle maintenance mode)
let activeAdminSubSection = 'catalog'; // 'catalog', 'orders', 'settings'

function renderAdminView(appView) {
  // Access check
  if (!currentUser || currentUser.role !== 'admin') {
    appView.innerHTML = `
      <div class="container text-center" style="padding: 100px 0;">
        <h2>Access Denied 🔒</h2>
        <p>This kitchen is only accessible to executive chefs.</p>
        <a href="#home" class="btn btn-primary" style="margin-top:20px;">Back Home</a>
      </div>
    `;
    return;
  }

  appView.innerHTML = `
    <div class="container">
      <div class="admin-grid">
        <!-- Sidebar Menu -->
        <div class="admin-sidebar-menu">
          <button class="admin-menu-btn ${activeAdminSubSection === 'catalog' ? 'active' : ''}" data-sub="catalog">
            <i data-lucide="package"></i>
            <span>Sweet Catalog</span>
          </button>
          <button class="admin-menu-btn ${activeAdminSubSection === 'orders' ? 'active' : ''}" data-sub="orders">
            <i data-lucide="truck"></i>
            <span>Customer Orders</span>
          </button>
          <button class="admin-menu-btn ${activeAdminSubSection === 'settings' ? 'active' : ''}" data-sub="settings">
            <i data-lucide="sliders"></i>
            <span>Maintenance Controls</span>
          </button>
        </div>

        <!-- Render active sub section content -->
        <div class="admin-content-card glass-panel" id="admin-subview-container">
          <!-- Populated dynamically -->
        </div>
      </div>
    </div>

    <!-- Edit Sweet Modal -->
    <div class="modal-overlay" id="edit-sweet-modal">
      <div class="form-modal-card glass-panel">
        <h3 id="modal-form-title">Add New Sweet</h3>
        <form id="sweet-catalog-form">
          <input type="hidden" id="edit-product-id">
          
          <div class="auth-form-group">
            <label for="field-name">Sweet Name</label>
            <input type="text" id="field-name" class="input-field" required>
          </div>
          
          <div class="auth-form-group">
            <label for="field-desc">Description</label>
            <input type="text" id="field-desc" class="input-field" required>
          </div>

          <div class="form-row-2">
            <div class="auth-form-group">
              <label for="field-category">Category</label>
              <select id="field-category" class="input-field" style="background:#1d0e26; border-color:var(--border-light); color:white;">
                <option value="donuts">Donuts</option>
                <option value="cupcakes">Cupcakes</option>
                <option value="macarons">Macarons</option>
              </select>
            </div>
            <div class="auth-form-group">
              <label for="field-price">Price ($)</label>
              <input type="number" id="field-price" class="input-field" step="0.01" required>
            </div>
          </div>

          <div class="form-row-2">
            <div class="auth-form-group">
              <label for="field-emoji">Emoji Icon</label>
              <input type="text" id="field-emoji" class="input-field" placeholder="🍩" required>
            </div>
            <div class="auth-form-group">
              <label for="field-sprinkles">Sprinkle Preset</label>
              <select id="field-sprinkles" class="input-field" style="background:#1d0e26; border-color:var(--border-light); color:white;">
                <option value="none">None</option>
                <option value="rainbow">Rainbow</option>
                <option value="gold">Gold Dust</option>
                <option value="chocolate">Chocolate</option>
              </select>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btn-close-modal">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Bind sidebar buttons
  const grid = appView.querySelector('.admin-grid');
  grid.querySelectorAll('.admin-menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      grid.querySelectorAll('.admin-menu-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeAdminSubSection = btn.dataset.sub;
      renderAdminSubView();
    });
  });

  renderAdminSubView();
}

function renderAdminSubView() {
  const container = document.getElementById('admin-subview-container');
  if (!container) return;

  // Calculate dynamic stats
  const totalRevenue = ordersList.reduce((acc, o) => acc + o.total, 0);
  const totalOrders = ordersList.length;
  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
  const activeOrdersCount = ordersList.filter(o => o.status !== 'delivered').length;

  const statsHtml = `
    <div class="admin-stats-row">
      <div class="admin-stat-card glass-panel">
        <div class="admin-stat-number">$${totalRevenue.toFixed(2)}</div>
        <div class="admin-stat-label">Revenue</div>
      </div>
      <div class="admin-stat-card glass-panel">
        <div class="admin-stat-number">${totalOrders}</div>
        <div class="admin-stat-label">Orders</div>
      </div>
      <div class="admin-stat-card glass-panel">
        <div class="admin-stat-number">$${avgOrderValue.toFixed(2)}</div>
        <div class="admin-stat-label">Avg Order</div>
      </div>
      <div class="admin-stat-card glass-panel">
        <div class="admin-stat-number">${activeOrdersCount}</div>
        <div class="admin-stat-label">Active Bakes</div>
      </div>
    </div>
  `;

  if (activeAdminSubSection === 'catalog') {
    container.innerHTML = statsHtml + `
      <div class="admin-section-header" style="margin-top: 25px;">
        <h3>Catalog Manager</h3>
        <button class="btn btn-primary" id="btn-add-product">
          <i data-lucide="plus"></i>
          <span>Add Sweet</span>
        </button>
      </div>
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${productsList.map(p => `
              <tr>
                <td><span class="admin-table-emoji">${p.emoji || '🧁'}</span></td>
                <td><strong>${p.name}</strong></td>
                <td>${p.category}</td>
                <td>$${p.price.toFixed(2)}</td>
                <td class="admin-table-actions">
                  <button class="action-btn btn-edit edit-item-trigger" data-id="${p.id}"><i data-lucide="edit-2"></i></button>
                  <button class="action-btn btn-delete delete-item-trigger" data-id="${p.id}"><i data-lucide="trash-2"></i></button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Modal wires
    const modal = document.getElementById('edit-sweet-modal');
    const form = document.getElementById('sweet-catalog-form');
    
    document.getElementById('btn-add-product').addEventListener('click', () => {
      form.reset();
      document.getElementById('edit-product-id').value = '';
      document.getElementById('modal-form-title').textContent = 'Add New Sweet';
      modal.classList.add('active');
    });

    document.getElementById('btn-close-modal').addEventListener('click', () => {
      modal.classList.remove('active');
    });

    // Wire edit clicks
    container.querySelectorAll('.edit-item-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = productsList.find(item => item.id === btn.dataset.id);
        if (p) {
          document.getElementById('edit-product-id').value = p.id;
          document.getElementById('field-name').value = p.name;
          document.getElementById('field-desc').value = p.description;
          document.getElementById('field-category').value = p.category;
          document.getElementById('field-price').value = p.price;
          document.getElementById('field-emoji').value = p.emoji;
          document.getElementById('field-sprinkles').value = p.config?.sprinkles || 'none';
          
          document.getElementById('modal-form-title').textContent = 'Edit Sweet Item';
          modal.classList.add('active');
        }
      });
    });

    // Wire delete clicks
    container.querySelectorAll('.delete-item-trigger').forEach(btn => {
      btn.addEventListener('click', async () => {
        const p = productsList.find(item => item.id === btn.dataset.id);
        if (p && confirm(`Are you sure you want to delete ${p.name}?`)) {
          try {
            await deleteProduct(p.id);
            showToast("Sweet item deleted.", "info");
          } catch (err) {
            showToast(err.message, "error");
          }
        }
      });
    });

    // Form submit wiring
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pId = document.getElementById('edit-product-id').value;
      const name = document.getElementById('field-name').value.trim();
      const desc = document.getElementById('field-desc').value.trim();
      const cat = document.getElementById('field-category').value;
      const price = parseFloat(document.getElementById('field-price').value);
      const emoji = document.getElementById('field-emoji').value.trim();
      const sprinkles = document.getElementById('field-sprinkles').value;

      const pType = cat === 'donuts' ? 'donut' : cat === 'cupcakes' ? 'cupcake' : 'macaron';
      const payload = {
        name,
        description: desc,
        category: cat,
        price,
        emoji,
        config: {
          type: pType,
          baseColor: pType === 'donut' ? '#e6ad50' : pType === 'cupcake' ? '#ff7597' : '#8cd67a',
          icingColor: '#ff7597',
          sprinkles: sprinkles,
          toppings: pType === 'cupcake' ? ['cherry'] : []
        }
      };

      try {
        if (pId) {
          await editProduct(pId, payload);
          showToast("Sweet item updated successfully!", "success");
        } else {
          await addProduct(payload);
          showToast("New sweet item added to catalog!", "success");
        }
        modal.classList.remove('active');
      } catch (err) {
        showToast(err.message, "error");
      }
    });

  } else if (activeAdminSubSection === 'orders') {
    container.innerHTML = `
      <div class="admin-section-header">
        <h3>Customer Orders Manager</h3>
      </div>
      <div class="orders-list">
        ${ordersList.length === 0 ? `
          <p style="color:var(--text-muted); text-align:center; padding: 40px 0;">No customer orders placed yet.</p>
        ` : ordersList.map(order => {
          const dateStr = new Date(order.date).toLocaleDateString(undefined, { 
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          });
          return `
            <div class="admin-order-card">
              <div class="admin-order-header">
                <div>
                  <strong>Order ID: #${order.id}</strong>
                  <div class="customer-info-tag">Customer: ${order.customerName} (${order.customerEmail})</div>
                </div>
                <div>
                  <select class="order-actions-selector status-update-dropdown" data-id="${order.id}">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="baking" ${order.status === 'baking' ? 'selected' : ''}>Baking</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                  </select>
                </div>
              </div>
              <div class="order-items-summary" style="margin-bottom:10px;">
                ${order.items.map(item => `<strong>${item.name}</strong> x${item.quantity} ($${item.price.toFixed(2)})`).join(', ')}
              </div>
              <div class="order-footer-row" style="font-size:0.85rem;">
                <span class="order-date">Placed: ${dateStr}</span>
                <span class="order-total" style="font-size:1.1rem;">Paid: $${order.total.toFixed(2)}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Dropdown change status handler
    container.querySelectorAll('.status-update-dropdown').forEach(dropdown => {
      dropdown.addEventListener('change', async () => {
        try {
          await updateOrderStatus(dropdown.dataset.id, dropdown.value);
          showToast("Order status updated successfully.", "success");
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });

  } else if (activeAdminSubSection === 'settings') {
    container.innerHTML = `
      <div class="admin-section-header">
        <h3>System Settings</h3>
      </div>
      
      <div class="maintenance-card">
        <div class="maintenance-info">
          <h4>Toggle Maintenance Mode</h4>
          <p>Locks the website and blocks ordering for standard users. Admins bypass the lock screen.</p>
        </div>
        <div>
          <label class="switch">
            <input type="checkbox" id="maintenance-toggle" ${isMaintenanceActive ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="database-mode-info glass-panel" style="padding: 20px; border-color:var(--border-light); font-size:0.9rem;">
        <h5 style="margin-bottom:8px; font-weight:700;">Database Connection Details:</h5>
        <p style="margin-bottom:5px;">Connection: <strong style="color: ${isFirebaseEnabled ? 'var(--success-color)' : 'var(--warning-color)'}">${isFirebaseEnabled ? 'Active Cloud Firebase ☁️' : 'LocalStorage Offline Fallback 💾'}</strong></p>
        <p style="color:var(--text-muted); font-size:0.8rem;">Using Firebase fallback ensures testing works immediately without configuring Firestore write permissions or auth locks on Firebase console.</p>
      </div>
    `;

    // Toggle listener
    document.getElementById('maintenance-toggle').addEventListener('change', async (e) => {
      try {
        await toggleMaintenanceMode(e.target.checked);
        showToast(`Maintenance Mode toggled ${e.target.checked ? 'ON' : 'OFF'}.`, "info");
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  if (window.lucide) window.lucide.createIcons();
}

// 6. Maintenance Screen View
function renderMaintenanceView(appView) {
  appView.innerHTML = `
    <div class="container">
      <div class="maintenance-screen">
        <div class="maintenance-box glass-panel">
          <div class="maintenance-3d-scene" id="maintenance-3d-container"></div>
          <h1>Under Construction</h1>
          <p>
            Our master bakers are currently sweeping the kitchen and updating our sweet recipes. We will be back online with fresh glazed goods very soon!
          </p>
          <a href="#profile" class="admin-bypass-trigger" id="admin-bypass-login">
            Chef Sign In
          </a>
        </div>
      </div>
    </div>
  `;

  // Draw simple spin 3D donut in maintenance
  const sceneContainer = document.getElementById('maintenance-3d-container');
  if (sceneContainer) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10);
    camera.position.z = 4.5;
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(250, 250);
    sceneContainer.appendChild(renderer.domElement);

    const mainLight = new THREE.DirectionalLight(0xff7597, 1);
    mainLight.position.set(2, 2, 2);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x00dec7, 0.5);
    fillLight.position.set(-2, -2, 2);
    scene.add(fillLight);

    // Bumpy broken spin donut
    const donutGeo = new THREE.TorusGeometry(1, 0.35, 16, 32);
    const donutMat = new THREE.MeshPhysicalMaterial({ color: 0xff7597, roughness: 0.25, clearcoat: 0.8 });
    const donut = new THREE.Mesh(donutGeo, donutMat);
    donut.rotation.x = 0.5;
    scene.add(donut);

    function spin() {
      requestAnimationFrame(spin);
      donut.rotation.y += 0.015;
      donut.rotation.z += 0.005;
      renderer.render(scene, camera);
    }
    spin();
  }
}

// ----------------------------------------------------
// CHECKOUT & ORDER SUBMISSION ACTIONS
// ----------------------------------------------------
function handleCheckout() {
  const cart = getCart();
  if (cart.length === 0) {
    showToast("Your shopping cart is empty!", "error");
    return;
  }

  if (!currentUser) {
    showToast("Please sign in or create an account in your Profile view before checking out!", "warning");
    // Redirect user to Profile page
    window.location.hash = '#profile';
    closeCartDrawer();
    return;
  }

  // Pre-populate checkout billing modal inputs
  const nameInput = document.getElementById('checkout-fullname');
  const streetInput = document.getElementById('checkout-street');
  const cityInput = document.getElementById('checkout-city');
  const stateInput = document.getElementById('checkout-state');
  const zipInput = document.getElementById('checkout-zip');

  if (nameInput) nameInput.value = currentUser.displayName || '';
  if (streetInput) streetInput.value = currentUser.address?.street || '';
  if (cityInput) cityInput.value = currentUser.address?.city || '';
  if (stateInput) stateInput.value = currentUser.address?.state || '';
  if (zipInput) zipInput.value = currentUser.address?.zip || '';

  const summaryTotal = document.getElementById('checkout-summary-total');
  if (summaryTotal) summaryTotal.textContent = `$${getCartTotal().toFixed(2)}`;

  // Reset checkout display screens
  document.getElementById('checkout-form-content').style.display = 'block';
  document.getElementById('checkout-processing-content').style.display = 'none';
  document.getElementById('checkout-success-content').style.display = 'none';

  // Open modal
  const checkoutModal = document.getElementById('checkout-modal');
  checkoutModal.classList.add('active');
  closeCartDrawer();
}

// ----------------------------------------------------
// LISTENERS & SYNCHRONIZATION BINDINGS
// ----------------------------------------------------

// Synchronize database updates dynamically across active page renders
function initDatabaseSync() {
  // 1. Auth Sync
  subscribeAuth(user => {
    currentUser = user;
    const nameTag = document.getElementById('profile-name-tag');
    const adminItems = document.querySelectorAll('.admin-only');

    if (user) {
      nameTag.textContent = user.displayName;
      if (user.role === 'admin') {
        adminItems.forEach(el => el.style.display = 'block');
      } else {
        adminItems.forEach(el => el.style.display = 'none');
      }
    } else {
      nameTag.textContent = "Login";
      adminItems.forEach(el => el.style.display = 'none');
    }

    // Refresh active view if it depends on Auth credentials
    const hash = window.location.hash;
    if (hash === '#profile' || hash === '#admin') {
      navigateToHash();
    }
  });

  // 2. Products Sync
  subscribeProducts(products => {
    productsList = products;
    if (window.location.hash === '#shop') {
      displayShopItems('all');
    }
  });

  // 3. Orders Sync
  subscribeOrders(orders => {
    ordersList = orders;
    const hash = window.location.hash;
    if (hash === '#profile') {
      loadView('profile');
    } else if (hash === '#admin') {
      renderAdminSubView();
    }
  });

  // 4. Maintenance Settings Sync
  subscribeMaintenanceMode(active => {
    isMaintenanceActive = active;
    
    // Reroute if user gets locked out or maintenance is removed
    const hash = window.location.hash || '#home';
    if (active && (!currentUser || currentUser.role !== 'admin')) {
      if (hash !== '#maintenance') {
        window.location.hash = '#maintenance';
      }
    } else if (!active && hash === '#maintenance') {
      window.location.hash = '#home';
    } else {
      navigateToHash();
    }
  });
}

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Bind dynamic page routing
  window.addEventListener('hashchange', navigateToHash);
  
  // Wire checkout btn trigger inside drawer
  document.getElementById('checkout-btn').addEventListener('click', handleCheckout);

  // Home logo click handle
  document.getElementById('nav-logo-btn').addEventListener('click', () => {
    window.location.hash = '#home';
  });

  // Wire quick action buttons
  document.getElementById('nav-profile-btn').addEventListener('click', () => {
    window.location.hash = '#profile';
  });

  // Checkout modal listeners
  const checkoutModal = document.getElementById('checkout-modal');
  const closeCheckoutBtn = document.getElementById('btn-close-checkout');
  const doneCheckoutBtn = document.getElementById('btn-checkout-success-done');
  const billingForm = document.getElementById('checkout-billing-form');

  if (closeCheckoutBtn) {
    closeCheckoutBtn.addEventListener('click', () => {
      checkoutModal.classList.remove('active');
    });
  }

  if (doneCheckoutBtn) {
    doneCheckoutBtn.addEventListener('click', () => {
      checkoutModal.classList.remove('active');
      window.location.hash = '#profile';
    });
  }

  if (billingForm) {
    billingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const cart = getCart();
      document.getElementById('checkout-form-content').style.display = 'none';
      
      const processingView = document.getElementById('checkout-processing-content');
      processingView.style.display = 'block';

      const stepTitle = document.getElementById('checkout-step-title');
      const stepSubtitle = document.getElementById('checkout-step-subtitle');

      // Simulated Professional payment validation steps
      stepTitle.textContent = "Processing payment authorization...";
      stepSubtitle.textContent = "Reaching out to secure banking gateway...";
      await new Promise(r => setTimeout(r, 1200));

      stepTitle.textContent = "Transmitting custom design formulas...";
      stepSubtitle.textContent = "Uploading 3D configurations to Cloud Firestore...";
      
      const orderPayload = {
        userId: currentUser.uid,
        customerName: currentUser.displayName,
        customerEmail: currentUser.email,
        items: cart.map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          isCustom: i.isCustom,
          config: i.config || null
        })),
        total: getCartTotal()
      };

      try {
        const orderId = await submitOrder(orderPayload);

        stepTitle.textContent = "Finalizing order ticket...";
        stepSubtitle.textContent = "Setting kitchen status to pending...";
        await new Promise(r => setTimeout(r, 1000));

        // Done! Show success screen
        processingView.style.display = 'none';
        const successView = document.getElementById('checkout-success-content');
        successView.style.display = 'block';
        
        const successOrderId = document.getElementById('checkout-success-order-id');
        if (successOrderId) successOrderId.textContent = `Order ID: #${orderId}`;

        clearCart();
      } catch (err) {
        showToast(`Checkout failed: ${err.message}`, 'error');
        document.getElementById('checkout-form-content').style.display = 'block';
        processingView.style.display = 'none';
      }
    });
  }

  // Load database connections and routing
  initDatabaseSync();
  navigateToHash();
});
