# 🎟️ Ticket Booking Platform

## Overview

Ticket Booking Platform is a full-stack event ticket booking application that enables users to browse events, reserve seats, make wallet-based payments, and manage their bookings. The application also provides a dedicated Admin Dashboard for managing events, seats, bookings, refunds, and platform statistics.

The frontend is built using **React 19** and communicates with a **Node.js, Express.js, and MongoDB** backend. The backend is designed to safely handle concurrent booking operations using MongoDB transactions, ensuring that:

- A seat cannot be booked by multiple users simultaneously.
- Wallet deductions occur only once per successful booking.
- Booking operations remain consistent even under concurrent requests.

---

# Live Demo

### Frontend

https://ticket-booking-frontend-rho.vercel.app

### Backend API

https://booking-backend-0gma.onrender.com

> **Note**
>
> The backend is hosted on **Render's Free Tier**. After periods of inactivity, the server enters sleep mode. The first request may take approximately **30–50 seconds** while the server starts. Subsequent requests will respond normally.

---

# Features

## User Features

- User Registration and Login
- JWT Authentication
- Browse Active Events
- Interactive Seat Selection
- Guest Seat Reservation
- Automatic Seat Claim After Login
- Wallet-based Ticket Payment
- Booking History
- Wallet Transaction History
- Responsive User Interface

---

## Admin Features

- Admin Login
- Create Events
- Edit Event Details
- Cancel Events
- Bulk Upload Seats
- Configure Seat Pricing
- Block Individual Seats
- Unblock Seats
- Force Booking Refunds
- Dashboard Analytics
  - Total Revenue
  - Seat Occupancy
  - Active Seat Holds

---

# Tech Stack

## Frontend

- React 19
- Vite
- React Router v7
- Axios

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

## Authentication

- JSON Web Tokens (JWT)

## State Management

- React Context API
  - AuthContext
  - WalletContext

## Styling

- Plain CSS
- Custom Glassmorphism UI
- Responsive Design

---

# Key Features

## Automatic Token Refresh

A centralized Axios instance automatically refreshes expired access tokens.

Features include:

- Automatic access token refresh
- Request queuing during refresh
- Retry failed requests
- Redirect to login only if refresh fails

Implementation:

```
src/api/index.js
```

---

## Guest Seat Reservation

Users can reserve seats before logging in.

The reservation information is stored in **sessionStorage**.

After successful authentication, the application automatically transfers the reserved seats to the user's account without requiring the user to repeat the booking process.

---

## Live Seat Availability

The seat map automatically refreshes every **4 seconds**.

This enables users to view seat availability updates without manually refreshing the page.

The implementation uses polling instead of WebSockets, providing near real-time updates while keeping deployment simple.

---

## Booking Progress Indicator

During booking, users see progress updates instead of a generic loading spinner.

Example workflow:

- Checking Seats
- Creating Hold
- Preparing Checkout

This provides a better user experience, particularly when the backend is starting from an idle state.

---

## Concurrency-Safe Booking

The backend uses MongoDB transactions to ensure:

- No duplicate seat bookings
- No duplicate wallet deductions
- Consistent booking data during simultaneous requests

---

# Project Setup

## Clone the Repository

```bash
git clone <repository-url>
```

---

## Navigate to the Project

```bash
cd ticket-booking-frontend
```

---

## Install Dependencies

```bash
npm install
```

> **Note**
>
> Running the backend locally requires **MongoDB Replica Set** configuration because the backend relies on multi-document transactions.

---

# Build

Create a production build:

```bash
npm run build
```

Run the linter:

```bash
npm run lint
```

---

# Assumptions

The following implementation decisions were made during development:

- Seat availability is updated every 4 seconds using polling instead of WebSockets.
- Wallet top-up is simulated and does not integrate with an external payment gateway.
- Administrators use a dedicated login page (`/admin/login`).
- Self-service administrator registration is not supported.
- Backend concurrency is handled using MongoDB transactions.

---

# Backend

The backend is responsible for:

- User Authentication
- Event Management
- Seat Management
- Booking Management
- Wallet Management
- Transaction History
- Booking Validation
- Concurrency Control
- Administrative Operations

Backend Technologies:

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication


---

# Design Highlights

- Modern Glassmorphism User Interface
- Responsive Layout
- Guest Booking Support
- Automatic JWT Token Refresh
- Wallet-based Checkout
- Live Seat Availability
- Transaction-safe Booking System
- Admin Dashboard
- React Context API State Management
- RESTful API Architecture
- Clean Component-Based Structure

---



# Future Improvements

- Real-time seat updates using WebSockets
- Online payment gateway integration
- Email notifications
- QR Code ticket generation
- Event search and filtering
- Seat category filters
- Multi-language support
- Dark and Light themes
- Push notifications

---

