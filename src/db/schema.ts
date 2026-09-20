import { mysqlTable, serial, varchar, decimal, timestamp, boolean, int, text, mysqlEnum, date } from "drizzle-orm/mysql-core";

export const roles = mysqlTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

export const permissions = mysqlTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

export const rolePermissions = mysqlTable("role_permissions", {
  roleId: int("role_id").notNull(),
  permissionId: int("permission_id").notNull(),
});

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  roleId: int("role_id").notNull(),
  status: boolean("status").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

export const suppliers = mysqlTable("suppliers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["Petani", "Pengepul", "Distributor", "Lainnya"]).default("Petani"),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  bankName: varchar("bank_name", { length: 100 }),
  bankAccount: varchar("bank_account", { length: 100 }),
  bankAccountName: varchar("bank_account_name", { length: 255 }),
  status: boolean("status").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = mysqlTable("products", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["RAW_MATERIAL", "FINISHED_GOOD", "BY_PRODUCT", "PACKAGING"]).notNull(),
  unit: varchar("unit", { length: 20 }).notNull().default("Kg"),
  defaultPrice: decimal("default_price", { precision: 15, scale: 2 }).default("0"),
  status: boolean("status").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const warehouses = mysqlTable("warehouses", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }),
  status: boolean("status").notNull().default(true),
});

export const customers = mysqlTable("customers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  npwp: varchar("npwp", { length: 50 }),
  creditLimit: decimal("credit_limit", { precision: 15, scale: 2 }).default("0"),
  termDays: int("term_days").default(0),
  status: boolean("status").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vehicles = mysqlTable("vehicles", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  policeNumber: varchar("police_number", { length: 20 }).notNull(),
  brand: varchar("brand", { length: 100 }),
  type: varchar("type", { length: 100 }),
  capacity: decimal("capacity", { precision: 15, scale: 2 }).default("0"),
  ownership: mysqlEnum("ownership", ["Milik Sendiri", "Sewa", "Pihak Ketiga"]).default("Milik Sendiri"),
  status: boolean("status").notNull().default(true),
});

export const drivers = mysqlTable("drivers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  licenseNumber: varchar("license_number", { length: 50 }),
  licenseType: varchar("license_type", { length: 20 }),
  licenseExpiry: date("license_expiry"),
  status: boolean("status").notNull().default(true),
});

export const deductionTypes = mysqlTable("purchase_deduction_types", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  calculationType: mysqlEnum("calculation_type", ["fixed", "per_kg", "percentage"]).notNull().default("fixed"),
  defaultValue: decimal("default_value", { precision: 15, scale: 2 }).default("0"),
  impactType: mysqlEnum("impact_type", ["SUPPLIER_DEDUCTION", "PURCHASE_COST", "PRODUCTION_COST", "OTHER"]).notNull().default("SUPPLIER_DEDUCTION"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const purchases = mysqlTable("purchases", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }).notNull().unique(),
  date: date("date").notNull(),
  supplierId: int("supplier_id").notNull(),
  rawMaterialId: int("raw_material_id").notNull(),
  warehouseId: int("warehouse_id").notNull(),
  grossWeight: decimal("gross_weight", { precision: 15, scale: 2 }).notNull(),
  tareWeight: decimal("tare_weight", { precision: 15, scale: 2 }).notNull(),
  netWeight: decimal("net_weight", { precision: 15, scale: 2 }).notNull(),
  refactionPercent: decimal("refaction_percent", { precision: 5, scale: 2 }).default("0"),
  refactionWeight: decimal("refaction_weight", { precision: 15, scale: 2 }).default("0"),
  payableWeight: decimal("payable_weight", { precision: 15, scale: 2 }).notNull(),
  pricePerKg: decimal("price_per_kg", { precision: 15, scale: 2 }).notNull(),
  baseAmount: decimal("base_amount", { precision: 15, scale: 2 }).notNull(),
  totalDeductions: decimal("total_deductions", { precision: 15, scale: 2 }).default("0"),
  netAmount: decimal("net_amount", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["Draft", "Pending", "Approved", "Completed", "Cancelled"]).default("Draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stockMovements = mysqlTable("stock_movements", {
  id: serial("id").primaryKey(),
  warehouseId: int("warehouse_id").notNull(),
  productId: int("product_id").notNull(),
  type: mysqlEnum("type", ["PURCHASE", "PRODUCTION_USAGE", "PRODUCTION_OUTPUT", "SALE", "RETURN", "ADJUSTMENT", "TRANSFER"]).notNull(),
  referenceId: int("reference_id"),
  qtyIn: decimal("qty_in", { precision: 15, scale: 2 }).default("0"),
  qtyOut: decimal("qty_out", { precision: 15, scale: 2 }).default("0"),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const purchaseDeductions = mysqlTable("purchase_deductions", {
  id: serial("id").primaryKey(),
  purchaseId: int("purchase_id").notNull(),
  deductionTypeId: int("deduction_type_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  calculationType: mysqlEnum("calculation_type", ["fixed", "per_kg", "percentage"]).notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 2 }).default("0"),
  rate: decimal("rate", { precision: 15, scale: 2 }).default("0"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Production
export const productionBatches = mysqlTable("production_batches", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }).notNull().unique(),
  date: date("date").notNull(),
  status: mysqlEnum("status", ["Draft", "Processing", "Completed", "Cancelled"]).default("Draft"),
  notes: text("notes"),
});

export const productionInputs = mysqlTable("production_inputs", {
  id: serial("id").primaryKey(),
  batchId: int("batch_id").notNull(),
  productId: int("product_id").notNull(),
  warehouseId: int("warehouse_id").notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 2 }).notNull(),
});

export const productionOutputs = mysqlTable("production_outputs", {
  id: serial("id").primaryKey(),
  batchId: int("batch_id").notNull(),
  productId: int("product_id").notNull(),
  warehouseId: int("warehouse_id").notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 2 }).notNull(),
  isByProduct: boolean("is_by_product").default(false),
  pricePerUnit: decimal("price_per_unit", { precision: 15, scale: 2 }).default("0"),
});

export const productionCosts = mysqlTable("production_costs", {
  id: serial("id").primaryKey(),
  batchId: int("batch_id").notNull(),
  category: mysqlEnum("category", ["Bahan Baku", "Tenaga Kerja", "Listrik", "Reparasi", "Kemasan", "Overhead", "Lainnya"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  costType: mysqlEnum("cost_type", ["direct", "indirect"]).notNull().default("direct"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales
export const sales = mysqlTable("sales", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }).notNull().unique(),
  date: date("date").notNull(),
  customerId: int("customer_id").notNull(),
  warehouseId: int("warehouse_id").notNull(),
  paymentMethod: mysqlEnum("payment_method", ["Cash", "Transfer", "Credit"]).default("Cash"),
  termDays: int("term_days").default(0),
  dueDate: date("due_date"),
  status: mysqlEnum("status", ["Draft", "Posted", "Paid", "Cancelled"]).default("Draft"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const saleItems = mysqlTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: int("sale_id").notNull(),
  productId: int("product_id").notNull(),
  batchId: int("batch_id"),
  quantity: decimal("quantity", { precision: 15, scale: 2 }).notNull(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 15, scale: 2 }).default("0"),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
});

// Fleet
export const shipments = mysqlTable("shipments", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }).notNull().unique(),
  date: date("date").notNull(),
  saleId: int("sale_id"),
  vehicleId: int("vehicle_id").notNull(),
  driverId: int("driver_id").notNull(),
  destination: text("destination"),
  kmStart: decimal("km_start", { precision: 12, scale: 2 }).default("0"),
  kmEnd: decimal("km_end", { precision: 12, scale: 2 }).default("0"),
  distance: decimal("distance", { precision: 12, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["Draft", "Disiapkan", "Berangkat", "Dalam Perjalanan", "Sampai", "Selesai", "Dibatalkan"]).default("Draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fuelTransactions = mysqlTable("fuel_transactions", {
  id: serial("id").primaryKey(),
  shipmentId: int("shipment_id"),
  vehicleId: int("vehicle_id").notNull(),
  date: date("date").notNull(),
  kmStart: decimal("km_start", { precision: 12, scale: 2 }).default("0"),
  kmEnd: decimal("km_end", { precision: 12, scale: 2 }).default("0"),
  liters: decimal("liters", { precision: 12, scale: 2 }).notNull(),
  pricePerLiter: decimal("price_per_liter", { precision: 15, scale: 2 }).notNull(),
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shipmentCosts = mysqlTable("shipment_costs", {
  id: serial("id").primaryKey(),
  shipmentId: int("shipment_id").notNull(),
  category: mysqlEnum("category", ["Solar", "Sopir", "Tol", "Parkir", "Servis", "Ban", "Oli", "Reparasi", "Pajak", "Asuransi", "Lainnya"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Finance
export const expenses = mysqlTable("expenses", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }),
  date: date("date").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cashTransactions = mysqlTable("cash_transactions", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }),
  date: date("date").notNull(),
  type: mysqlEnum("type", ["IN", "OUT"]).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const receivablePayments = mysqlTable("receivable_payments", {
  id: serial("id").primaryKey(),
  saleId: int("sale_id").notNull(),
  date: date("date").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payablePayments = mysqlTable("payable_payments", {
  id: serial("id").primaryKey(),
  purchaseId: int("purchase_id").notNull(),
  date: date("date").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Settings
export const companySettings = mysqlTable("company_settings", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  permitNumber: varchar("permit_number", { length: 100 }),
  permitDate: date("permit_date"),
  logo: varchar("logo", { length: 255 }),
  updatedAt: timestamp("updated_at").onUpdateNow(),
});

export const documentSequences = mysqlTable("document_sequences", {
  id: serial("id").primaryKey(),
  docType: varchar("doc_type", { length: 50 }).notNull().unique(),
  prefix: varchar("prefix", { length: 20 }).notNull(),
  pattern: varchar("pattern", { length: 100 }).notNull(),
  lastNumber: int("last_number").notNull().default(0),
  period: varchar("period", { length: 6 }),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: int("user_id"),
  username: varchar("username", { length: 255 }),
  module: varchar("module", { length: 100 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  recordId: int("record_id"),
  oldData: text("old_data"),
  newData: text("new_data"),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});
