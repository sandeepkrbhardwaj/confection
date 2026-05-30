import { INITIAL_PRODUCTS } from './seed-data.js';

// Database connection state (Firebase disabled as requested, running in Local Demo Mode)
export const isFirebaseEnabled = false;

// ----------------------------------------------------
// LOCAL PERSISTENT DEMO DATABASE STATE
// ----------------------------------------------------
const MOCK_DB = {
  products: JSON.parse(localStorage.getItem('c3d_products')) || [],
  orders: JSON.parse(localStorage.getItem('c3d_orders')) || [],
  users: JSON.parse(localStorage.getItem('c3d_users')) || [
    { 
      uid: "admin123", 
      email: "admin@confection3d.com", 
      displayName: "Chef Admin", 
      role: "admin",
      address: { street: "10 Main Bakery Road", city: "Sweet Town", state: "CA", zip: "90210" }
    },
    { 
      uid: "demo123", 
      email: "demo@confection3d.com", 
      displayName: "Demo User", 
      role: "customer",
      address: { street: "123 Sugar Blvd", city: "Candy City", state: "NY", zip: "10001" }
    }
  ],
  currentUser: JSON.parse(localStorage.getItem('c3d_current_user')) || null,
  maintenanceMode: localStorage.getItem('c3d_maintenance') === 'true',
  listeners: {
    products: [],
    orders: [],
    auth: [],
    maintenance: []
  }
};

// Save state to browser localStorage
const saveState = () => {
  localStorage.setItem('c3d_products', JSON.stringify(MOCK_DB.products));
  localStorage.setItem('c3d_orders', JSON.stringify(MOCK_DB.orders));
  localStorage.setItem('c3d_users', JSON.stringify(MOCK_DB.users));
  localStorage.setItem('c3d_current_user', JSON.stringify(MOCK_DB.currentUser));
  localStorage.setItem('c3d_maintenance', MOCK_DB.maintenanceMode.toString());
};

// Initialize Mock database with Seed products if empty
if (MOCK_DB.products.length === 0) {
  MOCK_DB.products = INITIAL_PRODUCTS.map((p, i) => ({ id: `p_${i}`, ...p }));
  saveState();
}

// ----------------------------------------------------
// UNIFIED DEMO AUTHENTICATION API
// ----------------------------------------------------

export async function signUp(email, password, displayName) {
  // Simulate 300ms network delay for professional feedback
  await new Promise(r => setTimeout(r, 300));
  
  const formattedEmail = email.toLowerCase().trim();
  if (MOCK_DB.users.find(u => u.email === formattedEmail)) {
    throw new Error("Email address already registered!");
  }

  const newUser = {
    uid: "usr_" + Math.random().toString(36).substr(2, 9),
    email: formattedEmail,
    displayName: displayName.trim(),
    role: formattedEmail.includes("admin") ? "admin" : "customer",
    address: null
  };

  MOCK_DB.users.push(newUser);
  MOCK_DB.currentUser = newUser;
  saveState();
  triggerAuthListeners();
  return newUser;
}

export async function login(email, password) {
  await new Promise(r => setTimeout(r, 350));
  
  const formattedEmail = email.toLowerCase().trim();
  const user = MOCK_DB.users.find(u => u.email === formattedEmail);
  
  if (!user) {
    throw new Error("User email not found! Register a new account or use admin@confection3d.com / demo@confection3d.com.");
  }
  
  // Accept any password for easy testing access in demo mode
  MOCK_DB.currentUser = user;
  saveState();
  triggerAuthListeners();
  return user;
}

export async function logout() {
  MOCK_DB.currentUser = null;
  saveState();
  triggerAuthListeners();
}

export function subscribeAuth(callback) {
  MOCK_DB.listeners.auth.push(callback);
  
  // Push active user immediately on callback subscription
  setTimeout(() => {
    callback(MOCK_DB.currentUser);
  }, 10);

  return () => {
    MOCK_DB.listeners.auth = MOCK_DB.listeners.auth.filter(cb => cb !== callback);
  };
}

function triggerAuthListeners() {
  MOCK_DB.listeners.auth.forEach(callback => callback(MOCK_DB.currentUser));
}

// ----------------------------------------------------
// DEMO PRODUCT CATALOG CRUD API
// ----------------------------------------------------

export function subscribeProducts(callback) {
  MOCK_DB.listeners.products.push(callback);
  
  setTimeout(() => {
    callback(MOCK_DB.products);
  }, 10);

  return () => {
    MOCK_DB.listeners.products = MOCK_DB.listeners.products.filter(cb => cb !== callback);
  };
}

export async function addProduct(product) {
  const newProduct = { id: "p_" + Date.now(), ...product };
  MOCK_DB.products.push(newProduct);
  saveState();
  triggerProductListeners();
}

export async function editProduct(id, updatedFields) {
  const idx = MOCK_DB.products.findIndex(p => p.id === id);
  if (idx !== -1) {
    MOCK_DB.products[idx] = { ...MOCK_DB.products[idx], ...updatedFields };
    saveState();
    triggerProductListeners();
  }
}

export async function deleteProduct(id) {
  MOCK_DB.products = MOCK_DB.products.filter(p => p.id !== id);
  saveState();
  triggerProductListeners();
}

function triggerProductListeners() {
  MOCK_DB.listeners.products.forEach(cb => cb(MOCK_DB.products));
}

// ----------------------------------------------------
// DEMO ORDERS SYSTEM API
// ----------------------------------------------------

export function subscribeOrders(callback) {
  MOCK_DB.listeners.orders.push(callback);
  
  setTimeout(() => {
    callback(MOCK_DB.orders);
  }, 10);

  return () => {
    MOCK_DB.listeners.orders = MOCK_DB.listeners.orders.filter(cb => cb !== callback);
  };
}

export async function submitOrder(orderData) {
  await new Promise(r => setTimeout(r, 400));
  
  const newOrder = {
    id: "ord_" + Math.floor(100000 + Math.random() * 900000).toString(),
    ...orderData,
    date: new Date().toISOString(),
    status: "pending"
  };

  MOCK_DB.orders.unshift(newOrder);
  saveState();
  triggerOrderListeners();
  return newOrder.id;
}

export async function updateOrderStatus(orderId, newStatus) {
  const idx = MOCK_DB.orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    MOCK_DB.orders[idx].status = newStatus;
    saveState();
    triggerOrderListeners();
  }
}

function triggerOrderListeners() {
  MOCK_DB.listeners.orders.forEach(cb => cb(MOCK_DB.orders));
}

// ----------------------------------------------------
// DEMO SYSTEM MAINTENANCE API
// ----------------------------------------------------

export function subscribeMaintenanceMode(callback) {
  MOCK_DB.listeners.maintenance.push(callback);
  
  setTimeout(() => {
    callback(MOCK_DB.maintenanceMode);
  }, 10);

  return () => {
    MOCK_DB.listeners.maintenance = MOCK_DB.listeners.maintenance.filter(cb => cb !== callback);
  };
}

export async function toggleMaintenanceMode(isActive) {
  MOCK_DB.maintenanceMode = isActive;
  saveState();
  MOCK_DB.listeners.maintenance.forEach(cb => cb(MOCK_DB.maintenanceMode));
}

// ----------------------------------------------------
// DEMO PROFILE SETTINGS API
// ----------------------------------------------------

export async function saveProfileSettings(userId, fields) {
  const idx = MOCK_DB.users.findIndex(u => u.uid === userId);
  if (idx !== -1) {
    MOCK_DB.users[idx] = { ...MOCK_DB.users[idx], ...fields };
    if (MOCK_DB.currentUser && MOCK_DB.currentUser.uid === userId) {
      MOCK_DB.currentUser = { ...MOCK_DB.currentUser, ...fields };
    }
    saveState();
    triggerAuthListeners();
  }
}
