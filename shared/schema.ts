import { pgTable, serial, text, integer, decimal, timestamp, boolean, json, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users/Drivers table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("driver"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  contact: varchar("contact", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  schedule: varchar("schedule", { length: 100 }),
  creditDays: integer("credit_days").default(0),
  lastVisit: timestamp("last_visit"),
  isActive: boolean("is_active").notNull().default(true),
  weeklyPattern: json("weekly_pattern").$type<boolean[]>(), // 7 days pattern
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  wmsProductCode: varchar("wms_product_code", { length: 50 }).notNull().unique(), // WMS product code
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 20 }).default("units"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  wmsOrderCode: varchar("wms_order_code", { length: 50 }).notNull().unique(), // WMS order code
  customerId: integer("customer_id").notNull().references(() => customers.id),
  driverId: integer("driver_id").references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, in_progress, delivered, not_delivered
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  deliveredAmount: decimal("delivered_amount", { precision: 12, scale: 2 }).default("0"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  deliveredAt: timestamp("delivered_at"),
  notes: text("notes"),
  nonDeliveryReason: varchar("non_delivery_reason", { length: 200 }),
  signatureData: text("signature_data"),
  photoUrl: varchar("photo_url", { length: 500 }),
  gpsLatitude: decimal("gps_latitude", { precision: 10, scale: 8 }), // GPS coordinates captured during delivery
  gpsLongitude: decimal("gps_longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Order Items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  deliveredQuantity: integer("delivered_quantity").default(0),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  partialReason: varchar("partial_reason", { length: 200 }),
});

// Inventory table
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  driverId: integer("driver_id").notNull().references(() => users.id),
  quantity: integer("quantity").notNull().default(0),
  reservedQuantity: integer("reserved_quantity").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// Routes table
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull().references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  date: timestamp("date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, completed
  totalDistance: decimal("total_distance", { precision: 8, scale: 2 }),
  estimatedTime: integer("estimated_time"), // in minutes
  actualTime: integer("actual_time"), // in minutes
  waypoints: json("waypoints").$type<{ lat: number; lng: number; orderId?: number }[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Route Sessions table - for tracking daily route sessions
export const routeSessions = pgTable("route_sessions", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").notNull().references(() => routes.id),
  driverId: integer("driver_id").notNull().references(() => users.id),
  assistantName: varchar("assistant_name", { length: 100 }), // Assistant selected for this session
  startMileage: decimal("start_mileage", { precision: 10, scale: 2 }),
  endMileage: decimal("end_mileage", { precision: 10, scale: 2 }),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, completed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Daily Reports table - for end-of-day reporting
export const dailyReports = pgTable("daily_reports", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => routeSessions.id),
  driverId: integer("driver_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  totalDeliveries: integer("total_deliveries").default(0),
  totalCustomers: integer("total_customers").default(0),
  totalCollections: decimal("total_collections", { precision: 12, scale: 2 }).default("0"),
  inventoryReturned: json("inventory_returned").$type<{ productId: number; quantity: number; returnType: "wms" | "warehouse" }[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  inventory: many(inventory),
  routes: many(routes),
  routeSessions: many(routeSessions),
  dailyReports: many(dailyReports),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  inventory: many(inventory),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  driver: one(users, {
    fields: [orders.driverId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id],
  }),
  driver: one(users, {
    fields: [inventory.driverId],
    references: [users.id],
  }),
}));

export const routesRelations = relations(routes, ({ one, many }) => ({
  driver: one(users, {
    fields: [routes.driverId],
    references: [users.id],
  }),
  sessions: many(routeSessions),
}));

export const routeSessionsRelations = relations(routeSessions, ({ one }) => ({
  route: one(routes, {
    fields: [routeSessions.routeId],
    references: [routes.id],
  }),
  driver: one(users, {
    fields: [routeSessions.driverId],
    references: [users.id],
  }),
  dailyReport: one(dailyReports, {
    fields: [routeSessions.id],
    references: [dailyReports.sessionId],
  }),
}));

export const dailyReportsRelations = relations(dailyReports, ({ one }) => ({
  session: one(routeSessions, {
    fields: [dailyReports.sessionId],
    references: [routeSessions.id],
  }),
  driver: one(users, {
    fields: [dailyReports.driverId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export const selectCustomerSchema = createSelectSchema(customers);
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const selectProductSchema = createSelectSchema(products);
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const selectOrderSchema = createSelectSchema(orders);
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const selectOrderItemSchema = createSelectSchema(orderItems);
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true, lastUpdated: true });
export const selectInventorySchema = createSelectSchema(inventory);
export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export const insertRouteSchema = createInsertSchema(routes).omit({ id: true, createdAt: true });
export const selectRouteSchema = createSelectSchema(routes);
export type Route = typeof routes.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;

export const insertRouteSessionSchema = createInsertSchema(routeSessions).omit({ id: true, createdAt: true });
export const selectRouteSessionSchema = createSelectSchema(routeSessions);
export type RouteSession = typeof routeSessions.$inferSelect;
export type InsertRouteSession = z.infer<typeof insertRouteSessionSchema>;

export const insertDailyReportSchema = createInsertSchema(dailyReports).omit({ id: true, createdAt: true });
export const selectDailyReportSchema = createSelectSchema(dailyReports);
export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = z.infer<typeof insertDailyReportSchema>;
