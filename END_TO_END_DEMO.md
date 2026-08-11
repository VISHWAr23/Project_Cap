# 🎬 End-to-End Application Flow Demonstration

This document provides a simple, step-by-step demonstration of the **Cake Delight Application** workflow from both the **Customer** and **Admin** perspectives.

---

## 👤 Part 1: Customer View Demonstration Flow

### Step 1: Browse & Filter Cakes Catalog
1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Under the **`🎂 Cakes Catalog`** tab, browse the available cakes displayed as visual cards with cake images, category tags, price tags, and rating stars.
3. Use the **Catalog Filter** to search cakes by name, filter by category (*Chocolate, Birthday, Fruit, Specialty*), or set price ranges (*Min $ / Max $*).

### Step 2: Add Items to Shopping Basket
1. Click the **`Add +1`** button on any cake card.
2. Switch to the **`🛒 Shopping Basket`** tab in the navigation bar.
3. View the added items, update item quantities using the **`+`** / **`-`** buttons, or remove items. The total cost updates automatically.

### Step 3: Checkout Order
1. On the **`🛒 Shopping Basket`** tab, click **`Checkout Order`**.
2. **What happens under the hood**:
   - Order Service saves the confirmed order in `order_db`.
   - Order Service publishes an `order.created` event to **RabbitMQ**.
   - Notification Service listens to RabbitMQ and logs a customer notification automatically.

### Step 4: View Order History
1. Switch to the **`📦 My Orders`** tab in the navigation bar.
2. View your placed orders along with order IDs, item breakdowns, total cost, and status (*CONFIRMED*).

### Step 5: Submit Cake Rating & Review
1. On any confirmed order item under **`📦 My Orders`**, click **`⭐ Rate`**.
2. In the rating modal popup, select a star rating (1 to 5 stars) and enter review feedback.
3. Click **Submit Rating**.
4. **What happens under the hood**:
   - Rating Service stores the review in `rating_db`.
   - Rating Service sends an HTTP request to Catalog Service to recalculate and update the cake's `averageRating` and `ratingCount`.

### Step 6: View Notifications
1. Switch to the **`🔔 Notifications`** tab in the navigation bar.
2. Inspect real-time order confirmation notifications delivered asynchronously by Notification Service.

---

## 🛡️ Part 2: Admin Panel Demonstration Flow

### Step 1: Switch to Admin Mode
Click the **`🛡️ Switch to Admin`** button in the header bar to enter Admin Mode.

### Step 2: Overview KPI Dashboard (`📊 Overview` Tab)
View live platform analytics:
- **Catalog Items Count** & In-Stock Ratio.
- **Total Orders Captured** & Total Revenue ($).
- **Average Platform Rating**.
- **System Online Status**.

### Step 3: Manage Catalog Items (`🍰 Catalog` Tab)
- **Add New Cake**: Click **`➕ Add New Cake Item`**, enter name, category, price, stock status, description, and image URL, then click **Save Cake**.
- **Edit Cake**: Click **`Edit ✏️`** on any cake card to modify price or stock availability.
- **Delete Cake**: Click **`Delete 🗑️`** to remove an item from the catalog.

### Step 4: System Orders Inspection (`📦 Orders` Tab)
- View a complete feed of all customer orders placed across the system.
- Use the **Order Lookup Inspector** to input an Order ID and inspect its raw payload.

### Step 5: Ratings & Reviews Moderator (`⭐ Ratings` Tab)
- Select any cake from the dropdown menu to inspect customer reviews, star scores, user IDs, and submission timestamps.

### Step 6: Microservices Health Probes (`🟢 Health` Tab)
1. Click **`Check All Health`**.
2. Real-time REST health probes (`/health`) ping all 5 microservices:
   - `API Gateway` 🟢
   - `Catalog Service` 🟢
   - `Order Service` 🟢
   - `Rating Service` 🟢
   - `Notification Service` 🟢

---

## ⚡ Part 3: Live Backend API Inspector

The right half (50%) of the interface contains a **Live Backend API Inspector**:
- **Latest API Request / Response**: Displays the exact HTTP method (`GET`, `POST`, `PUT`, `DELETE`), endpoint URL, request payload, and JSON response payload in real time.
- **API Activity Stream**: A chronological log of every API call triggered by user actions, complete with status badges (`200 OK`, `201 Created`) and timestamps.
