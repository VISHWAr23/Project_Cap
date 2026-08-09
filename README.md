# Cake Delight - Microservices Capstone Project

A lightweight, production-ready Node.js microservices application built for technical assessments. **Cake Delight** allows users to browse and filter cakes, manage a shopping basket, checkout orders, rate purchased cakes, and receive automated order confirmation notifications via event-driven RabbitMQ messaging.

---

## 1. Project Overview

Cake Delight is architected as 4 independent domain microservices managed by an API Gateway and supported by asynchronous event messaging via RabbitMQ. Each microservice strictly owns its dedicated MongoDB database.

---

## 2. Architecture

```
                                  +-----------------------+
                                  |    HTML/CSS/JS UI     |
                                  +-----------+-----------+
                                              | HTTP
                                              v
                                  +-----------------------+
                                  |      API Gateway      | (Port 3000)
                                  +---+---+-------+---+---+
                                      |   |       |   |
            +-------------------------+   |       |   +-------------------------+
            | HTTP                        | HTTP  | HTTP                        | HTTP
            v                             v       v                             v
+-----------------------+   +-----------------------+   +-----------------------+   +-----------------------+
|    Catalog Service    |   |     Order Service     |   |    Rating Service     |   | Notification Service  |
|      (Port 3001)      |   |      (Port 3002)      |   |      (Port 3003)      |   |      (Port 3004)      |
+-----------+-----------+   +---+---------------+---+   +-----------+-----------+   +-----------+-----------+
            |                   |               |                   |                           |
            v DB                v REST          v RabbitMQ          v DB                        v DB
    [ catalog_db ]      (Catalog Check)  [ OrderCompleted ]   [ rating_db ]           [ notification_db ]
                                                |
                                                v
                                        +---------------+
                                        |   RabbitMQ    |
                                        +---------------+
```

---

## 3. Technologies

- **Backend**: Node.js, Express.js (JavaScript CommonJS)
- **Database**: MongoDB, Mongoose ORM
- **Messaging**: RabbitMQ (`amqplib`)
- **API Gateway**: `express-http-proxy`
- **Frontend**: HTML5, Vanilla CSS3, JavaScript (Fetch API)
- **DevOps**: Docker, Docker Compose, Kubernetes manifests (`kubectl`)
- **Testing**: Jest, Supertest

---

## 4. Microservices

1. **API Gateway (`port 3000`)**: Routes client requests to target microservices and serves the web frontend.
2. **Catalog Service (`port 3001`)**: Manages cake inventory, details, categories, prices, and search filtering.
3. **Order Service (`port 3002`)**: Manages shopping baskets, cart item operations, checkout validation against Catalog REST API, order creation, and publishing `OrderCompleted` events.
4. **Rating Service (`port 3003`)**: Handles cake reviews and ratings (1 to 5 stars) and calculates average scores.
5. **Notification Service (`port 3004`)**: Consumes `OrderCompleted` events asynchronously from RabbitMQ and stores notifications idempotently.

---

## 5. Database Structure

Each microservice owns an isolated MongoDB database:

| Service | Database Name | Primary Collections |
| :--- | :--- | :--- |
| Catalog Service | `catalog_db` | `cakes` |
| Order Service | `order_db` | `baskets`, `orders` |
| Rating Service | `rating_db` | `ratings` |
| Notification Service | `notification_db` | `notifications` |

---

## 6. Folder Structure

```
cake-delight/
├── api-gateway/
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── catalog-service/
│   ├── models/Cake.js
│   ├── controllers/cakeController.js
│   ├── routes/cakeRoutes.js
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── order-service/
│   ├── models/Basket.js
│   ├── models/Order.js
│   ├── models/OrderItem.js
│   ├── controllers/basketController.js
│   ├── controllers/orderController.js
│   ├── routes/basketRoutes.js
│   ├── routes/orderRoutes.js
│   ├── rabbitmq.js
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── rating-service/
│   ├── models/Rating.js
│   ├── controllers/ratingController.js
│   ├── routes/ratingRoutes.js
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── notification-service/
│   ├── models/Notification.js
│   ├── controllers/notificationController.js
│   ├── routes/notificationRoutes.js
│   ├── rabbitmq.js
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── tests/
│   ├── catalog.test.js
│   ├── order.test.js
│   ├── rating.test.js
│   └── notification.test.js
├── k8s/
│   ├── catalog.yaml
│   ├── order.yaml
│   ├── rating.yaml
│   ├── notification.yaml
│   ├── gateway.yaml
│   ├── mongodb.yaml
│   └── rabbitmq.yaml
├── docker-compose.yml
├── package.json
├── README.md
└── .gitignore
```

---

## 7. Prerequisites

- **Node.js**: v18+ and `npm`
- **MongoDB**: Running locally on `localhost:27017` (or via Docker)
- **RabbitMQ**: Running locally on `amqp://localhost:5672` (or via Docker)
- **Docker & Docker Compose** (Optional for container deployment)
- **Kubernetes / Minikube** (Optional for cluster deployment)

---

## 8. Installation

Clone the repository and install root test dependencies:

```bash
cd cake-delight
npm install
```

Install dependencies inside individual microservices if running locally without Docker:

```bash
cd catalog-service && npm install && cd ..
cd order-service && npm install && cd ..
cd rating-service && npm install && cd ..
cd notification-service && npm install && cd ..
cd api-gateway && npm install && cd ..
```

---

## 9. Environment Variables

Each microservice reads configuration from standard `.env` files.

### Catalog Service (`catalog-service/.env`)
```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/catalog_db
```

### Order Service (`order-service/.env`)
```env
PORT=3002
MONGO_URI=mongodb://localhost:27017/order_db
CATALOG_SERVICE_URL=http://localhost:3001
RABBITMQ_URL=amqp://localhost
```

### Rating Service (`rating-service/.env`)
```env
PORT=3003
MONGO_URI=mongodb://localhost:27017/rating_db
```

### Notification Service (`notification-service/.env`)
```env
PORT=3004
MONGO_URI=mongodb://localhost:27017/notification_db
RABBITMQ_URL=amqp://localhost
```

### API Gateway (`api-gateway/.env`)
```env
PORT=3000
CATALOG_SERVICE_URL=http://localhost:3001
ORDER_SERVICE_URL=http://localhost:3002
RATING_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:3004
```

---

## 10. Running Locally

Start MongoDB and RabbitMQ locally, then launch each service in separate terminal windows:

```bash
# Terminal 1: Catalog Service
cd catalog-service && npm start

# Terminal 2: Order Service
cd order-service && npm start

# Terminal 3: Rating Service
cd rating-service && npm start

# Terminal 4: Notification Service
cd notification-service && npm start

# Terminal 5: API Gateway
cd api-gateway && npm start
```

Access the Web Application in your browser: `http://localhost:3000`

---

## 11. Running with Docker Compose

Build and launch all 5 microservices, 4 isolated MongoDB instances, and RabbitMQ:

```bash
docker compose up --build
```

Access the Web UI at `http://localhost:3000`.

To stop containers:
```bash
docker compose down
```

---

## 12. Running with Kubernetes

Deploy all infrastructure and microservices to Kubernetes:

```bash
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/rabbitmq.yaml
kubectl apply -f k8s/catalog.yaml
kubectl apply -f k8s/order.yaml
kubectl apply -f k8s/rating.yaml
kubectl apply -f k8s/notification.yaml
kubectl apply -f k8s/gateway.yaml
```

Access the API Gateway via NodePort at `http://localhost:30000`.

---

## 13. API Documentation

### Catalog Service (`/api/cakes`)

| Method | Endpoint | Purpose | HTTP Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cakes` | Fetch all cakes (supports filters `name`, `category`, `minPrice`, `maxPrice`) | 200 |
| `GET` | `/api/cakes/:id` | Fetch single cake details | 200 / 404 |
| `POST` | `/api/cakes` | Create a new cake item | 201 / 400 |
| `PUT` | `/api/cakes/:id` | Update existing cake details | 200 / 404 |
| `DELETE` | `/api/cakes/:id` | Remove cake from catalog | 200 / 404 |

### Order Service (`/api/baskets` & `/api/orders`)

| Method | Endpoint | Purpose | HTTP Status |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/baskets` | Create new basket | 201 |
| `GET` | `/api/baskets/:id` | Fetch basket by ID | 200 / 404 |
| `POST` | `/api/baskets/:id/items` | Add cake to basket | 200 / 400 |
| `PUT` | `/api/baskets/:id/items/:itemId` | Update quantity | 200 / 400 |
| `DELETE` | `/api/baskets/:id/items/:itemId` | Remove basket item | 200 / 404 |
| `DELETE` | `/api/baskets/:id` | Clear basket items | 200 |
| `POST` | `/api/orders/checkout` | Validate with Catalog REST API & place order | 201 / 400 / 404 |
| `GET` | `/api/orders` | Fetch orders (`?userId=user-123`) | 200 |
| `GET` | `/api/orders/:id` | Fetch order details | 200 / 404 |

### Rating Service (`/api/ratings`)

| Method | Endpoint | Purpose | HTTP Status |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ratings` | Submit cake rating (1-5 stars) | 201 / 400 |
| `GET` | `/api/ratings/cake/:cakeId` | Get all ratings for a cake | 200 |
| `GET` | `/api/ratings/cake/:cakeId/average` | Get calculated average rating & count | 200 |
| `GET` | `/api/ratings/:id` | Get rating details | 200 / 404 |
| `PUT` | `/api/ratings/:id` | Update rating | 200 |
| `DELETE` | `/api/ratings/:id` | Delete rating | 200 |

### Notification Service (`/api/notifications`)

| Method | Endpoint | Purpose | HTTP Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Get all notifications | 200 |
| `GET` | `/api/notifications/user/:userId` | Get user notifications | 200 |
| `GET` | `/api/notifications/:id` | Get single notification | 200 / 404 |

---

## 14. Sample Requests & Responses

### Checkout Request (`POST /api/orders/checkout`)

**Request Body:**
```json
{
  "basketId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "userId": "user-123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Checkout completed successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
    "userId": "user-123",
    "items": [
      {
        "cakeId": "64f1a2b3c4d5e6f7a8b9c0d0",
        "quantity": 2,
        "price": 350
      }
    ],
    "totalAmount": 700,
    "status": "CONFIRMED",
    "createdAt": "2026-08-08T11:20:00.000Z"
  }
}
```

---

## 15. RabbitMQ Event Flow

1. **Checkout Event**: When Order Service successfully processes `/orders/checkout`, it constructs an `OrderCompleted` event object:
   ```json
   {
     "eventId": "event-64f1a2b3c4d5e6f7a8b9c0d2-1723116000000",
     "eventType": "OrderCompleted",
     "orderId": "64f1a2b3c4d5e6f7a8b9c0d2",
     "userId": "user-123",
     "totalAmount": 700,
     "message": "Your order #64f1a2b3c4d5e6f7a8b9c0d2 has been confirmed. Total: $700"
   }
   ```
2. **RabbitMQ Exchange**: Published to exchange `cake-events` with routing key `order.completed`.
3. **Notification Consumer**: Notification Service listens to queue `order-notifications`.
4. **Idempotency & Storage**: Checks if `eventId` already exists in `notification_db`. If not, saves notification with status `SENT` and logs:
   `"Order confirmation sent to user-123"`

---

## 16. Frontend Usage

The Web Application at `http://localhost:3000` provides an intuitive UI:
1. **Catalog**: View live cakes, filter by name, category, or min/max price.
2. **Cart Drawer**: Click **"Basket"** to modify item quantities, remove items, or clear the basket.
3. **Checkout**: Click **"Proceed to Checkout"**. Order Service validates cake prices with Catalog Service and confirms order.
4. **Notifications**: Click **"Notifications"** to see order confirmations delivered asynchronously by Notification Service via RabbitMQ.
5. **Rating**: Click **"Rate Cake"** on any placed order to submit 1-5 star ratings and reviews.

---

## 17. Testing

Run automated test suites across all services:

```bash
npm test
```

---

## 18. End-to-End Demo Steps

1. **Launch App**: Run `docker compose up --build` or start local services.
2. **Open Frontend**: Navigate to `http://localhost:3000`.
3. **Browse & Filter**: Filter by category `Chocolate` or price `$300-$500`.
4. **Add to Cart**: Click **"Add to Basket"** on Classic Chocolate Fudge Cake.
5. **Update Cart**: Open Basket, increase quantity to `2`, verify total `$700`.
6. **Checkout**: Click **"Proceed to Checkout"**. Observe success toast.
7. **Verify Event**: Open **"Notifications"** modal to see order confirmation message generated by RabbitMQ consumer.
8. **Rate Cake**: Scroll to **My Orders**, click **"Rate Cake"**, select `5 Stars`, and submit.
9. **Verify Average Rating**: Notice cake badge updates to reflect latest average score!
