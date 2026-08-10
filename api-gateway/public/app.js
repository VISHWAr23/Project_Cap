const API_BASE = '/api';
const USER_ID = 'user-123';

let currentBasketId = localStorage.getItem('cake_basket_id') || null;
let cakesMap = {};
let apiLogs = [];

// DOM Elements
const cakesGrid = document.getElementById('cakesGrid');
const filterForm = document.getElementById('filterForm');
const resetFilterBtn = document.getElementById('resetFilterBtn');

const cartBtn = document.getElementById('cartBtn');
const notifBtn = document.getElementById('notifBtn');
const cartCount = document.getElementById('cartCount');
const notifCount = document.getElementById('notifCount');

const cartItemsList = document.getElementById('cartItemsList');
const cartSummary = document.getElementById('cartSummary');
const cartTotalAmount = document.getElementById('cartTotalAmount');
const clearCartBtn = document.getElementById('clearCartBtn');
const checkoutBtn = document.getElementById('checkoutBtn');

const notifModal = document.getElementById('notifModal');
const closeNotif = document.getElementById('closeNotif');
const notifList = document.getElementById('notifList');

const ratingModal = document.getElementById('ratingModal');
const closeRating = document.getElementById('closeRating');
const ratingForm = document.getElementById('ratingForm');
const rateCakeId = document.getElementById('rateCakeId');
const rateOrderId = document.getElementById('rateOrderId');
const rateCakeName = document.getElementById('rateCakeName');

const ordersList = document.getElementById('ordersList');

// Inspector DOM Elements
const activeStatus = document.getElementById('activeStatus');
const activeRequest = document.getElementById('activeRequest');
const activeResponse = document.getElementById('activeResponse');
const apiLogsStream = document.getElementById('apiLogsStream');
const clearLogsBtn = document.getElementById('clearLogsBtn');

// Central API Interceptor for Live 50/50 Inspection
async function apiCall(endpoint, options = {}) {
  const method = options.method || 'GET';
  const url = `${API_BASE}${endpoint}`;
  const timestamp = new Date().toLocaleTimeString();

  activeStatus.className = 'status-badge status-idle';
  activeStatus.textContent = 'SENDING...';

  let reqDisplay = `${method} ${url}`;
  if (options.body) {
    try {
      const parsedBody = JSON.parse(options.body);
      reqDisplay += `\n\nPayload:\n${JSON.stringify(parsedBody, null, 2)}`;
    } catch (e) {
      reqDisplay += `\n\nPayload: ${options.body}`;
    }
  }
  activeRequest.textContent = reqDisplay;
  activeResponse.textContent = 'Awaiting backend response...';

  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }

    const isSuccess = res.status >= 200 && res.status < 300;
    activeStatus.className = `status-badge ${isSuccess ? 'status-success' : 'status-error'}`;
    activeStatus.textContent = `${res.status} ${res.statusText || (isSuccess ? 'OK' : 'ERROR')}`;

    const respDisplay = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
    activeResponse.textContent = respDisplay;

    const logItem = {
      id: Date.now(),
      time: timestamp,
      method,
      endpoint,
      status: res.status,
      isSuccess,
      reqDisplay,
      respDisplay
    };
    apiLogs.unshift(logItem);
    renderLogsStream();

    return { status: res.status, ok: res.ok, data };
  } catch (error) {
    activeStatus.className = 'status-badge status-error';
    activeStatus.textContent = 'NETWORK ERROR';
    activeResponse.textContent = `Error: ${error.message}`;

    const logItem = {
      id: Date.now(),
      time: timestamp,
      method,
      endpoint,
      status: 'ERR',
      isSuccess: false,
      reqDisplay,
      respDisplay: `Error: ${error.message}`
    };
    apiLogs.unshift(logItem);
    renderLogsStream();

    return { status: 500, ok: false, data: { success: false, message: error.message } };
  }
}

function renderLogsStream() {
  if (apiLogs.length === 0) {
    apiLogsStream.innerHTML = '<p class="empty-text">Click any UI button to trigger API calls!</p>';
    return;
  }
  apiLogsStream.innerHTML = '';
  apiLogs.forEach(log => {
    const item = document.createElement('div');
    item.className = 'log-stream-item';
    item.onclick = () => {
      activeStatus.className = `status-badge ${log.isSuccess ? 'status-success' : 'status-error'}`;
      activeStatus.textContent = `${log.status}`;
      activeRequest.textContent = log.reqDisplay;
      activeResponse.textContent = log.respDisplay;
    };
    item.innerHTML = `
      <div>
        <span class="log-method method-${log.method}">${log.method}</span>
        <span style="margin-left:0.4rem;">${log.endpoint}</span>
      </div>
      <div style="font-size:0.75rem; color:var(--text-muted);">
        <span style="color:${log.isSuccess ? 'var(--success)' : 'var(--danger)'}">${log.status}</span> | ${log.time}
      </div>
    `;
    apiLogsStream.appendChild(item);
  });
}

clearLogsBtn.addEventListener('click', () => {
  apiLogs = [];
  renderLogsStream();
  activeStatus.className = 'status-badge status-idle';
  activeStatus.textContent = 'IDLE';
  activeRequest.textContent = 'Waiting for API request...';
  activeResponse.textContent = 'No response captured yet.';
});

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// 1. Init Basket
async function initBasket() {
  if (!currentBasketId) {
    const res = await apiCall('/baskets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: USER_ID })
    });
    if (res.data && res.data.success) {
      currentBasketId = res.data.data._id;
      localStorage.setItem('cake_basket_id', currentBasketId);
    }
  }
  loadBasket();
}

const DEFAULT_CAKE_IMG = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300';

// 2. Load Cakes
async function loadCakes(params = {}) {
  cakesGrid.innerHTML = '<div class="loading">Loading catalog...</div>';
  const query = new URLSearchParams(params).toString();
  const res = await apiCall(`/cakes${query ? '?' + query : ''}`);

  if (!res.data || !res.data.success || !res.data.data || res.data.data.length === 0) {
    cakesGrid.innerHTML = '<p class="empty-text">No cakes found matching criteria.</p>';
    return;
  }

  cakesGrid.innerHTML = '';
  cakesMap = {};

  for (const cake of res.data.data) {
    cakesMap[cake._id] = cake;

    // Display stored averageRating & ratingCount directly from cake model
    const avg = cake.averageRating ? cake.averageRating : 0;
    const count = cake.ratingCount ? cake.ratingCount : 0;
    const ratingText = count > 0 ? `⭐ ${avg} (${count})` : '⭐ New (0)';
    const img = cake.imageUrl || DEFAULT_CAKE_IMG;

    const item = document.createElement('div');
    item.className = 'cake-card';
    item.innerHTML = `
      <img src="${img}" alt="${cake.name}" class="cake-img" onerror="this.src='${DEFAULT_CAKE_IMG}'">
      <div class="cake-card-body">
        <div class="cake-name">${cake.name}</div>
        <div class="cake-meta">${cake.category} • ${ratingText}</div>
        <div class="cake-price-row">
          <span class="cake-price">$${cake.price}</span>
          <button class="btn btn-primary btn-sm" onclick="addToBasket('${cake._id}')" ${!cake.availability ? 'disabled' : ''}>
            ${cake.availability ? 'Add +1' : 'Off Stock'}
          </button>
        </div>
      </div>
    `;
    cakesGrid.appendChild(item);
  }
}

// 3. Add to Basket
async function addToBasket(cakeId) {
  if (!currentBasketId) await initBasket();
  let res = await apiCall(`/baskets/${currentBasketId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cakeId, quantity: 1 })
  });

  if (res.status === 404) {
    localStorage.removeItem('cake_basket_id');
    currentBasketId = null;
    await initBasket();
    if (currentBasketId) {
      res = await apiCall(`/baskets/${currentBasketId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cakeId, quantity: 1 })
      });
    }
  }

  if (res.data && res.data.success) {
    showToast(`Added ${cakesMap[cakeId]?.name || 'cake'}!`, 'success');
    loadBasket();
  } else {
    showToast(res.data?.message || 'Failed to add item', 'danger');
  }
}

// 4. Load Basket
async function loadBasket() {
  if (!currentBasketId) return;
  const res = await apiCall(`/baskets/${currentBasketId}`);

  if (res.status === 404) {
    localStorage.removeItem('cake_basket_id');
    currentBasketId = null;
    await initBasket();
    return;
  }

  if (!res.data || !res.data.success || !res.data.data || !res.data.data.items || res.data.data.items.length === 0) {
    cartCount.textContent = '0';
    cartItemsList.innerHTML = '<p class="empty-text">Basket is empty.</p>';
    cartSummary.style.display = 'none';
    clearCartBtn.style.display = 'none';
    return;
  }

  const items = res.data.data.items;
  let totalCount = 0;
  let totalCost = 0;
  cartItemsList.innerHTML = '';

  for (const item of items) {
    totalCount += item.quantity;
    const cake = cakesMap[item.cakeId] || { name: `Cake (${item.cakeId})`, price: item.price || 0 };
    const price = cake.price || item.price || 0;
    totalCost += price * item.quantity;

    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <div><strong>${cake.name}</strong> ($${price})</div>
      <div>
        <button class="btn btn-outline btn-sm" onclick="updateItemQty('${item._id}', ${item.quantity - 1})">-</button>
        <span style="margin: 0 0.3rem;">${item.quantity}</span>
        <button class="btn btn-outline btn-sm" onclick="updateItemQty('${item._id}', ${item.quantity + 1})">+</button>
        <button class="btn btn-danger btn-sm" onclick="removeCartItem('${item._id}')" style="margin-left:0.4rem;">✕</button>
      </div>
    `;
    cartItemsList.appendChild(row);
  }

  cartCount.textContent = totalCount.toString();
  cartTotalAmount.textContent = `$${totalCost}`;
  cartSummary.style.display = 'flex';
  clearCartBtn.style.display = 'inline-block';
}

// 5. Update Qty
async function updateItemQty(itemId, qty) {
  if (qty <= 0) return removeCartItem(itemId);
  const res = await apiCall(`/baskets/${currentBasketId}/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity: qty })
  });
  if (res.data && res.data.success) loadBasket();
}

// 6. Remove Item
async function removeCartItem(itemId) {
  const res = await apiCall(`/baskets/${currentBasketId}/items/${itemId}`, { method: 'DELETE' });
  if (res.data && res.data.success) loadBasket();
}

// 7. Clear Basket
async function clearBasket() {
  const res = await apiCall(`/baskets/${currentBasketId}`, { method: 'DELETE' });
  if (res.data && res.data.success) loadBasket();
}

// 8. Checkout
async function performCheckout() {
  const res = await apiCall('/orders/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ basketId: currentBasketId, userId: USER_ID })
  });

  if (res.data && res.data.success) {
    showToast(`Order #${res.data.data._id} confirmed!`, 'success');
    loadBasket();
    loadOrders();
    setTimeout(loadNotifications, 1500);
  } else {
    showToast(res.data?.message || 'Checkout failed', 'danger');
  }
}

// 9. Load Orders
async function loadOrders() {
  const res = await apiCall(`/orders?userId=${USER_ID}`);

  if (!res.data || !res.data.success || !res.data.data || res.data.data.length === 0) {
    ordersList.innerHTML = '<p class="empty-text">No orders placed yet.</p>';
    return;
  }

  ordersList.innerHTML = '';
  res.data.data.forEach(order => {
    const box = document.createElement('div');
    box.className = 'order-box';

    let itemsHtml = order.items.map(i => {
      const name = cakesMap[i.cakeId]?.name || `Cake ${i.cakeId}`;
      return `
        <div style="display:flex; justify-content:space-between; margin-top:0.3rem;">
          <span>• ${name} (x${i.quantity})</span>
          <button class="btn btn-outline btn-sm" onclick="openRatingModal('${i.cakeId}', '${order._id}', '${name.replace(/'/g, "\\'")}')">
            ⭐ Rate
          </button>
        </div>
      `;
    }).join('');

    box.innerHTML = `
      <div style="display:flex; justify-content:space-between;">
        <strong>Order #${order._id}</strong>
        <span style="color:var(--success);">$${order.totalAmount} (${order.status})</span>
      </div>
      <div>${itemsHtml}</div>
    `;
    ordersList.appendChild(box);
  });
}

// 10. Load Notifications
async function loadNotifications() {
  const res = await apiCall(`/notifications/user/${USER_ID}`);

  if (!res.data || !res.data.success || !res.data.data || res.data.data.length === 0) {
    notifCount.textContent = '0';
    notifList.innerHTML = '<p class="empty-text">No notifications found.</p>';
    return;
  }

  notifCount.textContent = res.data.data.length.toString();
  notifList.innerHTML = '';

  res.data.data.forEach(n => {
    const div = document.createElement('div');
    div.style.padding = '0.6rem 0';
    div.style.borderBottom = '1px solid var(--card-border)';
    div.innerHTML = `
      <div style="font-weight:600; color:var(--primary);">📩 ${n.message}</div>
      <div style="font-size:0.75rem; color:var(--text-muted);">Status: ${n.status} | Order: ${n.orderId}</div>
    `;
    notifList.appendChild(div);
  });
}

// 11. Rating Submission (Triggers Rating Service -> REST PUT to Catalog Service)
function openRatingModal(cakeId, orderId, cakeName) {
  rateCakeId.value = cakeId;
  rateOrderId.value = orderId;
  rateCakeName.textContent = cakeName;
  ratingModal.classList.add('active');
}

ratingForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cakeId = rateCakeId.value;
  const orderId = rateOrderId.value;
  const rating = Number(document.getElementById('ratingValue').value);
  const review = document.getElementById('ratingReview').value;

  const res = await apiCall('/ratings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cakeId, userId: USER_ID, orderId, rating, review })
  });

  if (res.data && res.data.success) {
    showToast('Rating submitted & stored in Cake ID!', 'success');
    ratingModal.classList.remove('active');
    ratingForm.reset();
    loadCakes(); // Reload catalog to show newly updated averageRating stored in cake document
  } else {
    showToast(res.data?.message || 'Failed to rate', 'danger');
  }
});

// Event Listeners
filterForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('searchName').value.trim();
  const category = document.getElementById('searchCategory').value;
  const minPrice = document.getElementById('minPrice').value;
  const maxPrice = document.getElementById('maxPrice').value;

  const params = {};
  if (name) params.name = name;
  if (category) params.category = category;
  if (minPrice) params.minPrice = minPrice;
  if (maxPrice) params.maxPrice = maxPrice;

  loadCakes(params);
});

resetFilterBtn.addEventListener('click', () => {
  filterForm.reset();
  loadCakes();
});

notifBtn.addEventListener('click', () => {
  loadNotifications();
  notifModal.classList.add('active');
});
closeNotif.addEventListener('click', () => notifModal.classList.remove('active'));
closeRating.addEventListener('click', () => ratingModal.classList.remove('active'));

clearCartBtn.addEventListener('click', clearBasket);
checkoutBtn.addEventListener('click', performCheckout);

// ==================== ADMIN PANEL LOGIC ====================
let currentMode = 'customer'; // 'customer' | 'admin'

const modeToggleBtn = document.getElementById('modeToggleBtn');
const customerView = document.getElementById('customerView');
const adminView = document.getElementById('adminView');
const headerTitle = document.getElementById('headerTitle');
const userBadge = document.getElementById('userBadge');

const adminCakeForm = document.getElementById('adminCakeForm');
const adminFormTitle = document.getElementById('adminFormTitle');
const adminCakeId = document.getElementById('adminCakeId');
const adminCakeName = document.getElementById('adminCakeName');
const adminCakeCategory = document.getElementById('adminCakeCategory');
const adminCakePrice = document.getElementById('adminCakePrice');
const adminCakeAvailability = document.getElementById('adminCakeAvailability');
const adminSaveCakeBtn = document.getElementById('adminSaveCakeBtn');
const adminCancelEditBtn = document.getElementById('adminCancelEditBtn');
const adminCakesList = document.getElementById('adminCakesList');

const adminOrderIdInput = document.getElementById('adminOrderIdInput');
const adminInspectOrderBtn = document.getElementById('adminInspectOrderBtn');

const adminRatingCakeSelect = document.getElementById('adminRatingCakeSelect');
const adminInspectRatingsBtn = document.getElementById('adminInspectRatingsBtn');
const adminRatingsContainer = document.getElementById('adminRatingsContainer');

const adminOrdersList = document.getElementById('adminOrdersList');
const refreshAdminOrdersBtn = document.getElementById('refreshAdminOrdersBtn');
const checkHealthBtn = document.getElementById('checkHealthBtn');
const adminSystemNotifsList = document.getElementById('adminSystemNotifsList');

// Admin Tab Switching System
function switchAdminTab(tabName) {
  const tabs = ['overview', 'catalog', 'orders', 'ratings', 'health'];
  tabs.forEach(t => {
    const contentEl = document.getElementById(`adminTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const btnEl = document.querySelector(`.admin-tab-btn[data-tab="${t}"]`);
    if (contentEl) contentEl.style.display = t === tabName ? 'block' : 'none';
    if (btnEl) btnEl.classList.toggle('active', t === tabName);
  });

  if (tabName === 'overview') updateAdminKPIs();
  if (tabName === 'catalog') loadAdminCakes();
  if (tabName === 'orders') loadAdminOrders();
  if (tabName === 'ratings') {
    loadAdminCakes();
    loadAllAdminRatings();
  }
  if (tabName === 'health') {
    checkMicroserviceHealth();
    loadAdminNotifications();
  }
}

// Tab Button Click Event Listeners
document.querySelectorAll('.admin-tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const tab = e.target.getAttribute('data-tab');
    if (tab) switchAdminTab(tab);
  });
});

// Calculate Admin Overview KPIs
async function updateAdminKPIs() {
  const cakesRes = await apiCall('/cakes');
  if (cakesRes.data && cakesRes.data.success) {
    const cakes = cakesRes.data.data;
    const totalCakes = cakes.length;
    const inStock = cakes.filter(c => c.availability).length;
    const avgRatingSum = cakes.reduce((acc, c) => acc + (c.averageRating || 0), 0);
    const avgRating = totalCakes > 0 ? (avgRatingSum / totalCakes).toFixed(1) : '0.0';

    document.getElementById('kpiTotalCakes').textContent = totalCakes;
    document.getElementById('kpiStockRatio').textContent = `${inStock} / ${totalCakes} In Stock`;
    document.getElementById('kpiAvgRating').textContent = `⭐ ${avgRating}`;
  }

  const ordersRes = await apiCall('/orders');
  if (ordersRes.data && ordersRes.data.success) {
    const orders = ordersRes.data.data;
    const totalOrders = orders.length;
    const revenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    document.getElementById('kpiTotalOrders').textContent = totalOrders;
    document.getElementById('kpiRevenue').textContent = `Total Revenue: $${revenue}`;
  }
}

// Load All Orders in Admin View
async function loadAdminOrders() {
  if (!adminOrdersList) return;
  adminOrdersList.innerHTML = '<div class="loading">Loading orders for admin...</div>';
  const res = await apiCall('/orders');

  if (!res.data || !res.data.success || !res.data.data || res.data.data.length === 0) {
    adminOrdersList.innerHTML = '<p class="empty-text">No orders found in database.</p>';
    return;
  }

  adminOrdersList.innerHTML = '';
  res.data.data.forEach(order => {
    const box = document.createElement('div');
    box.className = 'order-box';
    box.style.marginBottom = '0.4rem';
    box.innerHTML = `
      <div class="order-header">
        <strong>Order #${order._id}</strong>
        <span class="status-badge status-success">${order.status || 'CONFIRMED'}</span>
      </div>
      <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
        User: ${order.userId} • Items: ${order.items ? order.items.length : 0} • Total: <strong>$${order.totalAmount}</strong>
      </div>
      <div style="margin-top:0.3rem; display:flex; justify-content:flex-end;">
        <button class="btn btn-primary btn-sm" onclick="inspectSpecificOrder('${order._id}')">Inspect 🔍</button>
      </div>
    `;
    adminOrdersList.appendChild(box);
  });
}

function inspectSpecificOrder(orderId) {
  adminOrderIdInput.value = orderId;
  adminInspectOrderBtn.click();
}

if (refreshAdminOrdersBtn) {
  refreshAdminOrdersBtn.addEventListener('click', loadAdminOrders);
}

// Microservice Health Check Probes
async function checkMicroserviceHealth() {
  const setStatus = (id, isOk) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = isOk ? 'UP 🟢' : 'DOWN 🔴';
      el.style.color = isOk ? 'var(--success)' : 'var(--danger)';
    }
  };

  const gwRes = await apiCall('/health');
  setStatus('healthGateway', gwRes.ok);

  const catRes = await apiCall('/cakes/health');
  setStatus('healthCatalog', catRes.ok);

  const ordRes = await apiCall('/orders/health');
  setStatus('healthOrder', ordRes.ok);

  const ratRes = await apiCall('/ratings/health');
  setStatus('healthRating', ratRes.ok);

  const notRes = await apiCall('/notifications/health');
  setStatus('healthNotification', notRes.ok);
}

if (checkHealthBtn) {
  checkHealthBtn.addEventListener('click', checkMicroserviceHealth);
}

// Load System Notifications in Admin Tab
async function loadAdminNotifications() {
  if (!adminSystemNotifsList) return;
  adminSystemNotifsList.innerHTML = '<div class="loading">Loading system notifications...</div>';
  const res = await apiCall('/notifications');

  if (!res.data || !res.data.success || !res.data.data || res.data.data.length === 0) {
    adminSystemNotifsList.innerHTML = '<p class="empty-text">No system notifications found.</p>';
    return;
  }

  adminSystemNotifsList.innerHTML = '';
  res.data.data.forEach(n => {
    const box = document.createElement('div');
    box.className = 'order-box';
    box.style.marginBottom = '0.3rem';
    box.innerHTML = `
      <div style="display:flex; justify-content:space-between; font-size:0.75rem;">
        <strong>[${n.type || 'SYSTEM'}] Event: ${n.eventId || 'N/A'}</strong>
        <span style="color:var(--text-muted);">${new Date(n.createdAt).toLocaleTimeString()}</span>
      </div>
      <div style="font-size:0.78rem; margin-top:0.2rem; color:var(--text-main);">${n.message}</div>
    `;
    adminSystemNotifsList.appendChild(box);
  });
}

// DOM Elements for Cake Modal
const cakeModal = document.getElementById('cakeModal');
const closeCakeModal = document.getElementById('closeCakeModal');
const openAddCakeModalBtn = document.getElementById('openAddCakeModalBtn');
const adminCakeDescription = document.getElementById('adminCakeDescription');
const adminCakeImageUrl = document.getElementById('adminCakeImageUrl');
const cakeModalTitle = document.getElementById('cakeModalTitle');
const adminCancelCakeBtn = document.getElementById('adminCancelCakeBtn');

// Modal Helper Functions
function openCakeModal(cake = null) {
  if (!cakeModal) return;
  if (cake) {
    cakeModalTitle.textContent = `✏️ Edit Cake: ${cake.name}`;
    adminCakeId.value = cake._id;
    adminCakeName.value = cake.name || '';
    adminCakeCategory.value = cake.category || 'Chocolate';
    adminCakePrice.value = cake.price || '';
    adminCakeAvailability.value = (cake.availability !== undefined ? cake.availability : true).toString();
    adminCakeDescription.value = cake.description || '';
    adminCakeImageUrl.value = cake.imageUrl || '';
    adminSaveCakeBtn.textContent = 'Update Cake';
  } else {
    cakeModalTitle.textContent = '🛠️ Add New Cake Item';
    adminCakeId.value = '';
    adminCakeForm.reset();
    adminSaveCakeBtn.textContent = 'Save Cake';
  }
  cakeModal.classList.add('active');
}

function closeCakeModalFn() {
  if (cakeModal) cakeModal.classList.remove('active');
}

if (openAddCakeModalBtn) {
  openAddCakeModalBtn.addEventListener('click', () => openCakeModal());
}
if (closeCakeModal) {
  closeCakeModal.addEventListener('click', closeCakeModalFn);
}
if (adminCancelCakeBtn) {
  adminCancelCakeBtn.addEventListener('click', closeCakeModalFn);
}

// Mode Toggle Handler (Hides Cart & Notification buttons when in Admin mode)
modeToggleBtn.addEventListener('click', () => {
  if (currentMode === 'customer') {
    currentMode = 'admin';
    customerView.style.display = 'none';
    adminView.style.display = 'block';
    headerTitle.textContent = '🛠️ Cake Delight Admin Panel';
    userBadge.innerHTML = 'Role: <strong style="color:var(--accent);">Admin</strong>';
    modeToggleBtn.textContent = '👤 Switch to Customer';
    modeToggleBtn.style.background = '#0284c7';
    modeToggleBtn.style.borderColor = '#0284c7';
    
    // Hide Cart & Notifications buttons in Admin view
    cartBtn.style.display = 'none';
    notifBtn.style.display = 'none';

    switchAdminTab('overview');
  } else {
    currentMode = 'customer';
    customerView.style.display = 'block';
    adminView.style.display = 'none';
    headerTitle.textContent = 'Cake Delight UI';
    userBadge.innerHTML = 'User: <strong>user-123</strong>';
    modeToggleBtn.textContent = '🛠️ Switch to Admin';
    modeToggleBtn.style.background = '#7c3aed';
    modeToggleBtn.style.borderColor = '#6d28d9';
    
    // Show Cart & Notifications buttons in Customer view
    cartBtn.style.display = 'inline-block';
    notifBtn.style.display = 'inline-block';

    loadCakes();
  }
});

// Load Admin Catalog
async function loadAdminCakes() {
  if (!adminCakesList) return;
  adminCakesList.innerHTML = '<div class="loading">Loading catalog for admin...</div>';
  const res = await apiCall('/cakes');

  if (!res.data || !res.data.success || !res.data.data) {
    adminCakesList.innerHTML = '<p class="empty-text">Failed to load catalog.</p>';
    return;
  }

  const cakes = res.data.data;
  adminCakesList.innerHTML = '';
  if (adminRatingCakeSelect) {
    adminRatingCakeSelect.innerHTML = '<option value="">All Cakes (Show All Reviews)</option>';
  }

  cakes.forEach(cake => {
    cakesMap[cake._id] = cake;

    // Populate Rating Select options
    if (adminRatingCakeSelect) {
      const opt = document.createElement('option');
      opt.value = cake._id;
      opt.textContent = `${cake.name} (${cake.category})`;
      adminRatingCakeSelect.appendChild(opt);
    }

    const isStock = cake.availability;
    const img = cake.imageUrl || DEFAULT_CAKE_IMG;

    const item = document.createElement('div');
    item.className = 'cake-card';
    item.innerHTML = `
      <img src="${img}" alt="${cake.name}" class="cake-img" onerror="this.src='${DEFAULT_CAKE_IMG}'">
      <div class="cake-card-body">
        <div class="cake-name">${cake.name}</div>
        <div class="cake-meta">${cake.category} • $${cake.price}</div>
        <div class="cake-meta">Status: <strong style="color:${isStock ? 'var(--success)' : 'var(--danger)'};">${isStock ? 'In Stock' : 'Out of Stock'}</strong></div>
        <div class="cake-price-row" style="margin-top:0.4rem;">
          <button class="btn btn-outline btn-sm" onclick="editCakeById('${cake._id}')">Edit ✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteAdminCake('${cake._id}')">Delete 🗑️</button>
        </div>
      </div>
    `;
    adminCakesList.appendChild(item);
  });
}

function editCakeById(cakeId) {
  const cake = cakesMap[cakeId];
  if (cake) openCakeModal(cake);
}

// Add / Update Cake Submit Handler (Supports all schema fields: name, category, price, availability, description, imageUrl)
adminCakeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = adminCakeId.value;
  const name = adminCakeName.value.trim();
  const category = adminCakeCategory.value;
  const price = Number(adminCakePrice.value);
  const availability = adminCakeAvailability.value === 'true';
  const description = adminCakeDescription.value.trim();
  const imageUrl = adminCakeImageUrl.value.trim();

  const payload = { name, category, price, availability, description, imageUrl };

  let res;
  if (id) {
    // PUT /api/cakes/:id
    res = await apiCall(`/cakes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } else {
    // POST /api/cakes
    res = await apiCall('/cakes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  if (res.data && res.data.success) {
    showToast(id ? 'Cake updated successfully!' : 'New cake added to catalog!', 'success');
    closeCakeModalFn();
    loadAdminCakes();
  } else {
    showToast(res.data?.message || 'Failed to save cake', 'danger');
  }
});

// Delete Admin Cake Handler
async function deleteAdminCake(cakeId) {
  if (!confirm(`Are you sure you want to delete cake ID ${cakeId}?`)) return;
  const res = await apiCall(`/cakes/${cakeId}`, { method: 'DELETE' });

  if (res.data && res.data.success) {
    showToast('Cake deleted from catalog!', 'success');
    loadAdminCakes();
  } else {
    showToast(res.data?.message || 'Failed to delete cake', 'danger');
  }
}

// Admin Order Inspector Handler (GET /api/orders/:id)
adminInspectOrderBtn.addEventListener('click', async () => {
  const orderId = adminOrderIdInput.value.trim();
  if (!orderId) {
    showToast('Please enter an Order ID', 'danger');
    return;
  }
  const res = await apiCall(`/orders/${orderId}`);
  if (res.data && res.data.success) {
    showToast(`Loaded Order #${orderId} payload in API Inspector`, 'success');
  } else {
    showToast(res.data?.message || 'Order not found', 'danger');
  }
});

// Admin Cake Reviews Inspector Handler (GET /api/ratings or GET /api/ratings/cake/:cakeId)
async function loadAllAdminRatings(selectedCakeId = '') {
  if (!adminRatingsContainer) return;
  adminRatingsContainer.innerHTML = '<div class="loading">Loading ratings & reviews...</div>';

  const endpoint = selectedCakeId ? `/ratings/cake/${selectedCakeId}` : '/ratings';
  const res = await apiCall(endpoint);

  if (!res.data || !res.data.success || !res.data.data) {
    adminRatingsContainer.innerHTML = '<p class="empty-text">Failed to load reviews.</p>';
    return;
  }

  const ratings = res.data.data;
  if (ratings.length === 0) {
    adminRatingsContainer.innerHTML = '<p class="empty-text">No customer reviews submitted yet.</p>';
    return;
  }

  adminRatingsContainer.innerHTML = '';
  ratings.forEach(r => {
    const cakeObj = cakesMap[r.cakeId];
    const cakeName = cakeObj ? cakeObj.name : `Cake ID: ${r.cakeId}`;

    const box = document.createElement('div');
    box.className = 'order-box';
    box.style.marginBottom = '0.4rem';
    box.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong style="color:var(--accent); font-size:0.82rem;">${cakeName}</strong>
        <span style="font-weight:600; color:#eab308; font-size:0.82rem;">${r.rating} ⭐</span>
      </div>
      <div style="margin-top:0.25rem; color:var(--text-main); font-style:italic;">"${r.review || 'No written feedback'}"</div>
      <div style="margin-top:0.35rem; font-size:0.72rem; color:var(--text-muted); display:flex; justify-content:space-between; border-top:1px dashed var(--card-border); padding-top:0.25rem;">
        <span>User: <strong>${r.userId}</strong> ${r.orderId ? `• Order: #${r.orderId}` : ''}</span>
        <span>${r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : ''}</span>
      </div>
    `;
    adminRatingsContainer.appendChild(box);
  });
}

adminInspectRatingsBtn.addEventListener('click', () => {
  const cakeId = adminRatingCakeSelect.value;
  loadAllAdminRatings(cakeId);
});

const refreshAdminRatingsBtn = document.getElementById('refreshAdminRatingsBtn');
if (refreshAdminRatingsBtn) {
  refreshAdminRatingsBtn.addEventListener('click', () => {
    adminRatingCakeSelect.value = '';
    loadAllAdminRatings();
  });
}

// Initial Calls
initBasket();
loadCakes();
loadOrders();
loadNotifications();
