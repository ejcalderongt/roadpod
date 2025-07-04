import { pgTable, serial, text, integer, decimal, timestamp, boolean, json, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users/Drivers table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  inventory: many(inventory),
  routes: many(routes),
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

export const routesRelations = relations(routes, ({ one }) => ({
  driver: one(users, {
    fields: [routes.driverId],
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
