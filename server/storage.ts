import { db } from "./db";
import { 
  users, customers, products, orders, orderItems, inventory, routes, routeSessions, dailyReports,
  type User, type InsertUser,
  type Customer, type InsertCustomer,
  type Product, type InsertProduct,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type Inventory, type InsertInventory,
  type Route, type InsertRoute,
  type RouteSession, type InsertRouteSession,
  type DailyReport, type InsertDailyReport
} from "@shared/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;

  // Orders
  getOrders(driverId?: number, status?: string): Promise<(Order & { customer: Customer; items: (OrderItem & { product: Product })[] })[]>;
  getOrder(id: number): Promise<(Order & { customer: Customer; items: (OrderItem & { product: Product })[] }) | undefined>;
  createOrder(insertOrder: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: Partial<Order>): Promise<Order>;
  
  // Order Items
  createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, updates: Partial<OrderItem>): Promise<OrderItem>;
  
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(insertCustomer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(insertProduct: InsertProduct): Promise<Product>;
  
  // Inventory
  getInventory(driverId: number): Promise<(Inventory & { product: Product })[]>;
  updateInventory(productId: number, driverId: number, quantity: number): Promise<Inventory>;
  
  // Routes
  getRoutes(driverId: number): Promise<Route[]>;
  getRoute(id: number): Promise<Route | undefined>;
  createRoute(insertRoute: InsertRoute): Promise<Route>;
  updateRoute(id: number, updates: Partial<Route>): Promise<Route>;
  
  // Route Sessions
  getRouteSessions(driverId: number): Promise<RouteSession[]>;
  createRouteSession(insertRouteSession: InsertRouteSession): Promise<RouteSession>;
  updateRouteSession(id: number, updates: Partial<RouteSession>): Promise<RouteSession>;
  
  // Daily Reports
  getDailyReports(driverId: number, date?: Date): Promise<DailyReport[]>;
  createDailyReport(insertDailyReport: InsertDailyReport): Promise<DailyReport>;
  
  // Statistics
  getOrderStatistics(driverId: number, date?: Date): Promise<{
    pending: number;
    delivered: number;
    notDelivered: number;
    totalInventory: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getOrders(driverId?: number, status?: string) {
    let whereConditions = [];
    
    if (driverId) {
      whereConditions.push(eq(orders.driverId, driverId));
    }
    if (status) {
      whereConditions.push(eq(orders.status, status));
    }

    let query = db
      .select()
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id));

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    const results = await query.orderBy(desc(orders.createdAt));
    
    // Group results by order
    const ordersMap = new Map();
    for (const result of results) {
      const order = result.orders;
      const customer = result.customers!;
      const orderItem = result.order_items;
      const product = result.products;

      if (!ordersMap.has(order.id)) {
        ordersMap.set(order.id, { ...order, customer, items: [] });
      }

      if (orderItem && product) {
        ordersMap.get(order.id).items.push({ ...orderItem, product });
      }
    }

    return Array.from(ordersMap.values());
  }

  async getOrder(id: number) {
    const results = await db
      .select()
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orders.id, id));

    if (results.length === 0) return undefined;

    const order = results[0].orders;
    const customer = results[0].customers!;
    const items: (OrderItem & { product: Product })[] = [];

    for (const result of results) {
      if (result.order_items && result.products) {
        items.push({ ...result.order_items, product: result.products });
      }
    }

    return { ...order, customer, items };
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrder(id: number, updates: Partial<Order>): Promise<Order> {
    const [order] = await db.update(orders).set(updates).where(eq(orders.id, id)).returning();
    return order;
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db.insert(orderItems).values(insertOrderItem).returning();
    return orderItem;
  }

  async updateOrderItem(id: number, updates: Partial<OrderItem>): Promise<OrderItem> {
    const [orderItem] = await db.update(orderItems).set(updates).where(eq(orderItems.id, id)).returning();
    return orderItem;
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.isActive, true));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer> {
    const [customer] = await db.update(customers).set(updates).where(eq(customers.id, id)).returning();
    return customer;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isActive, true));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async getInventory(driverId: number) {
    const results = await db
      .select()
      .from(inventory)
      .leftJoin(products, eq(inventory.productId, products.id))
      .where(eq(inventory.driverId, driverId));
    
    return results.map(result => ({
      ...result.inventory,
      product: result.products!,
    }));
  }

  async updateInventory(productId: number, driverId: number, quantity: number): Promise<Inventory> {
    const [inventoryItem] = await db
      .update(inventory)
      .set({ quantity, lastUpdated: sql`now()` })
      .where(and(eq(inventory.productId, productId), eq(inventory.driverId, driverId)))
      .returning();
    return inventoryItem;
  }

  async getRoutes(driverId: number): Promise<Route[]> {
    return await db.select().from(routes).where(eq(routes.driverId, driverId)).orderBy(desc(routes.date));
  }

  async getRoute(id: number): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.id, id));
    return route || undefined;
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const [route] = await db.insert(routes).values(insertRoute).returning();
    return route;
  }

  async updateRoute(id: number, updates: Partial<Route>): Promise<Route> {
    const [route] = await db.update(routes).set(updates).where(eq(routes.id, id)).returning();
    return route;
  }

  async getOrderStatistics(driverId: number, date?: Date) {
    const today = date || new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [stats] = await db
      .select({
        pending: sql<number>`count(case when status = 'pending' then 1 end)`,
        delivered: sql<number>`count(case when status = 'delivered' then 1 end)`,
        notDelivered: sql<number>`count(case when status = 'not_delivered' then 1 end)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.driverId, driverId),
          gte(orders.scheduledDate, startOfDay),
          lte(orders.scheduledDate, endOfDay)
        )
      );

    const [inventoryCount] = await db
      .select({
        totalInventory: sql<number>`sum(quantity)`,
      })
      .from(inventory)
      .where(eq(inventory.driverId, driverId));

    return {
      pending: Number(stats.pending || 0),
      delivered: Number(stats.delivered || 0),
      notDelivered: Number(stats.notDelivered || 0),
      totalInventory: Number(inventoryCount.totalInventory || 0),
    };
  }

  // Route Sessions methods
  async getRouteSessions(driverId: number): Promise<RouteSession[]> {
    return await db.select()
      .from(routeSessions)
      .where(eq(routeSessions.driverId, driverId))
      .orderBy(desc(routeSessions.createdAt));
  }

  async createRouteSession(insertRouteSession: InsertRouteSession): Promise<RouteSession> {
    const [session] = await db.insert(routeSessions).values(insertRouteSession).returning();
    return session;
  }

  async updateRouteSession(id: number, updates: Partial<RouteSession>): Promise<RouteSession> {
    const [session] = await db.update(routeSessions)
      .set(updates)
      .where(eq(routeSessions.id, id))
      .returning();
    return session;
  }

  // Daily Reports methods
  async getDailyReports(driverId: number, date?: Date): Promise<DailyReport[]> {
    let query = db.select().from(dailyReports).where(eq(dailyReports.driverId, driverId));
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query = query.where(
        and(
          eq(dailyReports.driverId, driverId),
          gte(dailyReports.date, startOfDay),
          lte(dailyReports.date, endOfDay)
        )
      );
    }
    
    return await query.orderBy(desc(dailyReports.createdAt));
  }

  async createDailyReport(insertDailyReport: InsertDailyReport): Promise<DailyReport> {
    const [report] = await db.insert(dailyReports).values(insertDailyReport).returning();
    return report;
  }
}

export const storage = new DatabaseStorage();
