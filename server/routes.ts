import express from "express";
import { storage } from "./storage";
import { 
  insertOrderSchema, insertCustomerSchema, insertProductSchema, 
  insertInventorySchema, insertRouteSchema, insertOrderItemSchema
} from "@shared/schema";

const router = express.Router();

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
    const { orderId, reason } = req.body;
    
    const order = await storage.updateOrder(orderId, {
      status: "not_delivered",
      nonDeliveryReason: reason,
    });
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: "Failed to mark as not delivered" });
  }
});

export function registerRoutes(app: express.Application) {
  app.use(router);
  return app;
}