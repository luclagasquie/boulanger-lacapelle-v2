import { env } from "cloudflare:workers";

export type Product = {
  id: number;
  slug: string;
  title: string;
  weight_grams: number;
  price_per_kg_cents: number;
  image_url: string;
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type OrderDateSummary = {
  pickup_date: string;
  pickup_label: string;
  order_count: number;
  total_cents: number;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_title: string;
  weight_grams: number;
  price_per_kg_cents: number;
  quantity: number;
  line_total_cents: number;
};

export type OrderRecord = {
  id: number;
  pickup_date: string;
  pickup_label: string;
  customer_first_name: string;
  customer_last_name: string;
  phone: string;
  total_cents: number;
  created_at: string;
  items: OrderItem[];
};

const defaultProducts = [
  {
    slug: "pain-au-levain",
    title: "Pain au levain",
    weight_grams: 900,
    price_per_kg_cents: 920,
    image_url: "/images/pain-au-levain.svg",
    sort_order: 1
  },
  {
    slug: "pain-complet",
    title: "Pain complet",
    weight_grams: 800,
    price_per_kg_cents: 860,
    image_url: "/images/pain-complet.svg",
    sort_order: 2
  },
  {
    slug: "pain-de-mie",
    title: "Pain de mie",
    weight_grams: 550,
    price_per_kg_cents: 1100,
    image_url: "/images/pain-de-mie.svg",
    sort_order: 3
  },
  {
    slug: "pain-burger",
    title: "Pain burger",
    weight_grams: 360,
    price_per_kg_cents: 1350,
    image_url: "/images/pain-burger.svg",
    sort_order: 4
  },
  {
    slug: "pain-aux-noisettes",
    title: "Pain aux noisettes",
    weight_grams: 700,
    price_per_kg_cents: 1450,
    image_url: "/images/pain-aux-noisettes.svg",
    sort_order: 5
  }
];

let setupPromise: Promise<void> | null = null;

function db() {
  return env.DB;
}

export function priceFromWeight(weightGrams: number, pricePerKgCents: number) {
  return Math.round((weightGrams * pricePerKgCents) / 1000);
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(cents / 100);
}

export async function ensureDatabase() {
  if (setupPromise) {
    return setupPromise;
  }

  setupPromise = (async () => {
    const database = db();

    await database.batch([
      database.prepare(
        `CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          slug TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          weight_grams INTEGER NOT NULL,
          price_per_kg_cents INTEGER NOT NULL,
          image_url TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      ),
      database.prepare(
        `CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pickup_date TEXT NOT NULL,
          pickup_label TEXT NOT NULL,
          customer_first_name TEXT NOT NULL,
          customer_last_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          total_cents INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      ),
      database.prepare(
        `CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          product_id INTEGER,
          product_title TEXT NOT NULL,
          weight_grams INTEGER NOT NULL,
          price_per_kg_cents INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          line_total_cents INTEGER NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        )`
      ),
      database.prepare("CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order, title)"),
      database.prepare("CREATE INDEX IF NOT EXISTS idx_orders_pickup_date ON orders(pickup_date)"),
      database.prepare("CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)")
    ]);

    const existing = await database.prepare("SELECT COUNT(*) AS total FROM products").first<{ total: number }>();

    if ((existing?.total || 0) === 0) {
      await database.batch(
        defaultProducts.map((product) =>
          database
            .prepare(
              `INSERT INTO products (
                slug,
                title,
                weight_grams,
                price_per_kg_cents,
                image_url,
                sort_order,
                is_active
              ) VALUES (?, ?, ?, ?, ?, ?, 1)`
            )
            .bind(
              product.slug,
              product.title,
              product.weight_grams,
              product.price_per_kg_cents,
              product.image_url,
              product.sort_order
            )
        )
      );
    }
  })();

  return setupPromise;
}

export async function listActiveProducts() {
  await ensureDatabase();
  const result = await db()
    .prepare(
      `SELECT id, slug, title, weight_grams, price_per_kg_cents, image_url, is_active, sort_order, created_at, updated_at
       FROM products
       WHERE is_active = 1
       ORDER BY sort_order ASC, title ASC`
    )
    .all<Product>();

  return result.results || [];
}

export async function listAllProducts() {
  await ensureDatabase();
  const result = await db()
    .prepare(
      `SELECT id, slug, title, weight_grams, price_per_kg_cents, image_url, is_active, sort_order, created_at, updated_at
       FROM products
       ORDER BY sort_order ASC, title ASC`
    )
    .all<Product>();

  return result.results || [];
}

export async function insertOrder(input: {
  pickupDate: string;
  pickupLabel: string;
  firstName: string;
  lastName: string;
  phone: string;
  totalCents: number;
  items: Array<{
    productId: number;
    productTitle: string;
    weightGrams: number;
    pricePerKgCents: number;
    quantity: number;
    lineTotalCents: number;
  }>;
}) {
  await ensureDatabase();
  const order = await db()
    .prepare(
      `INSERT INTO orders (
        pickup_date,
        pickup_label,
        customer_first_name,
        customer_last_name,
        phone,
        total_cents
      ) VALUES (?, ?, ?, ?, ?, ?)
      RETURNING id`
    )
    .bind(
      input.pickupDate,
      input.pickupLabel,
      input.firstName,
      input.lastName,
      input.phone,
      input.totalCents
    )
    .first<{ id: number }>();

  if (!order?.id) {
    throw new Error("La commande n'a pas pu etre enregistree.");
  }

  await db().batch(
    input.items.map((item) =>
      db()
        .prepare(
          `INSERT INTO order_items (
            order_id,
            product_id,
            product_title,
            weight_grams,
            price_per_kg_cents,
            quantity,
            line_total_cents
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          order.id,
          item.productId,
          item.productTitle,
          item.weightGrams,
          item.pricePerKgCents,
          item.quantity,
          item.lineTotalCents
        )
    )
  );

  return order.id;
}

export async function listOrderDates() {
  await ensureDatabase();
  const result = await db()
    .prepare(
      `SELECT pickup_date, pickup_label, COUNT(*) AS order_count, COALESCE(SUM(total_cents), 0) AS total_cents
       FROM orders
       GROUP BY pickup_date, pickup_label
       ORDER BY pickup_date DESC`
    )
    .all<OrderDateSummary>();

  return result.results || [];
}

export async function listOrdersForPickupDate(pickupDate: string) {
  await ensureDatabase();
  const orderRows = await db()
    .prepare(
      `SELECT id, pickup_date, pickup_label, customer_first_name, customer_last_name, phone, total_cents, created_at
       FROM orders
       WHERE pickup_date = ?
       ORDER BY created_at ASC, id ASC`
    )
    .bind(pickupDate)
    .all<Omit<OrderRecord, "items">>();

  if (!(orderRows.results || []).length) {
    return [];
  }

  const itemRows = await db()
    .prepare(
      `SELECT id, order_id, product_title, weight_grams, price_per_kg_cents, quantity, line_total_cents
       FROM order_items
       WHERE order_id IN (${(orderRows.results || []).map(() => "?").join(", ")})
       ORDER BY id ASC`
    )
    .bind(...(orderRows.results || []).map((row) => row.id))
    .all<OrderItem>();

  const itemsByOrder = new Map<number, OrderItem[]>();

  for (const item of itemRows.results || []) {
    const bucket = itemsByOrder.get(item.order_id) || [];
    bucket.push(item);
    itemsByOrder.set(item.order_id, bucket);
  }

  return (orderRows.results || []).map((order) => ({
    ...order,
    items: itemsByOrder.get(order.id) || []
  }));
}

export async function createProduct(input: {
  slug: string;
  title: string;
  weightGrams: number;
  pricePerKgCents: number;
  imageUrl: string;
  isActive: number;
  sortOrder: number;
}) {
  await ensureDatabase();
  await db()
    .prepare(
      `INSERT INTO products (
        slug,
        title,
        weight_grams,
        price_per_kg_cents,
        image_url,
        is_active,
        sort_order,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
    .bind(
      input.slug,
      input.title,
      input.weightGrams,
      input.pricePerKgCents,
      input.imageUrl,
      input.isActive,
      input.sortOrder
    )
    .run();
}

export async function updateProduct(input: {
  id: number;
  slug: string;
  title: string;
  weightGrams: number;
  pricePerKgCents: number;
  imageUrl: string;
  isActive: number;
  sortOrder: number;
}) {
  await ensureDatabase();
  await db()
    .prepare(
      `UPDATE products
       SET slug = ?,
           title = ?,
           weight_grams = ?,
           price_per_kg_cents = ?,
           image_url = ?,
           is_active = ?,
           sort_order = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(
      input.slug,
      input.title,
      input.weightGrams,
      input.pricePerKgCents,
      input.imageUrl,
      input.isActive,
      input.sortOrder,
      input.id
    )
    .run();
}

export async function deleteProduct(id: number) {
  await ensureDatabase();
  await db().prepare("DELETE FROM products WHERE id = ?").bind(id).run();
}

export async function resetOrdersForPickupDate(pickupDate: string) {
  await ensureDatabase();
  const orders = await db()
    .prepare("SELECT id FROM orders WHERE pickup_date = ?")
    .bind(pickupDate)
    .all<{ id: number }>();

  if (!(orders.results || []).length) {
    return;
  }

  await db().batch([
    db()
      .prepare(`DELETE FROM order_items WHERE order_id IN (${(orders.results || []).map(() => "?").join(", ")})`)
      .bind(...(orders.results || []).map((order) => order.id)),
    db().prepare("DELETE FROM orders WHERE pickup_date = ?").bind(pickupDate)
  ]);
}
