import express from "express";
import { storage } from "./storage";
import {
  insertOrderSchema, insertCustomerSchema, insertProductSchema,
  insertInventorySchema, insertRouteSchema, insertOrderItemSchema,
  insertRouteSessionSchema, insertDailyReportSchema
} from "@shared/schema";

const router = express.Router();

// ------------------------------
// AUTH ROUTES
// ------------------------------
router.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("BODY", req.body);
    
    const userlog = await storage.getUserByUsername(username);
    console.log("USER FROM DB", userlog);
    console.log("PASSWORD COMPARISON", userlog?.password === password);

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session = req.session || {};
    req.session.userId = user.id;

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/api/auth/logout", async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid"); // si usas cookies
      res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    res.status(500).json({ error: "Logout error" });
  }
});

router.get("/api/auth/me", async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: "Failed to get user info" });
  }
});

// ------------------------------
// ORDERS
// ------------------------------
router.get("/api/orders", async (req, res) => {
  try {
    const driverId = req.query.driverId ? parseInt(req.query.driverId as string) : undefined;
    const status = req.query.status as string;
    const orders = await storage.getOrders(driverId, status);
    res.json(orders);
  } catch {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/api/orders/:id", async (req, res) => {
  try {
    const order = await storage.getOrder(parseInt(req.params.id));
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.post("/api/orders", async (req, res) => {
  try {
    const order = await storage.createOrder(insertOrderSchema.parse(req.body));
    res.status(201).json(order);
  } catch {
    res.status(400).json({ error: "Invalid order data" });
  }
});

router.patch("/api/orders/:id", async (req, res) => {
  try {
    const order = await storage.updateOrder(parseInt(req.params.id), req.body);
    res.json(order);
  } catch {
    res.status(400).json({ error: "Failed to update order" });
  }
});

// ------------------------------
// ORDER ITEMS
// ------------------------------
router.post("/api/order-items", async (req, res) => {
  try {
    const item = await storage.createOrderItem(insertOrderItemSchema.parse(req.body));
    res.status(201).json(item);
  } catch {
    res.status(400).json({ error: "Invalid order item data" });
  }
});

router.patch("/api/order-items/:id", async (req, res) => {
  try {
    const item = await storage.updateOrderItem(parseInt(req.params.id), req.body);
    res.json(item);
  } catch {
    res.status(400).json({ error: "Failed to update order item" });
  }
});

// ------------------------------
// CUSTOMERS
// ------------------------------
router.get("/api/customers", async (_, res) => {
  try {
    res.json(await storage.getCustomers());
  } catch {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

router.get("/api/customers/:id", async (req, res) => {
  try {
    const customer = await storage.getCustomer(parseInt(req.params.id));
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch {
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

router.post("/api/customers", async (req, res) => {
  try {
    const customer = await storage.createCustomer(insertCustomerSchema.parse(req.body));
    res.status(201).json(customer);
  } catch {
    res.status(400).json({ error: "Invalid customer data" });
  }
});

// ------------------------------
// PRODUCTS
// ------------------------------
router.get("/api/products", async (_, res) => {
  try {
    res.json(await storage.getProducts());
  } catch {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/api/products/:id", async (req, res) => {
  try {
    const product = await storage.getProduct(parseInt(req.params.id));
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.post("/api/products", async (req, res) => {
  try {
    const product = await storage.createProduct(insertProductSchema.parse(req.body));
    res.status(201).json(product);
  } catch {
    res.status(400).json({ error: "Invalid product data" });
  }
});

// ------------------------------
// INVENTORY
// ------------------------------
router.get("/api/inventory", async (req, res) => {
  try {
    const { driverId } = req.query;
    if (!driverId) return res.status(400).json({ error: "Driver ID is required" });
    const inventory = await storage.getInventory(parseInt(driverId as string));
    res.json(inventory);
  } catch {
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

router.patch("/api/inventory", async (req, res) => {
  try {
    const { productId, driverId, quantity } = req.body;
    const updated = await storage.updateInventory(productId, driverId, quantity);
    res.json(updated);
  } catch {
    res.status(400).json({ error: "Failed to update inventory" });
  }
});

// ------------------------------
// ROUTES
// ------------------------------
router.get("/api/routes", async (req, res) => {
  try {
    const { driverId } = req.query;
    if (!driverId) return res.status(400).json({ error: "Driver ID is required" });
    const routes = await storage.getRoutes(parseInt(driverId as string));
    res.json(routes);
  } catch {
    res.status(500).json({ error: "Failed to fetch routes" });
  }
});

router.get("/api/routes/:id", async (req, res) => {
  try {
    const route = await storage.getRoute(parseInt(req.params.id));
    if (!route) return res.status(404).json({ error: "Route not found" });
    res.json(route);
  } catch {
    res.status(500).json({ error: "Failed to fetch route" });
  }
});

router.post("/api/routes", async (req, res) => {
  try {
    const route = await storage.createRoute(insertRouteSchema.parse(req.body));
    res.status(201).json(route);
  } catch {
    res.status(400).json({ error: "Invalid route data" });
  }
});

// ------------------------------
// STATISTICS
// ------------------------------
router.get("/api/statistics", async (req, res) => {
  try {
    const { driverId, date } = req.query;
    if (!driverId) return res.status(400).json({ error: "Driver ID is required" });
    const stats = await storage.getOrderStatistics(
      parseInt(driverId as string),
      date ? new Date(date as string) : undefined
    );
    res.json(stats);
  } catch {
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// ------------------------------
// DELIVERY ACTIONS
// ------------------------------
router.post("/api/delivery/start", async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await storage.updateOrder(orderId, { status: "in_progress" });
    res.json(order);
  } catch {
    res.status(400).json({ error: "Failed to start delivery" });
  }
});

router.post("/api/delivery/complete", async (req, res) => {
  try {
    const { orderId, deliveredAmount, signatureData, photoUrl, items } = req.body;
    const order = await storage.updateOrder(orderId, {
      status: "delivered",
      deliveredAmount,
      deliveredAt: new Date(),
      signatureData,
      photoUrl,
    });
    if (items) {
      for (const item of items) {
        await storage.updateOrderItem(item.id, {
          deliveredQuantity: item.deliveredQuantity,
          partialReason: item.partialReason,
        });
      }
    }
    res.json(order);
  } catch {
    res.status(400).json({ error: "Failed to complete delivery" });
  }
});

router.post("/api/delivery/not-delivered", async (req, res) => {
  try {
    const { orderId, reason, gpsLatitude, gpsLongitude } = req.body;
    const order = await storage.updateOrder(orderId, {
      status: "not_delivered",
      nonDeliveryReason: reason,
      gpsLatitude,
      gpsLongitude,
    });
    res.json(order);
  } catch {
    res.status(400).json({ error: "Failed to mark as not delivered" });
  }
});

router.post("/api/delivery/capture-gps", async (req, res) => {
  try {
    const { orderId, latitude, longitude } = req.body;
    const order = await storage.updateOrder(orderId, {
      gpsLatitude: latitude.toString(),
      gpsLongitude: longitude.toString(),
    });
    res.json(order);
  } catch {
    res.status(400).json({ error: "Failed to capture GPS coordinates" });
  }
});

// ------------------------------
// ROUTE SESSIONS
// ------------------------------
router.get("/api/route-sessions", async (req, res) => {
  try {
    const { driverId } = req.query;
    if (!driverId) return res.status(400).json({ error: "Driver ID is required" });
    const sessions = await storage.getRouteSessions(parseInt(driverId as string));
    res.json(sessions);
  } catch {
    res.status(500).json({ error: "Failed to fetch route sessions" });
  }
});

router.post("/api/route-sessions/start", async (req, res) => {
  try {
    const data = insertRouteSessionSchema.parse(req.body);
    const session = await storage.createRouteSession({
      ...data,
      startedAt: new Date(),
      status: "active",
    });
    res.status(201).json(session);
  } catch {
    res.status(400).json({ error: "Failed to start route session" });
  }
});

router.post("/api/route-sessions/end", async (req, res) => {
  try {
    const { sessionId, endMileage, inventoryReturned } = req.body;
    const session = await storage.updateRouteSession(sessionId, {
      endMileage,
      completedAt: new Date(),
      status: "completed",
    });
    const report = await storage.createDailyReport({
      sessionId,
      driverId: session.driverId,
      date: new Date(),
      inventoryReturned: inventoryReturned || [],
    });
    res.json({ session, report });
  } catch {
    res.status(400).json({ error: "Failed to end route session" });
  }
});

// ------------------------------
// DAILY REPORTS
// ------------------------------
router.get("/api/daily-reports", async (req, res) => {
  try {
    const { driverId, date } = req.query;
    if (!driverId) return res.status(400).json({ error: "Driver ID is required" });
    const reports = await storage.getDailyReports(
      parseInt(driverId as string),
      date ? new Date(date as string) : undefined
    );
    res.json(reports);
  } catch {
    res.status(500).json({ error: "Failed to fetch daily reports" });
  }
});

export function registerRoutes(app: express.Application) {
  app.use(router);
  return app;
}