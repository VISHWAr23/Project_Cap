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

    const item = document.createElement('div');
    item.className = 'cake-item';
    item.innerHTML = `
      <div class="cake-info">
        <span class="cake-name">${cake.name}</span>
        <span class="cake-meta">${cake.category} | $${cake.price} | ${ratingText}</span>
      </div>
      <button class="btn btn-primary btn-sm" onclick="addToBasket('${cake._id}')" ${!cake.availability ? 'disabled' : ''}>
        ${cake.availability ? 'Add +1' : 'Off Stock'}
      </button>
    `;
    cakesGrid.appendChild(item);
  }
}

// 3. Add to Basket
async function addToBasket(cakeId) {
  if (!currentBasketId) await initBasket();
  const res = await apiCall(`/baskets/${currentBasketId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cakeId, quantity: 1 })
  });

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

// Initial Calls
initBasket();
loadCakes();
loadOrders();
loadNotifications();
