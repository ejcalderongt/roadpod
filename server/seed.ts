import { db } from "./db";
import { users, customers, products, orders, orderItems, inventory, routes, routeSessions, dailyReports } from "@shared/schema";

async function seedDatabase() {
  console.log("Seeding database...");

  // Create a test driver - username: 1, password: 1
  const [driver] = await db.insert(users).values({
    username: "1",
    password: "1", // Simple password for demo
    email: "driver@deliveryroute.com",
    name: "Juan Pérez",
    role: "driver",
  }).returning();

  // Create customers
  const customerData = [
    {
      name: "Tienda El Progreso",
      contact: "María González",
      phone: "+57 300 123 4567",
      email: "maria@elprogreso.com",
      address: "Calle 45 #23-67, Barrio San Pedro",
      latitude: "4.6097102",
      longitude: "-74.0817500",
      schedule: "8:00 AM - 12:00 PM",
      creditDays: 30,
      weeklyPattern: [true, false, true, false, true, false, false],
    },
    {
      name: "Supermercado La Esquina",
      contact: "Carlos Rodríguez",
      phone: "+57 300 234 5678",
      email: "carlos@laesquina.com",
      address: "Carrera 15 #34-89, Centro",
      latitude: "4.6112745",
      longitude: "-74.0807398",
      schedule: "9:00 AM - 1:00 PM",
      creditDays: 15,
      weeklyPattern: [false, true, false, true, false, true, false],
    },
    {
      name: "Distribuidora Norte",
      contact: "Ana López",
      phone: "+57 300 345 6789",
      email: "ana@norte.com",
      address: "Avenida 68 #12-34, Zona Industrial",
      latitude: "4.6127846",
      longitude: "-74.0798765",
      schedule: "7:00 AM - 11:00 AM",
      creditDays: 45,
      weeklyPattern: [true, true, false, true, true, false, false],
    },
  ];

  const insertedCustomers = await db.insert(customers).values(customerData).returning();

  // Create products
  const productData = [
    {
      code: "ACE001",
      wmsProductCode: "WMS-ACE-001",
      name: "Aceite de Cocina Premium 1L",
      description: "Aceite de girasol refinado de alta calidad",
      category: "aceites",
      price: "8500.00",
      unit: "litros",
    },
    {
      code: "ARR002",
      wmsProductCode: "WMS-ARR-002",
      name: "Arroz Diana 500g",
      description: "Arroz blanco de grano largo",
      category: "granos",
      price: "3200.00",
      unit: "kilogramos",
    },
    {
      code: "SAL003",
      wmsProductCode: "WMS-SAL-003",
      name: "Sal Refisal 500g",
      description: "Sal de mesa refinada yodada",
      category: "condimentos",
      price: "1800.00",
      unit: "kilogramos",
    },
    {
      code: "AZU004",
      wmsProductCode: "WMS-AZU-004",
      name: "Azúcar Manuelita 1kg",
      description: "Azúcar blanca refinada",
      category: "condimentos",
      price: "4500.00",
      unit: "kilogramos",
    },
    {
      code: "FRI005",
      wmsProductCode: "WMS-FRI-005",
      name: "Fríjol Rojo 500g",
      description: "Fríjol rojo seco de primera calidad",
      category: "granos",
      price: "6200.00",
      unit: "kilogramos",
    },
  ];

  const insertedProducts = await db.insert(products).values(productData).returning();

  // Create inventory for the driver
  const inventoryData = insertedProducts.map(product => ({
    productId: product.id,
    driverId: driver.id,
    quantity: Math.floor(Math.random() * 50) + 10, // 10-60 units
    reservedQuantity: Math.floor(Math.random() * 10), // 0-10 reserved
  }));

  await db.insert(inventory).values(inventoryData);

  // Create orders
  const today = new Date();
  const orderData = [];

  for (let i = 0; i < 5; i++) {
    const customer = insertedCustomers[i % insertedCustomers.length];
    const scheduledDate = new Date(today);
    scheduledDate.setHours(8 + (i * 2), 0, 0, 0);

    const order = {
      orderNumber: `ORD-${String(i + 1).padStart(3, '0')}`,
      wmsOrderCode: `WMS-ORD-${String(i + 1).padStart(3, '0')}`,
      customerId: customer.id,
      driverId: driver.id,
      status: i < 2 ? "pending" : i < 4 ? "delivered" : "not_delivered",
      totalAmount: "0.00", // Will be calculated
      scheduledDate,
      deliveredAt: i >= 2 && i < 4 ? new Date() : null,
    };

    orderData.push(order);
  }

  const insertedOrders = await db.insert(orders).values(orderData).returning();

  // Create order items
  for (const order of insertedOrders) {
    const numItems = Math.floor(Math.random() * 3) + 2; // 2-4 items per order
    let totalAmount = 0;

    for (let i = 0; i < numItems; i++) {
      const product = insertedProducts[i % insertedProducts.length];
      const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 units
      const price = parseFloat(product.price);
      const itemTotal = price * quantity;
      totalAmount += itemTotal;

      await db.insert(orderItems).values({
        orderId: order.id,
        productId: product.id,
        quantity,
        deliveredQuantity: order.status === "delivered" ? quantity : (order.status === "not_delivered" ? 0 : quantity),
        price: product.price,
        totalAmount: itemTotal.toString(),
      });
    }

    // Update order total amount
    await db.update(orders)
      .set({ 
        totalAmount: totalAmount.toString(),
        deliveredAmount: order.status === "delivered" ? totalAmount.toString() : "0.00"
      })
      .where(eq(orders.id, order.id));
  }

  // Create routes
  const routeData = [
    {
      driverId: driver.id,
      name: "Ruta Norte - Zona Comercial",
      date: today,
      status: "active",
      totalDistance: "12.5",
      estimatedTime: 240, // 4 hours
      waypoints: [
        { lat: 4.6097102, lng: -74.0817500, orderId: insertedOrders[0]?.id },
        { lat: 4.6112745, lng: -74.0807398, orderId: insertedOrders[1]?.id },
        { lat: 4.6127846, lng: -74.0798765, orderId: insertedOrders[2]?.id },
      ],
    },
    {
      driverId: driver.id,
      name: "Ruta Sur - Zona Industrial",
      date: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      status: "completed",
      totalDistance: "18.3",
      estimatedTime: 300, // 5 hours
      actualTime: 285,
      waypoints: [
        { lat: 4.5897102, lng: -74.0917500 },
        { lat: 4.5812745, lng: -74.0907398 },
      ],
    },
  ];

  const insertedRoutes = await db.insert(routes).values(routeData).returning();

  // Create route session for current active route
  const activeRoute = insertedRoutes.find(r => r.status === "active");
  if (activeRoute) {
    const [session] = await db.insert(routeSessions).values({
      routeId: activeRoute.id,
      driverId: driver.id,
      assistantName: "María González",
      startMileage: "12450.5",
      status: "active",
      startedAt: new Date(),
    }).returning();

    console.log(`Created active route session for: ${activeRoute.name}`);
  }

  console.log("Database seeded successfully!");
  console.log(`Created ${insertedCustomers.length} customers`);
  console.log(`Created ${insertedProducts.length} products`);
  console.log(`Created ${insertedOrders.length} orders`);
  console.log(`Created inventory for driver: ${driver.name}`);
}

// Add the missing import for eq
import { eq } from "drizzle-orm";

// Run the seed function
seedDatabase().catch(console.error);

export { seedDatabase };