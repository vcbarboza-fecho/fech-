import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://ivzhyvdreiugtsxxgajq.supabase.co ',
  'sb_publishable_8oLvTxusIUQv13EdVvu6Qw_ZMZxhP6_Y'
)
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

db.pragma('foreign_keys = ON');
const JWT_SECRET = process.env.JWT_SECRET || "fecho-secret-key-123";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    is_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    categoryId TEXT,
    FOREIGN KEY(categoryId) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS tabs (
    id TEXT PRIMARY KEY,
    customerName TEXT NOT NULL,
    groupTime TEXT NOT NULL,
    service TEXT,
    isAvulso INTEGER DEFAULT 0,
    openedAt INTEGER NOT NULL,
    closedAt INTEGER,
    status TEXT NOT NULL,
    paymentMethod TEXT,
    finalPayerName TEXT,
    discountPercentage REAL DEFAULT 0,
    deletionReason TEXT,
    deletedAt INTEGER
  );

  CREATE TABLE IF NOT EXISTS tab_items (
    id TEXT PRIMARY KEY,
    tabId TEXT NOT NULL,
    productId TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    paid_quantity INTEGER DEFAULT 0,
    price REAL,
    timestamp INTEGER NOT NULL,
    payerName TEXT,
    payerDetails TEXT,
    FOREIGN KEY(tabId) REFERENCES tabs(id),
    FOREIGN KEY(productId) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS password_resets (
    email TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    expires INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS company_info (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    cnpj TEXT NOT NULL,
    cep TEXT,
    street TEXT,
    number TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT
  );
`);

// Migration: Add new columns to company_info if missing
try {
  db.exec("ALTER TABLE company_info ADD COLUMN cep TEXT");
  db.exec("ALTER TABLE company_info ADD COLUMN street TEXT");
  db.exec("ALTER TABLE company_info ADD COLUMN neighborhood TEXT");
  db.exec("ALTER TABLE company_info ADD COLUMN city TEXT");
  db.exec("ALTER TABLE company_info ADD COLUMN state TEXT");
  db.exec("ALTER TABLE company_info ADD COLUMN number TEXT");
  console.log("[DB] Added new address columns to company_info");
} catch (e) {
  // Columns probably already exist
}

// Migration: Add payerDetails column to tab_items if missing
try {
  db.exec("ALTER TABLE tab_items ADD COLUMN payerDetails TEXT");
  console.log("[DB] Added payerDetails column to tab_items");
} catch (e) {
  // Column probably already exists
}

// Migration: Add price column to tab_items if missing
try {
  db.exec("ALTER TABLE tab_items ADD COLUMN price REAL");
  console.log("[DB] Added price column to tab_items");
} catch (e) {
  // Column probably already exists
}

try {
  db.exec("ALTER TABLE tabs ADD COLUMN service TEXT");
  db.exec("ALTER TABLE tabs ADD COLUMN isAvulso INTEGER DEFAULT 0");
  console.log("[DB] Added service and isAvulso columns to tabs");
} catch (e) {}

// Migration: Add paid_quantity column to tab_items if missing
try {
  db.exec("ALTER TABLE tab_items ADD COLUMN paid_quantity INTEGER DEFAULT 0");
  console.log("[DB] Added paid_quantity column to tab_items");
} catch (e) {
  // Column probably already exists
}

// Migration: Add status column to tabs if missing
try {
  db.exec("ALTER TABLE tabs ADD COLUMN status TEXT NOT NULL DEFAULT 'open'");
  console.log("[DB] Added status column to tabs");
} catch (e) {
  // Column probably already exists
}

// Migration: Add deletionReason and deletedAt columns to tabs if missing
try {
  db.exec("ALTER TABLE tabs ADD COLUMN deletionReason TEXT");
  db.exec("ALTER TABLE tabs ADD COLUMN deletedAt INTEGER");
  console.log("[DB] Added deletion columns to tabs");
} catch (e) {
  // Columns probably already exist
}

// Migration: Add finalPayerName column to tabs if missing
try {
  db.exec("ALTER TABLE tabs ADD COLUMN finalPayerName TEXT");
  console.log("[DB] Added finalPayerName column to tabs");
} catch (e) {
  // Column probably already exists
}

// Migration: Add payerName column to tab_payments if missing
try {
  db.exec("ALTER TABLE tab_payments ADD COLUMN payerName TEXT");
  console.log("[DB] Added payerName column to tab_payments");
} catch (e) {
  // Column probably already exists
}

// Migration: Create tab_payments table
db.exec(`
  CREATE TABLE IF NOT EXISTS tab_payments (
    id TEXT PRIMARY KEY,
    tabId TEXT NOT NULL,
    amount REAL NOT NULL,
    method TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    payerName TEXT,
    FOREIGN KEY(tabId) REFERENCES tabs(id)
  );
`);

// Initialize Default Categories and Products
const initializeDefaults = () => {
  const categories = [
    { id: 'cat_food', name: 'Comida', icon: 'Utensils' },
    { id: 'cat_drinks', name: 'Bebida', icon: 'Beer' },
    { id: 'cat_snacks', name: 'Petisco', icon: 'Coffee' },
    { id: 'cat_cocktails', name: 'Drink', icon: 'GlassWater' },
    { id: 'cat_sweets', name: 'Doce', icon: 'Cookie' },
    { id: 'cat_game', name: 'Jogo', icon: 'Ticket' },
    { id: 'cat_other', name: 'Outros', icon: 'Package' },
  ];

  const insertCat = db.prepare("INSERT OR IGNORE INTO categories (id, name, icon) VALUES (?, ?, ?)");
  categories.forEach(cat => insertCat.run(cat.id, cat.name, cat.icon));

  const hasGameFee = db.prepare("SELECT id FROM products WHERE id = 'prod_game_fee'").get();
  if (!hasGameFee) {
    db.prepare("INSERT INTO products (id, name, price, categoryId) VALUES (?, ?, ?, ?)").run('prod_game_fee', 'Taxa de Jogo', 0, 'cat_game');
    console.log("[DB] Created 'Taxa de Jogo' product");
  }
};

initializeDefaults();

const app = express();
app.use(express.json());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  console.log(`[ADMIN CHECK] User: ${req.user?.email}, Role: ${req.user?.role}`);
  if (!req.user || req.user.role !== 'admin') {
    console.log(`[ADMIN CHECK] Access denied for ${req.user?.email}`);
    return res.status(403).json({ error: "Acesso negado. Apenas administradores podem realizar esta ação." });
  }
  next();
};

// --- Auth Routes ---

app.get("/api/auth/status", (req, res) => {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  res.json({ initialized: userCount.count > 0 });
});

app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  console.log(`[AUTH] Signup attempt for ${email}`);
  
  // Check if it's the first user
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  const isFirstUser = userCount.count === 0;
  console.log(`[AUTH] User count: ${userCount.count}, Is first user: ${isFirstUser}`);
    const role = isFirstUser ? 'admin' : 'user';
    const isVerified = isFirstUser ? 1 : 0;

    // If not first user, only admin can create (but user said "create on first access")
    if (userCount.count > 0) {
      console.log(`[AUTH] Signup blocked: initial user already exists`);
      return res.status(403).json({ error: "O cadastro inicial já foi realizado. Peça ao administrador para adicionar seu e-mail." });
    }

    try {
      // Check if email already exists
      const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
      if (existingUser) {
        console.log(`[AUTH] Signup blocked: email ${email} already exists`);
        return res.status(400).json({ error: "Este e-mail já está cadastrado no sistema." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const id = crypto.randomUUID();
      const verificationToken = isFirstUser ? null : Math.random().toString(36).substring(2, 15);
      
      db.prepare("INSERT INTO users (id, email, password, role, is_verified, verification_token, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        id, email, hashedPassword, role, isVerified, verificationToken, Date.now()
      );
      
      console.log(`[AUTH] User ${email} created as ${role}, verified: ${isVerified}`);
      
      if (isFirstUser) {
        res.json({ 
          message: "Administrador criado com sucesso! Você já pode entrar.",
          autoLogin: true
        });
      } else {
        console.log(`[VERIFICATION SIMULATION] To: ${email} | Token: ${verificationToken}`);
        res.json({ 
          message: "Cadastro realizado! Verifique seu e-mail para validar sua conta.",
          debugToken: process.env.NODE_ENV !== 'production' ? verificationToken : undefined 
        });
      }
  } catch (e) {
    console.error("[AUTH] Error in signup:", e);
    res.status(500).json({ error: "Erro interno ao realizar cadastro." });
  }
});

app.post("/api/auth/verify-email", async (req, res) => {
  const { email, token } = req.body;
  console.log(`[AUTH] Verification attempt for ${email} with token ${token}`);
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND verification_token = ?").get(email, token) as any;

  if (!user) {
    console.log(`[AUTH] Verification failed for ${email}`);
    return res.status(400).json({ error: "Token de verificação inválido ou e-mail incorreto." });
  }

  db.prepare("UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?").run(user.id);
  console.log(`[AUTH] User ${email} verified`);
  res.json({ message: "E-mail validado com sucesso! Agora você pode fazer login." });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(`[AUTH] Login attempt for ${email}`);
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

  if (!user) {
    console.log(`[AUTH] Login failed: user ${email} not found`);
    return res.status(401).json({ error: "E-mail ou senha inválidos." });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    console.log(`[AUTH] Login failed: incorrect password for ${email}`);
    return res.status(401).json({ error: "E-mail ou senha inválidos." });
  }

  if (!user.is_verified) {
    console.log(`[AUTH] Login failed: user ${email} not verified`);
    return res.status(403).json({ 
      error: "Sua conta ainda não foi validada por e-mail.",
      unverified: true 
    });
  }

  console.log(`[AUTH] User ${email} logged in successfully as ${user.role}`);
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.post("/api/auth/reset-password-request", async (req, res) => {
  const { email } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  
  if (!user) return res.json({ message: "Se o e-mail existir, um link de recuperação será enviado." });

  const token = Math.random().toString(36).substring(2, 15);
  const expires = Date.now() + 3600000; // 1 hour

  db.prepare("INSERT OR REPLACE INTO password_resets (email, token, expires) VALUES (?, ?, ?)").run(email, token, expires);

  // REAL INTEGRATION: In a real app, you'd use SendGrid/Nodemailer here.
  console.log(`[EMAIL SIMULATION] To: ${email} | Reset Token: ${token}`);
  
  res.json({ 
    message: "Link de recuperação enviado para o e-mail.",
    debugToken: process.env.NODE_ENV !== 'production' ? token : undefined 
  });
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { email, token, newPassword } = req.body;
  const reset = db.prepare("SELECT * FROM password_resets WHERE email = ? AND token = ?").get(email, token) as any;

  if (!reset || reset.expires < Date.now()) {
    return res.status(400).json({ error: "Token inválido ou expirado." });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  db.prepare("UPDATE users SET password = ? WHERE email = ?").run(hashedPassword, email);
  db.prepare("DELETE FROM password_resets WHERE email = ?").run(email);

  res.json({ message: "Senha alterada com sucesso." });
});

app.post("/api/auth/change-password", authenticateToken, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body;
  console.log(`[AUTH] Change password request for user ID: ${req.user.id}`);
  
  try {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id) as any;

    if (!user) {
      console.log(`[AUTH] User not found for ID: ${req.user.id}`);
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      console.log(`[AUTH] Current password mismatch for user: ${user.email}`);
      return res.status(401).json({ error: "Senha atual incorreta." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, req.user.id);
    console.log(`[AUTH] Password updated successfully for user: ${user.email}`);
    res.json({ message: "Senha alterada com sucesso." });
  } catch (error) {
    console.error("[AUTH] Error in change-password:", error);
    res.status(500).json({ error: "Erro interno ao alterar senha." });
  }
});

// --- User Management (Admin Only) ---

app.post("/api/admin/reset-db", authenticateToken, isAdmin, (req: any, res) => {
  console.log(`[ADMIN] Resetting database requested by: ${req.user.email}`);
  try {
    db.prepare("DELETE FROM tab_items").run();
    db.prepare("DELETE FROM tab_payments").run();
    db.prepare("DELETE FROM tabs").run();
    db.prepare("DELETE FROM categories").run();
    db.prepare("DELETE FROM products").run();
    
    // Re-insert default categories and products
    const defaultCategories = [
      { id: 'cat_bebidas', name: 'Bebidas', icon: 'CupSoda' },
      { id: 'cat_comida', name: 'Comida', icon: 'Utensils' },
      { id: 'cat_taxas', name: 'Taxas', icon: 'Receipt' }
    ];
    
    const insertCategory = db.prepare("INSERT INTO categories (id, name, icon) VALUES (?, ?, ?)");
    defaultCategories.forEach(cat => insertCategory.run(cat.id, cat.name, cat.icon));
    
    const defaultProducts = [
      { id: 'prod_game_fee', name: 'Taxa de Jogo', price: 25.00, categoryId: 'cat_taxas' }
    ];
    
    const insertProduct = db.prepare("INSERT INTO products (id, name, price, categoryId) VALUES (?, ?, ?, ?)");
    defaultProducts.forEach(prod => insertProduct.run(prod.id, prod.name, prod.price, prod.categoryId));

    console.log("[ADMIN] Database reset successfully.");
    res.json({ message: "Banco de dados reiniciado com sucesso." });
  } catch (e) {
    console.error("[ADMIN] Error resetting database:", e);
    res.status(500).json({ error: "Erro interno ao reiniciar banco de dados." });
  }
});

app.get("/api/users", authenticateToken, isAdmin, (req, res) => {
  const users = db.prepare("SELECT id, email, role, created_at FROM users").all();
  res.json(users);
});

app.post("/api/users", authenticateToken, isAdmin, async (req: any, res) => {
  const { email, password, role } = req.body;
  console.log(`[ADMIN] Adding new user: ${email} with role: ${role}`);
  
  try {
    // Check if email already exists
    const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existingUser) {
      return res.status(400).json({ error: "Este e-mail já está cadastrado no sistema." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();
    
    const result = db.prepare("INSERT INTO users (id, email, password, role, is_verified, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
      id, email, hashedPassword, role || 'user', 1, Date.now()
    );
    
    console.log(`[ADMIN] User added successfully. ID: ${id}, Rows: ${result.changes}`);
    res.json({ id, email, role: role || 'user' });
  } catch (e) {
    console.error("[ADMIN] Error adding user:", e);
    res.status(500).json({ error: "Erro interno ao adicionar usuário." });
  }
});

app.delete("/api/users/:id", authenticateToken, isAdmin, (req: any, res) => {
  const { id } = req.params;
  console.log(`[ADMIN DELETE] Request to delete user ID: ${id} by admin: ${req.user.email}`);
  
  if (id === req.user.id) {
    console.log(`[ADMIN DELETE] Self-deletion blocked for admin: ${req.user.email}`);
    return res.status(400).json({ error: "Você não pode excluir a si mesmo." });
  }
  
  try {
    const userToDelete = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
    if (!userToDelete) {
      console.log(`[ADMIN] User to delete not found. ID: ${id}`);
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    console.log(`[ADMIN] Found user to delete: ${userToDelete.email}. Proceeding...`);
    const result = db.prepare("DELETE FROM users WHERE id = ?").run(id);
    
    if (result.changes > 0) {
      console.log(`[ADMIN] User ${userToDelete.email} deleted successfully.`);
      res.json({ success: true });
    } else {
      console.log(`[ADMIN] Delete operation completed but no rows were changed for ID: ${id}`);
      res.status(500).json({ error: "O usuário não pôde ser excluído do banco de dados." });
    }
  } catch (error) {
    console.error("[ADMIN] Database error during user deletion:", error);
    res.status(500).json({ error: "Erro interno ao excluir usuário no banco de dados." });
  }
});

// --- Company Info ---

app.get("/api/public/company", (req, res) => {
  const info = db.prepare("SELECT name, street, number, city, state FROM company_info WHERE id = 1").get() as any;
  res.json(info || null);
});

app.get("/api/company", authenticateToken, (req, res) => {
  const info = db.prepare("SELECT * FROM company_info WHERE id = 1").get();
  res.json(info || null);
});

app.post("/api/company", authenticateToken, isAdmin, (req, res) => {
  const { name, cnpj, cep, street, number, neighborhood, city, state } = req.body;
  db.prepare("INSERT OR REPLACE INTO company_info (id, name, cnpj, cep, street, number, neighborhood, city, state) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    name, cnpj, cep, street, number, neighborhood, city, state
  );
  res.json({ success: true });
});

// --- Data Routes (Categories, Products, Tabs) ---

app.get("/api/categories", authenticateToken, (req, res) => {
  res.json(db.prepare("SELECT * FROM categories").all());
});

app.post("/api/categories", authenticateToken, isAdmin, (req, res) => {
  const { id, name, icon } = req.body;
  db.prepare("INSERT OR REPLACE INTO categories (id, name, icon) VALUES (?, ?, ?)").run(id, name, icon);
  res.json({ success: true });
});

app.delete("/api/categories/:id", authenticateToken, isAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ error: "Não é possível excluir esta categoria pois ela contém produtos vinculados." });
    } else {
      res.status(500).json({ error: "Erro ao excluir categoria." });
    }
  }
});

app.get("/api/products", authenticateToken, (req, res) => {
  res.json(db.prepare("SELECT * FROM products").all());
});

app.post("/api/products", authenticateToken, isAdmin, (req, res) => {
  const { id, name, price, categoryId } = req.body;
  db.prepare("INSERT OR REPLACE INTO products (id, name, price, categoryId) VALUES (?, ?, ?, ?)").run(id, name, price, categoryId);
  res.json({ success: true });
});

app.delete("/api/products/:id", authenticateToken, isAdmin, (req, res) => {
  try {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ error: "Não é possível excluir este produto pois ele já foi utilizado em comandas. Tente renomeá-lo ou desativá-lo." });
    } else {
      res.status(500).json({ error: "Erro ao excluir produto." });
    }
  }
});

app.get("/api/tabs", authenticateToken, (req, res) => {
  const tabs = db.prepare("SELECT * FROM tabs").all() as any[];
  const tabsWithData = tabs.map(tab => {
    const items = db.prepare("SELECT productId, quantity, paid_quantity as paidQuantity, price, timestamp, payerName, payerDetails FROM tab_items WHERE tabId = ?").all(tab.id) as any[];
    const itemsWithParsedDetails = items.map(item => ({
      ...item,
      payerDetails: item.payerDetails ? JSON.parse(item.payerDetails) : undefined
    }));
    const payments = db.prepare("SELECT id, amount, method, timestamp, payerName FROM tab_payments WHERE tabId = ?").all(tab.id);
    return { ...tab, isAvulso: !!tab.isAvulso, items: itemsWithParsedDetails, payments };
  });
  res.json(tabsWithData);
});

app.post("/api/tabs", authenticateToken, (req, res) => {
  const { id, customerName, groupTime, service, isAvulso, openedAt, closedAt, status, paymentMethod, finalPayerName, discountPercentage, deletionReason, deletedAt, items = [] } = req.body;
  console.log(`[TABS] Request to save tab: ${customerName} (ID: ${id}) with ${items.length} items. Status: ${status}`);
  
  try {
    const insertTab = db.prepare("INSERT OR REPLACE INTO tabs (id, customerName, groupTime, service, isAvulso, openedAt, closedAt, status, paymentMethod, finalPayerName, discountPercentage, deletionReason, deletedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const deleteItems = db.prepare("DELETE FROM tab_items WHERE tabId = ?");
    const insertItem = db.prepare("INSERT INTO tab_items (id, tabId, productId, quantity, paid_quantity, price, timestamp, payerName, payerDetails) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

    const transaction = db.transaction((tabData: any) => {
      insertTab.run(
        tabData.id, 
        tabData.customerName, 
        tabData.groupTime, 
        tabData.service || null,
        tabData.isAvulso ? 1 : 0,
        tabData.openedAt, 
        tabData.closedAt, 
        tabData.status, 
        tabData.paymentMethod, 
        tabData.finalPayerName || null,
        tabData.discountPercentage || 0,
        tabData.deletionReason || null,
        tabData.deletedAt || null
      );
      deleteItems.run(tabData.id);
      if (tabData.items && Array.isArray(tabData.items)) {
        for (const item of tabData.items) {
          // Ensure price is handled correctly (null if undefined or null)
          const price = (item.price === undefined || item.price === null) ? null : item.price;
          const paidQuantity = item.paidQuantity || 0;
          const payerDetails = item.payerDetails ? JSON.stringify(item.payerDetails) : null;
          insertItem.run(crypto.randomUUID(), tabData.id, item.productId, item.quantity, paidQuantity, price, item.timestamp, item.payerName || null, payerDetails);
        }
      }
    });

    transaction({ id, customerName, groupTime, openedAt, closedAt, status, paymentMethod, finalPayerName, discountPercentage, deletionReason, deletedAt, items });
    console.log(`[TABS] Tab ${customerName} saved successfully`);
    res.json({ success: true });
  } catch (error) {
    console.error("[TABS] Error saving tab:", error);
    res.status(500).json({ error: "Erro interno ao salvar comanda no banco de dados." });
  }
});

app.delete("/api/tabs/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { reason } = req.body; // Expecting reason in body for soft delete
  
  if (reason) {
    // Soft delete
    db.prepare("UPDATE tabs SET status = 'deleted', deletionReason = ?, deletedAt = ? WHERE id = ?").run(reason, Date.now(), id);
    console.log(`[TABS] Tab ${id} soft deleted with reason: ${reason}`);
    res.json({ success: true });
  } else {
    // Hard delete (legacy or if specifically requested without reason)
    db.prepare("DELETE FROM tab_items WHERE tabId = ?").run(id);
    db.prepare("DELETE FROM tab_payments WHERE tabId = ?").run(id);
    db.prepare("DELETE FROM tabs WHERE id = ?").run(id);
    console.log(`[TABS] Tab ${id} hard deleted`);
    res.json({ success: true });
  }
});

app.post("/api/tabs/:id/payments", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { amount, method, timestamp, payerName } = req.body;
  
  try {
    db.prepare("INSERT INTO tab_payments (id, tabId, amount, method, timestamp, payerName) VALUES (?, ?, ?, ?, ?, ?)").run(
      crypto.randomUUID(), id, amount, method, timestamp, payerName || null
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao registrar pagamento." });
  }
});

// --- Vite Middleware ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
