const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt'); 
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'debtproof_db'
});
app.post('/api/auth', async (req, res) => {
    const { id, password, role, isRegister } = req.body;

    try {
        if (isRegister) {
            // 1. Check if the user exists in the database
            const [users] = await db.query("SELECT * FROM users WHERE username = ?", [id]);
            
            // LOGIC: If user doesn't exist at all, they weren't added by a shopkeeper
            if (users.length === 0) {
                return res.status(403).json({ 
                    message: "Access Denied. You must be added by a shopkeeper before registering." 
                });
            }

            const user = users[0];

            // LOGIC: If user exists but already has a password, they are already registered
            if (user.password !== null && user.password !== "") {
                return res.status(400).json({ message: "This phone number is already registered." });
            }

            // 2. Everything looks good. Hash the new password.
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // 3. UPDATE the existing placeholder user with the new password
            await db.query("UPDATE users SET password = ?, role = ? WHERE username = ?", [hashedPassword, role, id]);
            
            return res.json({ success: true, message: "Account activated successfully!", role });
            
        } else {
            // LOGIN LOGIC
            // 1. Fetch user by username and role
            const [users] = await db.query("SELECT * FROM users WHERE username = ? AND role = ?", [id, role]);
            
            // Check if user exists AND has a password (not a placeholder)
            if (users.length === 0 || users[0].password === null) {
                return res.status(401).json({ message: "Account not found.you have used a wrong number,please try another number" });
            }

            const user = users[0];

            // 2. Compare passwords
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            return res.json({ 
                success: true, 
                token: "secure-token-" + Date.now(), 
                role: user.role 
            });
        }
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});
// Dashboard Statistics API
app.get('/api/dashboard-stats', async (req, res) => {
    try {
        const [total] = await db.query("SELECT SUM(amount) as totalSum FROM debts WHERE status = 'pending'");
        const [custCount] = await db.query("SELECT COUNT(DISTINCT customer_id) as count FROM debts WHERE status = 'pending'");
        const [recent] = await db.query(`
            SELECT d.customer_name, d.amount, d.created_at 
            FROM debts d 
            ORDER BY d.created_at DESC LIMIT 5
        `);

        res.json({
            totalSum: total[0].totalSum || 0,
            customerCount: custCount[0].count || 0,
            recent: recent
        });
    } catch (err) { 
        res.status(500).json({ error: err.message }); 
    }
});
// GET all shops
app.get('/api/shops', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM shops ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST a new shop
app.post('/api/shops', async (req, res) => {
    const { name, location, category } = req.body;
    try {
        await db.query("INSERT INTO shops (name, location, category) VALUES (?, ?, ?)", [name, location, category]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT (Update) a shop
app.put('/api/shops/:id', async (req, res) => {
    const { name, location, category } = req.body;
    try {
        await db.query("UPDATE shops SET name = ?, location = ?, category = ? WHERE id = ?", [name, location, category, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE a shop
app.delete('/api/shops/:id', async (req, res) => {
    try {
        await db.query("DELETE FROM shops WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
// 1. GET all debts with Shop and User details
app.get('/api/all-debts', async (req, res) => {
    const search = req.query.search || '';
    try {
        const [rows] = await db.query(`
            SELECT d.*, s.name as shop_name, u.username as customer_name 
            FROM debts d
            LEFT JOIN shops s ON d.shop_id = s.id
            LEFT JOIN users u ON d.customer_id = u.id
            WHERE u.username LIKE ? OR d.description LIKE ?
            ORDER BY d.created_at DESC
        `, [`%${search}%`, `%${search}%`]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/debts', async (req, res) => {
    const { shop_id, customer_phone, customer_name, description, amount } = req.body;
    try {
        // 1. Check if user exists (by phone/username)
        let [users] = await db.query("SELECT id FROM users WHERE username = ?", [customer_phone]);
        let customer_id;

        if (users.length === 0) {
            // 2. Create a "Placeholder" user if they don't exist
            // We save the phone as username and leave the password NULL for now
            const [result] = await db.query(
                "INSERT INTO users (username, password, role) VALUES (?, NULL, 'customer')", 
                [customer_phone]
            );
            customer_id = result.insertId;
        } else {
            customer_id = users[0].id;
        }

        // 3. Insert the debt
        await db.query(
            "INSERT INTO debts (shop_id, customer_id, customer_name, description, amount, status) VALUES (?, ?, ?, ?, ?, 'pending')",
            [shop_id, customer_id, description, amount]
        );
        res.json({ success: true, message: "Debt recorded and customer invited!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. PUT (Update) Mark debt as Paid or deduct amount
app.put('/api/debts/:id/pay', async (req, res) => {
    const { amount } = req.body; // Amount being paid now
    const debtId = req.params.id;
    try {
        // Fetch current debt
        const [debt] = await db.query("SELECT amount FROM debts WHERE id = ?", [debtId]);
        if (debt.length === 0) return res.status(404).json({ message: "Debt not found" });

        const newAmount = debt[0].amount - amount;

        if (newAmount <= 0) {
            // Debt fully cleared
            await db.query("UPDATE debts SET amount = 0, status = 'paid' WHERE id = ?", [debtId]);
        } else {
            // Partial payment
            await db.query("UPDATE debts SET amount = ? WHERE id = ?", [newAmount, debtId]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. DELETE a debt record
app.delete('/api/debts/:id', async (req, res) => {
    try {
        await db.query("DELETE FROM debts WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/profile/update', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query("UPDATE users SET password = ? WHERE username = ?", [hashedPassword, username]);
        res.json({ success: true, message: "Password updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/api/customer/debts', async (req, res) => {
    const phone = req.query.phone;
    try {
        const [rows] = await db.query(`
            SELECT d.*, s.name as shop_name 
            FROM debts d
            JOIN shops s ON d.shop_id = s.id
            JOIN users u ON d.customer_id = u.id
            WHERE u.username = ?
            ORDER BY d.created_at DESC
        `, [phone]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'sw.js'));
});
// This tells Express that 'public' is the root for all your HTML/CSS/JS
app.use(express.static(path.join(__dirname, 'public')));
app.listen(5000, () => console.log('Secure Server running on port 5000'));