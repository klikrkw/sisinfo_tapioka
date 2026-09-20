import "dotenv/config";
import { db } from "./index";
import {
  suppliers,
  products,
  warehouses,
  customers,
  vehicles,
  drivers,
  deductionTypes,
  purchases,
  stockMovements,
} from "./schema";
import { sql } from "drizzle-orm";
import {
  calculatePurchaseWeight,
  calculatePurchaseAmount,
} from "@/lib/calculations/purchasing";

async function main() {
  const existingWarehouses = await db.select().from(warehouses);
  const existingProducts = await db.select().from(products);
  const existingSuppliers = await db.select().from(suppliers);

  if (existingWarehouses.length === 0) {
    await db.insert(warehouses).values([
      { code: "WH-001", name: "Gudang Ketela", type: "Bahan Baku" },
      { code: "WH-002", name: "Gudang Produksi", type: "Produksi" },
      { code: "WH-003", name: "Gudang Tepung", type: "Produk Jadi" },
      { code: "WH-004", name: "Gudang Kemasan", type: "Kemasan" },
    ]);
  }

  if (existingProducts.length === 0) {
    await db.insert(products).values([
      {
        code: "BB-001",
        name: "Ketela Segar",
        type: "RAW_MATERIAL",
        unit: "Kg",
        defaultPrice: "1500",
      },
      {
        code: "BB-002",
        name: "Ketela Grade A",
        type: "RAW_MATERIAL",
        unit: "Kg",
        defaultPrice: "1700",
      },
      {
        code: "BB-003",
        name: "Ketela Grade B",
        type: "RAW_MATERIAL",
        unit: "Kg",
        defaultPrice: "1400",
      },
      {
        code: "FG-001",
        name: "Tepung Tapioka",
        type: "FINISHED_GOOD",
        unit: "Kg",
        defaultPrice: "10000",
      },
      {
        code: "BP-001",
        name: "Ampas Tapioka",
        type: "BY_PRODUCT",
        unit: "Kg",
        defaultPrice: "500",
      },
      {
        code: "PK-001",
        name: "Sak Kemasan 50Kg",
        type: "PACKAGING",
        unit: "Sak",
        defaultPrice: "3500",
      },
    ]);
  }

  if (existingSuppliers.length === 0) {
    await db.insert(suppliers).values([
      {
        code: "SUP-001",
        name: "Bapak Sukarya",
        type: "Petani",
        phone: "081234567801",
        address: "Desa Sukamaju",
      },
      {
        code: "SUP-002",
        name: "Pengepul Tani Jaya",
        type: "Pengepul",
        phone: "081234567802",
        address: "Kec. Cibadak",
      },
      {
        code: "SUP-003",
        name: "CV Ketela Makmur",
        type: "Distributor",
        phone: "081234567803",
        address: "Kab. Subang",
      },
      {
        code: "SUP-004",
        name: "Bapak Warsito",
        type: "Petani",
        phone: "081234567804",
        address: "Desa Mekarsari",
      },
      {
        code: "SUP-005",
        name: "Kelompok Tani Sumber Rejeki",
        type: "Petani",
        phone: "081234567805",
        address: "Desa Cikarang",
      },
    ]);
  }

  const existingCustomers = await db.select().from(customers);
  if (existingCustomers.length === 0) {
    await db.insert(customers).values([
      {
        code: "CUS-001",
        name: "PT Pangan Nusantara",
        phone: "0217770001",
        address: "Jakarta",
        creditLimit: "50000000",
        termDays: 30,
      },
      {
        code: "CUS-002",
        name: "UD Berkah Jaya",
        phone: "0217770002",
        address: "Bandung",
        creditLimit: "20000000",
        termDays: 14,
      },
      {
        code: "CUS-003",
        name: "Toko Sembako Sejahtera",
        phone: "0217770003",
        address: "Cirebon",
        creditLimit: "10000000",
        termDays: 7,
      },
    ]);
  }

  const existingVehicles = await db.select().from(vehicles);
  if (existingVehicles.length === 0) {
    await db.insert(vehicles).values([
      {
        code: "TRK-001",
        policeNumber: "B 9123 KTA",
        brand: "Hino",
        type: "Truk Engkel",
        capacity: "8000",
        ownership: "Milik Sendiri",
      },
      {
        code: "TRK-002",
        policeNumber: "B 9876 KTB",
        brand: "Mitsubishi",
        type: "Truk Fuso",
        capacity: "15000",
        ownership: "Milik Sendiri",
      },
      {
        code: "TRK-003",
        policeNumber: "B 9345 KTC",
        brand: "Isuzu",
        type: "Truk Engkel",
        capacity: "7000",
        ownership: "Sewa",
      },
    ]);
  }

  const existingDrivers = await db.select().from(drivers);
  if (existingDrivers.length === 0) {
    await db.insert(drivers).values([
      {
        code: "DRV-001",
        name: "Slamet Riyadi",
        phone: "081300000001",
        licenseNumber: "SIM-A-001",
        licenseType: "A",
      },
      {
        code: "DRV-002",
        name: "Budi Santoso",
        phone: "081300000002",
        licenseNumber: "SIM-A-002",
        licenseType: "A",
      },
      {
        code: "DRV-003",
        name: "Agus Setiawan",
        phone: "081300000003",
        licenseNumber: "SIM-B1-003",
        licenseType: "B1",
      },
    ]);
  }

  const existingDeductions = await db.select().from(deductionTypes);
  if (existingDeductions.length === 0) {
    await db.insert(deductionTypes).values([
      {
        code: "DED-PIK",
        name: "Pikulan",
        calculationType: "per_kg",
        defaultValue: "100",
        impactType: "SUPPLIER_DEDUCTION",
      },
      {
        code: "DED-ANG",
        name: "Angkat Panggul",
        calculationType: "per_kg",
        defaultValue: "50",
        impactType: "SUPPLIER_DEDUCTION",
      },
      {
        code: "DED-TRN",
        name: "Transport",
        calculationType: "fixed",
        defaultValue: "100000",
        impactType: "PURCHASE_COST",
      },
      {
        code: "DED-KTR",
        name: "Potongan Kotoran",
        calculationType: "percentage",
        defaultValue: "1",
        impactType: "SUPPLIER_DEDUCTION",
      },
    ]);
  }

  const existingPurchases = await db.select().from(purchases);
  if (existingPurchases.length === 0) {
    const wh = (await db.select().from(warehouses))[0];
    const rawMaterial = (
      await db
        .select()
        .from(products)
        .where(sql`type = 'RAW_MATERIAL'`)
    )[0];
    const sup = await db.select().from(suppliers);

    const samples = [
      { gross: 10000, tare: 500, refaction: 5, price: 1500 },
      { gross: 8500, tare: 400, refaction: 4, price: 1550 },
      { gross: 12000, tare: 600, refaction: 6, price: 1480 },
      { gross: 9500, tare: 450, refaction: 5, price: 1520 },
      { gross: 11000, tare: 550, refaction: 4.5, price: 1500 },
    ];

    let runningBalance = 0;
    let counter = 1;
    for (const s of samples) {
      const w = calculatePurchaseWeight(s.gross, s.tare, s.refaction);
      const a = calculatePurchaseAmount(w.payableWeight, s.price);
      const supplier = sup[(counter - 1) % sup.length];
      const month = String(((counter - 1) % 9) + 1).padStart(2, "0");
      const number = `PB/2026/${month}/${String(counter).padStart(6, "0")}`;

      const [res] = await db.insert(purchases).values({
        number,
        date: new Date(`2026-${month}-15`),
        supplierId: supplier.id,
        rawMaterialId: rawMaterial.id,
        warehouseId: wh.id,
        grossWeight: String(s.gross),
        tareWeight: String(s.tare),
        netWeight: String(w.netWeight),
        refactionPercent: String(s.refaction),
        refactionWeight: String(w.refactionWeight),
        payableWeight: String(w.payableWeight),
        pricePerKg: String(s.price),
        baseAmount: String(a.baseAmount),
        totalDeductions: "0",
        netAmount: String(a.netAmount),
        status: "Approved",
      });

      runningBalance += w.payableWeight;
      await db.insert(stockMovements).values({
        warehouseId: wh.id,
        productId: rawMaterial.id,
        type: "PURCHASE",
        referenceId: Number(res.insertId),
        qtyIn: String(w.payableWeight),
        qtyOut: "0",
        balance: String(runningBalance),
      });
      counter++;
    }
  }

  console.log("Seed demo selesai.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
