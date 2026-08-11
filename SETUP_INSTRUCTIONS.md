# Setup and Execution Instructions

This document provides developer-level setup, configuration, and execution instructions for the Cake Delight microservices platform.

---

## Prerequisites

Ensure the following tools are installed on your host system:

- **Docker Desktop** (v20.10+ with Docker Compose v2.0+)
- **Git**
- *(Optional)* **Minikube** & **kubectl** (for Kubernetes deployment verification)

---

## Deployment Option 1: Docker Compose (Recommended)

Docker Compose orchestrates all 5 microservices, 4 MongoDB instances, and the RabbitMQ message broker in isolated containers within a shared bridge network (`project_cap_default`).

### 1. Build and Start Services

Run the following command from the root directory:

```bash
docker compose up --build
```

To run in detached background mode:

```bash
docker compose up -d --build
```

### 2. Application Endpoint Access

Once containers are active, access the API Gateway & User Interface at:

- **Primary Gateway URL**: [http://localhost:3000](http://localhost:3000)
- **Fallback Gateway URL**: [http://localhost:8080](http://localhost:8080)

### 3. Service Termination

To stop all running containers and release bound network ports:

```bash
docker compose down
```

To remove containers, network bridges, and volumes:

```bash
docker compose down -v
```

---

## Deployment Option 2: Kubernetes (Minikube)

Manifests for Kubernetes objects (ConfigMaps, Deployments, Services) are located in the `k8s/` directory.

### 1. Start Local Cluster

```bash
minikube start
```

### 2. Apply Manifests

```bash
kubectl apply -f k8s/
```

### 3. Verify Deployment Status

```bash
kubectl get pods
kubectl get services
```

### 4. Expose API Gateway Service

```bash
minikube service api-gateway
```

---

## Network & Port Allocation

| Component | Architecture Role | Internal Port | Host Port | Database / Dependency |
| :--- | :--- | :--- | :--- | :--- |
| **api-gateway** | Reverse Proxy & Static UI | `3000` | `3000` / `8080` | N/A |
| **catalog-service** | Inventory Management REST API | `3001` | `3001` | `catalog-mongo` (`catalog_db`) |
| **order-service** | Basket & Order Processing REST API | `3002` | `3002` | `order-mongo` (`order_db`), Catalog REST API, RabbitMQ |
| **rating-service** | Rating & Review Moderation REST API | `3003` | `3003` | `rating-mongo` (`rating_db`), Catalog REST API |
| **notification-service** | Asynchronous Event Consumer API | `3004` | `3004` | `notification-mongo` (`notification_db`), RabbitMQ Consumer |
| **catalog-mongo** | Isolated Catalog Database | `27017` | `27017` | Persistent Volume `catalog_db_data` |
| **order-mongo** | Isolated Order Database | `27017` | `27018` | Persistent Volume `order_db_data` |
| **rating-mongo** | Isolated Rating Database | `27017` | `27019` | Persistent Volume `rating_db_data` |
| **notification-mongo** | Isolated Notification Database | `27017` | `27020` | Persistent Volume `notification_db_data` |
| **rabbitmq** | Event Broker & AMQP Exchange | `5672` / `15672` | `5672` / `15672` | AMQP Protocol & Web Management UI |

---

## Service Health & Diagnostics

- **Inspect Running Containers**:
  ```bash
  docker compose ps
  ```

- **Inspect Service Logs**:
  ```bash
  docker compose logs -f [service_name]
  ```

- **Microservice Health Probes**:
  Each microservice exposes a `/health` REST endpoint accessible via API Gateway:
  - `GET http://localhost:3000/api/cakes/health`
  - `GET http://localhost:3000/api/orders/health`
  - `GET http://localhost:3000/api/ratings/health`
  - `GET http://localhost:3000/api/notifications/health`
