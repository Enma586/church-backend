# Church Management System - Backend API

## Overview
This repository contains the RESTful API that powers the Church Management System. Engineered for high performance, data privacy, and localized deployment, this Node.js and Express server acts as the central data processing hub. It is specifically architected to run in a local or on-premise environment, serving a companion native desktop application built with Tauri.  

This project demonstrates proficiency in building robust backend services, managing non-relational databases, orchestrating containerized deployments, and designing APIs optimized for local desktop client consumption.

## System Architecture Strategy: Local-First & Containerized
Unlike traditional cloud-only SaaS products, this system is designed for institutions that require strict local data governance and offline-capable networks.

* **Containerized Backend:** The API and database are fully Dockerized (`Dockerfile`, `docker-compose`, `docker-entrypoint.sh`). This ensures a zero-configuration, reproducible environment that can be deployed on any local office server or directly on the administrator's machine.  
* **Native Desktop Integration:** The backend exposes endpoints consumed strictly by a lightweight, cross-platform desktop executable (`.exe` / `.app`) built with React, Rust, and Tauri.
* **Cloud-Assisted Reliability:** While the system runs locally, it securely interfaces with Google Cloud Platform (GCP) for automated database backups (Google Drive API) and external agenda synchronization (Google Calendar API).

## Tech Stack
* **Core:** Node.js, Express.js  
* **Database:** MongoDB, Mongoose (ODM)
* **Security:** JSON Web Tokens (JWT), Role-Based Access Control (RBAC)  
* **Validation:** Strict schema validation for all incoming payloads  
* **DevOps & Infrastructure:** Docker, Docker Compose  
* **Quality Assurance:** Vitest for comprehensive integration and unit testing  

## Core Modules
The business logic is modularized using Clean Architecture and Separation of Concerns (SoC) principles:  

* **Accounting Module:** Handles double-entry bookkeeping (Journal Entries), fiscal periods, and chart of accounts management.  
* **Identity and Access Management (IAM):** Secure user authentication and granular role-based permissions.  
* **Members and Sacraments:** Detailed tracking of member profiles, demographics, and sensitive pastoral notes.  
* **Schedule & Appointments:** Local event management with bidirectional synchronization to external Google Calendars.  
* **Automated Backup System:** Packages the local MongoDB data and securely transfers it to Google Drive for disaster recovery.  

## Local Setup and Deployment
The project relies on Docker for an isolated, frictionless local setup.

### Prerequisites
* **Docker** and **Docker Compose** installed on the host machine.
* **Node.js (v20+)** installed *only* if running outside of Docker for development purposes.

### Containerized Deployment (Recommended)
This is the standard procedure to run the backend locally so the Tauri desktop application can connect to it. Run the following commands in your terminal:

```bash
git clone [repository-url]
cd church-backend
cp .env.example .env
docker-compose up -d --build
docker exec -it [container_name] npm run seed
```
The API will now be running on http://localhost:3000 (or the port specified in your .env), ready to accept requests from the desktop executable.

### Local Development & Testing
To run the server without Docker for active development and execute the automated test suite, use:
```bash
npm install
npm run dev
npm run test
```
### Ecosystem & Frontend Integration
This backend does not serve HTML/CSS. It strictly serves JSON payloads to its companion desktop application.

* ***Frontend Repository:*** [[text](https://github.com/Enma586/church-frontend.git)]

* ***Client Architecture:*** The client is a native desktop executable compiled via Tauri (Rust/React).

* ***Inter-System Communication:*** The Tauri .exe connects to this local Dockerized backend via standard HTTP requests and WebSockets (src/config/socket.js) for real-time notifications and state synchronization.