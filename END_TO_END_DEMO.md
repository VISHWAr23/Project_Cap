# End-to-End Application Flow Demonstration

This document outlines the operational demonstration flow of the Cake Delight platform, covering both Customer View and Admin Panel workflows.

---

## 1. Customer Workflow Demonstration

### Step 1: Catalog Retrieval & Query Filtering
1. Open the application interface at `http://localhost:3000` (or `http://localhost:8080`).
2. Navigate to the **Cakes Catalog** tab.
3. Apply query filters:
   - **Search Query**: Filter by cake title substring (e.g., `Chocolate`).
   - **Category Filter**: Filter by category enum (`Chocolate`, `Birthday`, `Fruit`, `Specialty`).
   - **Price Range Filter**: Set minimum and maximum boundary parameters.
4. Verify HTTP request: `GET /api/cakes?name=Chocolate&category=Chocolate&minPrice=100&maxPrice=500` routed through API Gateway to Catalog Service.

### Step 2: Basket State Management
1. Click **Add +1** on a catalog card item.
2. Navigate to the **Shopping Basket** tab.
3. Perform item operations:
   - Increment quantity (`+`) or decrement quantity (`-`) via `PUT /api/baskets/:basketId/items/:itemId`.
   - Remove item (`✕`) via `DELETE /api/baskets/:basketId/items/:itemId`.
   - Clear entire basket via `DELETE /api/baskets/:basketId`.

### Step 3: Checkout Processing & Event Dispatch
1. Click **Checkout Order**.
2. **Execution Sequence**:
   - Order Service validates item prices against Catalog Service REST API.
   - Order Service creates an order document with status `CONFIRMED` in `order_db`.
   - Order Service publishes an `order.created` event payload (`{ orderId, userId, items, totalAmount }`) to the RabbitMQ exchange.
   - Notification Service consumes the event asynchronously from RabbitMQ queue and persists a notification record in `notification_db`.

### Step 4: Order Fulfillment History
1. Navigate to the **My Orders** tab.
2. Verify order persistence (`GET /api/orders?userId=user-123`).
3. Inspect order metadata including Order ID, item breakdown, price subtotal, and status tag.

### Step 5: Review Submission & Asynchronous Rating Synchronization
1. Under **My Orders**, click **Rate** on an item.
2. Select a star score (1 to 5) and submit text feedback (`POST /api/ratings`).
3. **Execution Sequence**:
   - Rating Service persists the review in `rating_db`.
   - Rating Service executes an internal REST update (`PUT /api/cakes/:id/rating`) to Catalog Service.
   - Catalog Service recalculates the cake's `averageRating` and `ratingCount` fields in `catalog_db`.

### Step 6: Asynchronous Notification Consumption
1. Navigate to the **Notifications** tab.
2. Verify notification retrieval (`GET /api/notifications/user/user-123`).
3. Confirm event consumer payload logging triggered by the RabbitMQ event stream.

---

## 2. Admin Panel Demonstration

### Step 1: Context Switch to Admin Panel
Click **Switch to Admin** in the header navigation bar to toggle `currentMode = 'admin'`.

### Step 2: KPI Analytics Dashboard (`Overview` Tab)
Inspect aggregated platform metrics:
- **Total Catalog Items** & In-Stock Ratio.
- **Total System Orders** & Revenue Aggregate ($).
- **Platform Average Rating**.
- **System Service Online Indicators**.

### Step 3: Catalog CRUD Operations (`Catalog` Tab)
- **Create Cake**: Click **Add New Cake Item** (`POST /api/cakes`).
- **Update Cake**: Click **Edit** on a card (`PUT /api/cakes/:id`). Modify price, category, stock availability (`true`/`false`), description, or image URL.
- **Delete Cake**: Click **Delete** (`DELETE /api/cakes/:id`).

### Step 4: System Orders Inspection (`Orders` Tab)
- View system-wide order history (`GET /api/orders`).
- Input a target Order ID into the **Order Lookup Inspector** (`GET /api/orders/:id`) to inspect the raw JSON response payload.

### Step 5: Customer Review Moderation (`Ratings` Tab)
- Filter customer review logs by cake item (`GET /api/ratings/cake/:cakeId`) or view system-wide submissions (`GET /api/ratings`).

### Step 6: Microservice Health Probe Diagnostics (`Health` Tab)
1. Click **Check All Health**.
2. Verify REST status probes across all 5 endpoints (`api-gateway`, `catalog-service`, `order-service`, `rating-service`, `notification-service`).

---

## 3. API Gateway Inspector Subsystem

The right-side 50% split panel provides real-time API inspection for technical assessment evaluation:
- **Latest Request / Response**: Displays exact HTTP Method, Target Endpoint URL, JSON Body Payload, and HTTP Response Status (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`).
- **Activity Stream**: Logs all REST calls with timestamps and status indicators.
