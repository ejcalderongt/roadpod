import express from "express";
import { storage } from "./storage";
import { 
  insertOrderSchema, insertCustomerSchema, insertProductSchema, 
  insertInventorySchema, insertRouteSchema, insertOrderItemSchema,
  insertRouteSessionSchema, insertDailyReportSchema
} from "@shared/schema";

const router = express.Router();

// Authentication routes
router.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Simple session - store user ID in session
    req.session = req.session || {};
    req.session.userId = user.id;
    
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/api/auth/logout", async (req, res) => {
  try {
    req.session = null;
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
});

router.get("/api/auth/me", async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: "Failed to get user info" });
  }
});

// Orders routes
router.get("/api/orders", async (req, res) => {
  try {
    const driverId = req.query.driverId ? parseInt(req.query.driverId as string) : undefined;
    const status = req.query.status as string;
    
    const orders = await storage.getOrders(driverId, status);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/api/orders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const order = await storage.getOrder(id);
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.post("/api/orders", async (req, res) => {
  try {
    const orderData = insertOrderSchema.parse(req.body);
    const order = await storage.createOrder(orderData);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: "Invalid order data" });
  }
});

router.patch("/api/orders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const order = await storage.updateOrder(id, updates);
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: "Failed to update order" });
  }
});

// Order items routes
router.post("/api/order-items", async (req, res) => {
  try {
    const itemData = insertOrderItemSchema.parse(req.body);
    const orderItem = await storage.createOrderItem(itemData);
    res.status(201).json(orderItem);
  } catch (error) {
    res.status(400).json({ error: "Invalid order item data" });
  }
});

router.patch("/api/order-items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    const orderItem = await storage.updateOrderItem(id, updates);
    res.json(orderItem);
  } catch (error) {
    res.status(400).json({ error: "Failed to update order item" });
  }
});

// Customers routes
router.get("/api/customers", async (req, res) => {
  try {
    const customers = await storage.getCustomers();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

router.get("/api/customers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const customer = await storage.getCustomer(id);
    
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customer" });
  }
});

router.post("/api/customers", async (req, res) => {
  try {
    const customerData = insertCustomerSchema.parse(req.body);
    const customer = await storage.createCustomer(customerData);
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ error: "Invalid customer data" });
  }
});

// Products routes
router.get("/api/products", async (req, res) => {
  try {
    const products = await storage.getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/api/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const product = await storage.getProduct(id);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.post("/api/products", async (req, res) => {
  try {
    const productData = insertProductSchema.parse(req.body);
    const product = await storage.createProduct(productData);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: "Invalid product data" });
  }
});

// Inventory routes
router.get("/api/inventory", async (req, res) => {
  try {
    const driverId = req.query.driverId;
    
    if (!driverId) {
      return res.status(400).json({ error: "Driver ID is required" });
    }
    
    const inventory = await storage.getInventory(parseInt(driverId as string));
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

router.patch("/api/inventory", async (req, res) => {
  try {
    const { productId, driverId, quantity } = req.body;
    
    const inventoryItem = await storage.updateInventory(productId, driverId, quantity);
    res.json(inventoryItem);
  } catch (error) {
    res.status(400).json({ error: "Failed to update inventory" });
  }
});

// Routes routes
router.get("/api/routes", async (req, res) => {
  try {
    const driverId = req.query.driverId;
    
    if (!driverId) {
      return res.status(400).json({ error: "Driver ID is required" });
    }
    
    const routes = await storage.getRoutes(parseInt(driverId as string));
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch routes" });
  }
});

router.get("/api/routes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const route = await storage.getRoute(id);
    
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }
    
    res.json(route);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch route" });
  }
});

router.post("/api/routes", async (req, res) => {
  try {
    const routeData = insertRouteSchema.parse(req.body);
    const route = await storage.createRoute(routeData);
    res.status(201).json(route);
  } catch (error) {
    res.status(400).json({ error: "Invalid route data" });
  }
});

// Statistics routes
router.get("/api/statistics", async (req, res) => {
  try {
    const driverId = req.query.driverId;
    const date = req.query.date;
    
    if (!driverId) {
      return res.status(400).json({ error: "Driver ID is required" });
    }
    
    const stats = await storage.getOrderStatistics(
      parseInt(driverId as string),
      date ? new Date(date as string) : undefined
    );
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Delivery actions
router.post("/api/delivery/start", async (req, res) => {
  try {
    const { orderId } = req.body;
    
    const order = await storage.updateOrder(orderId, { status: "in_progress" });
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: "Failed to start delivery" });
  }
});

router.post("/api/delivery/complete", async (req, res) => {
  try {
    const { orderId, deliveredAmount, signatureData, photoUrl, items } = req.body;
    
    // Update order status
    const order = await storage.updateOrder(orderId, {
      status: "delivered",
      deliveredAmount,
      deliveredAt: new Date(),
      signatureData,
      photoUrl,
    });

    // Update individual items
    if (items) {
      for (const item of items) {
        await storage.updateOrderItem(item.id, {
          deliveredQuantity: item.deliveredQuantity,
          partialReason: item.partialReason,
        });
      }
    }

    res.json(order);
  } catch (error) {
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
  } catch (error) {
    res.status(400).json({ error: "Failed to mark as not delivered" });
  }
});

// Route Sessions routes
router.get("/api/route-sessions", async (req, res) => {
  try {
    const driverId = req.query.driverId;
    
    if (!driverId) {
      return res.status(400).json({ error: "Driver ID is required" });
    }
    
    const sessions = await storage.getRouteSessions(parseInt(driverId as string));
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch route sessions" });
  }
});

router.post("/api/route-sessions/start", async (req, res) => {
  try {
    const sessionData = insertRouteSessionSchema.parse(req.body);
    const session = await storage.createRouteSession({
      ...sessionData,
      startedAt: new Date(),
      status: "active",
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ error: "Failed to start route session" });
  }
});

router.post("/api/route-sessions/end", async (req, res) => {
  try {
    const { sessionId, endMileage, inventoryReturned } = req.body;
    
    // End the session
    const session = await storage.updateRouteSession(sessionId, {
      endMileage,
      completedAt: new Date(),
      status: "completed",
    });

    // Create daily report
    const report = await storage.createDailyReport({
      sessionId,
      driverId: session.driverId,
      date: new Date(),
      inventoryReturned: inventoryReturned || [],
    });

    res.json({ session, report });
  } catch (error) {
    res.status(400).json({ error: "Failed to end route session" });
  }
});

// GPS capture for orders
router.post("/api/delivery/capture-gps", async (req, res) => {
  try {
    const { orderId, latitude, longitude } = req.body;
    
    const order = await storage.updateOrder(orderId, {
      gpsLatitude: latitude.toString(),
      gpsLongitude: longitude.toString(),
    });
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: "Failed to capture GPS coordinates" });
  }
});

// Daily Reports routes
router.get("/api/daily-reports", async (req, res) => {
  try {
    const driverId = req.query.driverId;
    const date = req.query.date;
    
    if (!driverId) {
      return res.status(400).json({ error: "Driver ID is required" });
    }
    
    const reports = await storage.getDailyReports(
      parseInt(driverId as string),
      date ? new Date(date as string) : undefined
    );
    
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch daily reports" });
  }
});

export function registerRoutes(app: express.Application) {
  app.use(router);
  return app;
}