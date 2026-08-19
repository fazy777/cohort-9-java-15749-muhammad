# Contact Management System - Frontend Client

A responsive, glassmorphic Single Page Application (SPA) built with React 19 and Vite for the Contact Management System.

---

## 🚀 Overview

The Contact Management System frontend provides an intuitive, high-performance interface for managing user accounts, authentication, and contacts.

### Key Capabilities
* **Authentication**: Self-registration with email or phone, secure login, in-memory/session-managed token persistence, and profile password updates.
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
2. **Session Storage**: JWT tokens are maintained in session state with guarded access utilities (`safeStorage`), avoiding unsafe `localStorage` exposure.
3. **Automatic Revalidation**: Upon initial load, the user session is verified and fresh profile data is retrieved from `/api/auth/profile`.
4. **Token Invalidation**: Changing passwords immediately invalidates existing tokens across devices via backend token versioning.
