# 🛠️ Setup and Execution Instructions

This document provides simple, step-by-step instructions to set up and run the **Cake Delight Microservices Application**.

---

## 📋 Prerequisites

Before running the application, ensure you have the following installed on your machine:

1. **Docker Desktop** (with Docker Compose)
   - Download: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. **Git** (to clone/manage the repository)
3. *(Optional)* **Minikube & Kubectl** (if deploying to Kubernetes)

---

## 🚀 Option 1: Run with Docker Compose (Recommended)

Running with Docker Compose starts all 5 microservices, 4 MongoDB databases, and 1 RabbitMQ event broker in isolated containers automatically.

### Step 1: Open Terminal
Open your command prompt or terminal in the project directory:
```bash
cd Project_Cap
```

### Step 2: Build and Start Containers
Run the following command to build and launch all services:
```bash
docker compose up --build
```

### Step 3: Access the Application
Once all containers show `Up` or `Started`, open your web browser and go to:
- **Application URL**: [http://localhost:3000](http://localhost:3000) *(or http://localhost:8080)*

### Step 4: Stop the Application
To stop all containers cleanly, press `Ctrl + C` in the terminal or run:
```bash
docker compose down
```

---

## ☸️ Option 2: Run on Kubernetes (Minikube)

If you want to deploy the application on a Kubernetes cluster:

### Step 1: Start Minikube
```bash
minikube start
```

### Step 2: Apply Kubernetes Configurations
Apply all ConfigMaps, Deployments, and Services from the `k8s/` directory:
```bash
kubectl apply -f k8s/
```

### Step 3: Verify Pods and Services
Check that all pods are running:
```bash
kubectl get pods
```

### Step 4: Open API Gateway in Browser
Access the frontend API Gateway service:
```bash
minikube service api-gateway
```

---

## 📡 Microservices Ports & Infrastructure

| Service Name | Type | Container Port | Host Port | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **API Gateway** | Express Gateway | `3000` | `3000` / `8080` | Frontend UI & API Router |
| **Catalog Service** | Node.js Microservice | `3001` | `3001` | Manages cake catalog & stock |
| **Order Service** | Node.js Microservice | `3002` | `3002` | Manages baskets & checkout orders |
| **Rating Service** | Node.js Microservice | `3003` | `3003` | Manages ratings & review moderation |
| **Notification Service** | Node.js Microservice | `3004` | `3004` | Event-driven notifications via RabbitMQ |
| **Catalog Database** | MongoDB | `27017` | `27017` | Isolated storage for Catalog |
| **Order Database** | MongoDB | `27017` | `27018` | Isolated storage for Orders & Baskets |
| **Rating Database** | MongoDB | `27017` | `27019` | Isolated storage for Ratings |
| **Notification Database** | MongoDB | `27017` | `27020` | Isolated storage for Notifications |
| **Message Broker** | RabbitMQ | `5672` / `15672` | `5672` / `15672` | Asynchronous event broker |

---

## 🔍 Troubleshooting & Health Check

- **Check Container Status**:
  ```bash
  docker compose ps
  ```
- **View Container Logs**:
  ```bash
  docker compose logs -f api-gateway
  ```
- **Port Conflict Fix**:
  If port 3000 is occupied by another application, access the UI on port `8080` at [http://localhost:8080](http://localhost:8080).
