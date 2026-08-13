# Cake Delight - API Documentation

This document provides complete technical specifications for the REST API endpoints exposed by the **Cake Delight Microservices Platform**. 

All client requests should be routed through the **API Gateway** (`http://localhost:3000`), which proxies calls to the respective isolated microservices.

---

## Base URLs & Gateway Routing Summary

| Gateway Route Prefix | Target Service | Service URL | Description |
| :--- | :--- | :--- | :--- |
| `/api/cakes` | Catalog Service | `http://localhost:3001/cakes` | Cake inventory, category & pricing management |
| `/api/baskets` | Order Service | `http://localhost:3002/baskets` | Shopping basket creation & item state operations |
| `/api/orders` | Order Service | `http://localhost:3002/orders` | Checkout execution & order fulfillment history |
| `/api/ratings` | Rating Service | `http://localhost:3003/ratings` | Customer reviews & star rating submissions |
| `/api/notifications` | Notification Service | `http://localhost:3004/notifications` | Asynchronous order confirmation notifications |

---

## 1. System Health Probes

Each microservice exposes a `/health` endpoint for monitoring and container orchestration readiness.

| Method | Gateway Endpoint | Target Service | Success Response (`200 OK`) |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` or `/api/health` | API Gateway | `{ "status": "UP", "service": "api-gateway" }` |
| `GET` | `/api/cakes/health` | Catalog Service | `{ "status": "UP", "service": "catalog-service" }` |
| `GET` | `/api/orders/health` | Order Service | `{ "status": "UP", "service": "order-service" }` |
| `GET` | `/api/ratings/health` | Rating Service | `{ "status": "UP", "service": "rating-service" }` |
| `GET` | `/api/notifications/health` | Notification Service | `{ "status": "UP", "service": "notification-service" }` |

---

## 2. Catalog Service Endpoints (`/api/cakes`)

Manages the cake catalog, categories, pricing, stock availability, images, and aggregated ratings.

### 2.1 Get All Cakes
- **Method**: `GET`
- **Endpoint**: `/api/cakes`
- **Query Parameters (Optional)**:
  - `category` (string): Filter by category (e.g., `Chocolate`, `Fruit`, `Cheesecake`)
  - `name` (string): Case-insensitive search by cake name
  - `minPrice` (number): Minimum price filter
  - `maxPrice` (number): Maximum price filter
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 2,
    "data": [
      {
        "_id": "650000000000000000000001",
        "name": "Chocolate Truffle Cake",
        "category": "Chocolate",
        "price": 29.99,
        "description": "Rich dark chocolate layer cake",
        "stock": 15,
        "imageUrl": "https://images.unsplash.com/photo-5789855450626-899628066873",
        "averageRating": 4.5,
        "ratingCount": 10
      }
    ]
  }
  ```

### 2.2 Get Cake by ID
- **Method**: `GET`
- **Endpoint**: `/api/cakes/:id`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "650000000000000000000001",
      "name": "Chocolate Truffle Cake",
      "category": "Chocolate",
      "price": 29.99,
      "description": "Rich dark chocolate layer cake",
      "stock": 15,
      "imageUrl": "https://images.unsplash.com/photo-5789855450626-899628066873",
      "averageRating": 4.5,
      "ratingCount": 10
    }
  }
  ```
- **Error (`404 Not Found`)**: `{ "success": false, "message": "Cake not found" }`

### 2.3 Create Cake (Admin)
- **Method**: `POST`
- **Endpoint**: `/api/cakes`
- **Request Body**:
  ```json
  {
    "name": "Red Velvet Delight",
    "category": "Red Velvet",
    "price": 34.99,
    "description": "Smooth red velvet with cream cheese frosting",
    "stock": 20,
    "imageUrl": "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "650000000000000000000002",
      "name": "Red Velvet Delight",
      "category": "Red Velvet",
      "price": 34.99,
      "description": "Smooth red velvet with cream cheese frosting",
      "stock": 20,
      "imageUrl": "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e",
      "averageRating": 0,
      "ratingCount": 0
    }
  }
  ```

### 2.4 Update Cake (Admin)
- **Method**: `PUT`
- **Endpoint**: `/api/cakes/:id`
- **Request Body**: (Partial or full fields)
  ```json
  {
    "price": 32.99,
    "stock": 18
  }
  ```
- **Response (`200 OK`)**: `{ "success": true, "data": { ...updatedCake } }`

### 2.5 Delete Cake (Admin)
- **Method**: `DELETE`
- **Endpoint**: `/api/cakes/:id`
- **Response (`200 OK`)**: `{ "success": true, "message": "Cake deleted successfully" }`

---

## 3. Order Service - Basket Endpoints (`/api/baskets`)

Handles transient cart operations before checkout.

### 3.1 Initialize Basket
- **Method**: `POST`
- **Endpoint**: `/api/baskets`
- **Request Body** (Optional): `{ "userId": "user123" }`
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "basket_650000000001",
      "userId": "user123",
      "items": [],
      "totalAmount": 0
    }
  }
  ```

### 3.2 Get Basket by ID
- **Method**: `GET`
- **Endpoint**: `/api/baskets/:id`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "basket_650000000001",
      "userId": "user123",
      "items": [
        {
          "cakeId": "650000000000000000000001",
          "name": "Chocolate Truffle Cake",
          "price": 29.99,
          "quantity": 2
        }
      ],
      "totalAmount": 59.98
    }
  }
  ```

### 3.3 Add Item to Basket
- **Method**: `POST`
- **Endpoint**: `/api/baskets/:id/items`
- **Request Body**:
  ```json
  {
    "cakeId": "650000000000000000000001",
    "quantity": 2
  }
  ```
- **Response (`200 OK`)**: `{ "success": true, "data": { ...updatedBasket } }`

### 3.4 Update Item Quantity in Basket
- **Method**: `PUT`
- **Endpoint**: `/api/baskets/:id/items/:cakeId`
- **Request Body**: `{ "quantity": 3 }`
- **Response (`200 OK`)**: `{ "success": true, "data": { ...updatedBasket } }`

### 3.5 Remove Item from Basket
- **Method**: `DELETE`
- **Endpoint**: `/api/baskets/:id/items/:cakeId`
- **Response (`200 OK`)**: `{ "success": true, "data": { ...updatedBasket } }`

### 3.6 Clear Basket
- **Method**: `DELETE`
- **Endpoint**: `/api/baskets/:id`
- **Response (`200 OK`)**: `{ "success": true, "message": "Basket cleared successfully" }`

---

## 4. Order Service - Checkout & Order Endpoints (`/api/orders`)

Processes order creation, validates catalog prices, and publishes RabbitMQ events.

### 4.1 Checkout Basket
- **Method**: `POST`
- **Endpoint**: `/api/orders/checkout`
- **Request Body**:
  ```json
  {
    "basketId": "basket_650000000001",
    "customerName": "Jane Doe",
    "customerEmail": "jane@example.com",
    "shippingAddress": "123 Baker Street, London"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Order created successfully",
    "data": {
      "_id": "650000000000000000000099",
      "customerName": "Jane Doe",
      "customerEmail": "jane@example.com",
      "shippingAddress": "123 Baker Street, London",
      "items": [
        {
          "cakeId": "650000000000000000000001",
          "name": "Chocolate Truffle Cake",
          "price": 29.99,
          "quantity": 2
        }
      ],
      "totalAmount": 59.98,
      "status": "CONFIRMED",
      "createdAt": "2026-08-13T10:00:00.000Z"
    }
  }
  ```

### 4.2 Get All Orders
- **Method**: `GET`
- **Endpoint**: `/api/orders`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [ ...ordersList ]
  }
  ```

### 4.3 Get Order by ID
- **Method**: `GET`
- **Endpoint**: `/api/orders/:id`
- **Response (`200 OK`)**: `{ "success": true, "data": { ...orderDetails } }`

---

## 5. Rating Service Endpoints (`/api/ratings`)

Stores customer ratings/reviews and updates aggregate ratings in Catalog Service.

### 5.1 Submit Rating
- **Method**: `POST`
- **Endpoint**: `/api/ratings`
- **Request Body**:
  ```json
  {
    "cakeId": "650000000000000000000001",
    "customerName": "Jane Doe",
    "rating": 5,
    "comment": "Absolutely delicious!"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "rating_65000001",
      "cakeId": "650000000000000000000001",
      "customerName": "Jane Doe",
      "rating": 5,
      "comment": "Absolutely delicious!",
      "createdAt": "2026-08-13T10:05:00.000Z"
    }
  }
  ```

### 5.2 Get All Ratings
- **Method**: `GET`
- **Endpoint**: `/api/ratings`
- **Response (`200 OK`)**: `{ "success": true, "count": 5, "data": [ ...ratings ] }`

### 5.3 Get Ratings for a Specific Cake
- **Method**: `GET`
- **Endpoint**: `/api/ratings/cake/:cakeId`
- **Response (`200 OK`)**: `{ "success": true, "count": 3, "data": [ ...cakeRatings ] }`

### 5.4 Get Average Rating Score for a Cake
- **Method**: `GET`
- **Endpoint**: `/api/ratings/cake/:cakeId/average`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "cakeId": "650000000000000000000001",
    "averageRating": 4.67,
    "ratingCount": 3
  }
  ```

---

## 6. Notification Service Endpoints (`/api/notifications`)

Stores and exposes order confirmation notifications generated asynchronously via RabbitMQ events.

### 6.1 Get All Notifications
- **Method**: `GET`
- **Endpoint**: `/api/notifications`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "_id": "notif_65000001",
        "orderId": "650000000000000000000099",
        "customerEmail": "jane@example.com",
        "message": "Order 650000000000000000000099 has been confirmed! Total: $59.98.",
        "status": "SENT",
        "createdAt": "2026-08-13T10:00:01.000Z"
      }
    ]
  }
  ```

### 6.2 Get Notifications by User / Email
- **Method**: `GET`
- **Endpoint**: `/api/notifications/user/:userId`
- **Response (`200 OK`)**: `{ "success": true, "data": [ ...userNotifications ] }`

### 6.3 Get Notification by ID
- **Method**: `GET`
- **Endpoint**: `/api/notifications/:id`
- **Response (`200 OK`)**: `{ "success": true, "data": { ...notificationDetails } }`
