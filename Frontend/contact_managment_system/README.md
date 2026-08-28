# Contact Management System - Frontend Client

A responsive, glassmorphic Single Page Application (SPA) built with React 19 and Vite for the Contact Management System.

---

## 🚀 Overview

The Contact Management System frontend provides an intuitive, high-performance interface for managing user accounts, authentication, and contacts.

### Key Capabilities
* **Authentication**: Self-registration with email or phone, secure login, HttpOnly/Secure cookie session management, CSRF protection, and profile password updates.
* **Contact Directory**: Real-time search, server-side pagination, sorting, and full CRUD operations.
* **Multi-Attribute Contacts**: Support for multiple email addresses and phone numbers with custom labels (*Work, Personal, Mobile, Home*).
* **Import & Export**: RFC 4180-compliant CSV and JSON export and bulk import with spreadsheet formula injection protection.
* **Glassmorphic UI**: Accessible modal workflows, responsive data tables, and animated toast feedback.

---

## 🛠️ Tech Stack

* **Framework**: React 19 + Vite 8
* **Icons**: Lucide React
* **State Management**: React Context API (`AuthContext`)
* **Styling**: Modern CSS variables, glassmorphism design system

---

## ⚙️ Environment Variables

Create a `.env` file in this directory based on `.env.example`:

```env
# Backend API Base URL
VITE_API_URL=http://localhost:8080/api
```

---

## 📦 Installation & Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

3. **Build for Production**:
   ```bash
   npm run build
   ```
   The compiled static assets will be in the `dist/` directory.

4. **Lint Code**:
   ```bash
   npm run lint
   ```

---

## 🔐 Authentication & Session Flow

1. **Login & Registration**: Submits user credentials to the Spring Boot backend API.
2. **HttpOnly Cookie Token Storage**: Authentication JWT tokens are issued and managed as `HttpOnly`, `Secure`, and `SameSite=Lax` cookies directly by the backend server. Tokens are never exposed in JSON response bodies or stored in `localStorage`/`sessionStorage`, eliminating XSS-based token exfiltration risks.
3. **CSRF Protection**: All mutating HTTP requests (`POST`, `PUT`, `DELETE`, `PATCH`) are guarded by Spring Security's Double Submit Cookie CSRF defense (`XSRF-TOKEN` cookie validated against the `X-XSRF-TOKEN` request header).
4. **Automatic Revalidation**: Upon initial load and page refresh, the user session is verified and fresh profile data is retrieved from `/api/auth/profile` with `credentials: 'include'`.
5. **Token Invalidation & Logout**: Changing passwords immediately increments backend token versioning, revoking sessions across devices. The `/api/auth/logout` endpoint clears the HttpOnly authentication cookie and invalidates the session.
