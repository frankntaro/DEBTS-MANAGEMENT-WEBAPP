# Debt Management Web App

A simple web application that allows shopkeepers to manage customer debts, invite customers to register, and track payments. The backend is built with Node.js, Express, and MySQL, while the frontend consists of static HTML/JS pages served from the `public` directory.

## 🚀 Features

- User registration/login with role-based access (shopkeeper or customer)
- CRUD operations for shops
- Record and manage debts per customer
- Dashboard statistics for shopkeepers
- Customer interface to view and pay their debts
- Service worker and manifest for progressive web app support

## 🛠️ Technologies

- Node.js & Express
- MySQL (via `mysql2` package)
- `bcrypt` for password hashing
- `cors` for cross-origin requests
- Plain HTML/CSS/JavaScript in `public` folder

## 📁 Project Structure

```
├── db.js              # MySQL connection pool
├── index.js           # Main Express server
├── manifest.json      # PWA manifest
├── package.json       # Node dependencies
├── public/            # Frontend files
│   ├── assets/js/     # Frontend JS logic
│   ├── components/    # HTML fragments (e.g., sidebar)
│   ├── *.html         # Static pages (dashboard, debts, etc.)
└── sw.js              # Service worker script
```

## ⚙️ Setup & Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url> debt-management-webapp
   cd debt-management-webapp
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure MySQL**
   - Create a database named `debtproof_db`.
   - Run your schema/SQL setup to create tables `users`, `shops`, `debts`, etc. (see `db.js` for connection details). Example structure:
     ```sql
     CREATE TABLE users (
       id INT AUTO_INCREMENT PRIMARY KEY,
       username VARCHAR(255) UNIQUE,
       password VARCHAR(255) DEFAULT NULL,
       role ENUM('shopkeeper','customer')
     );

     CREATE TABLE shops (
       id INT AUTO_INCREMENT PRIMARY KEY,
       name VARCHAR(255),
       location VARCHAR(255),
       category VARCHAR(100),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );

     CREATE TABLE debts (
       id INT AUTO_INCREMENT PRIMARY KEY,
       shop_id INT,
       customer_id INT,
       customer_name VARCHAR(255),
       description TEXT,
       amount DECIMAL(10,2),
       status ENUM('pending','paid') DEFAULT 'pending',
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (shop_id) REFERENCES shops(id),
       FOREIGN KEY (customer_id) REFERENCES users(id)
     );
     ```
4. **Start the server**
   ```bash
   node index.js
   ```
5. **Access the application**
   - Open `http://localhost:5000` in a browser.
   - Use the frontend pages for shopkeeper/customer operations.

## 🧩 API Endpoints

### Authentication
- `POST /api/auth` – register or login.
  - Payload: `{ id, password, role, isRegister }`

### Shops
- `GET /api/shops` – list all shops.
- `POST /api/shops` – add a shop (name, location, category).
- `PUT /api/shops/:id` – update shop info.
- `DELETE /api/shops/:id` – remove a shop.

### Debts
- `GET /api/all-debts` – retrieve all debts (searchable).
- `POST /api/debts` – record a new debt; creates placeholder customer if needed.
- `PUT /api/debts/:id/pay` – mark a debt as paid or deduct amount.
- `DELETE /api/debts/:id` – delete a debt record.
- `GET /api/customer/debts?phone=<phone>` – fetch debts for a customer.

### Dashboard
- `GET /api/dashboard-stats` – shopkeeper statistics (total pending, customer count, recent debts).

### Profile
- `PUT /api/profile/update` – update customer/shopkeeper password.

## 🧠 Frontend

The `public` folder contains HTML pages and JavaScript that call the above endpoints. Key pages include:
- `index.html` – login/registration
- `dashboard.html` – shopkeeper dashboard
- `debts.html` – manage debts
- `shops.html` – manage shops
- `profile.html` – update password
- `customer-dashboard.html` – customer view of debts

## 💡 Tips

- Shopkeepers should first add customers via debts or registration.
- Customers receive an invited registration link via the app when a debt is recorded.

## 🎯 Contribution

Feel free to fork, improve the UX, add unit tests, or convert to a full SPA.

---
