"use server";

import { db } from "@/db";
import { shipments, shipmentCosts, fuelTransactions, vehicles, drivers, sales } from "@/db/schema";
import { eq, desc, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getShipmentsPaginated(page: number, limit: number, search?: string) {
  const offset = (page - 1) * limit;
  const whereCond = search ? like(shipments.number, `%${search}%`) : undefined;
  const data = await db
    .select({
      id: shipments.id,
      number: shipments.number,
      date: shipments.date,
      status: shipments.status,
      destination: shipments.destination,
      vehicleName: vehicles.policeNumber,
      driverName: drivers.name,
      distance: shipments.distance,
    })
    .from(shipments)
    .leftJoin(vehicles, eq(shipments.vehicleId, vehicles.id))
    .leftJoin(drivers, eq(shipments.driverId, drivers.id))
    .where(whereCond)
    .orderBy(desc(shipments.id))
    .limit(limit)
    .offset(offset);
  const all = await db.select().from(shipments).where(whereCond);
  return { data, total: all.length };
}

export async function getShipmentById(id: number) {
  const rows = await db.select().from(shipments).where(eq(shipments.id, id)).limit(1);
  if (rows.length === 0) return null;
  const costs = await db.select().from(shipmentCosts).where(eq(shipmentCosts.shipmentId, id));
  const fuel = await db.select().from(fuelTransactions).where(eq(fuelTransactions.shipmentId, id));
  return { ...rows[0], costs, fuel };
}

export async function createShipment(data: {
  number: string;
  date: string;
  saleId?: number | null;
  vehicleId: number;
  driverId: number;
  destination?: string;
  kmStart: number;
  kmEnd: number;
  status?: string;
  costs: { category: string; name: string; amount: number }[];
  fuel?: { liters: number; pricePerLiter: number } | null;
}) {
  const distance = data.kmEnd - data.kmStart;
  await db.transaction(async (tx) => {
    const [res] = await tx.insert(shipments).values({
      number: data.number,
      date: new Date(data.date),
      saleId: data.saleId ?? null,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      destination: data.destination,
      kmStart: String(data.kmStart),
      kmEnd: String(data.kmEnd),
      distance: String(distance),
      status: (data.status as any) ?? "Draft",
    });
    const shipmentId = Number(res.insertId);

    for (const c of data.costs) {
      await tx.insert(shipmentCosts).values({
        shipmentId,
        category: c.category as any,
        name: c.name,
        amount: String(c.amount),
      });
    }

    if (data.fuel && data.fuel.liters > 0) {
      await tx.insert(fuelTransactions).values({
        shipmentId,
        vehicleId: data.vehicleId,
        date: new Date(data.date),
        liters: String(data.fuel.liters),
        pricePerLiter: String(data.fuel.pricePerLiter),
        total: String(data.fuel.liters * data.fuel.pricePerLiter),
      });
    }
  });
  revalidatePath("/fleet");
}

export async function getFuelTransactions() {
  return await db
    .select({
      id: fuelTransactions.id,
      date: fuelTransactions.date,
      vehicleName: vehicles.policeNumber,
      liters: fuelTransactions.liters,
      pricePerLiter: fuelTransactions.pricePerLiter,
      total: fuelTransactions.total,
    })
    .from(fuelTransactions)
    .leftJoin(vehicles, eq(fuelTransactions.vehicleId, vehicles.id))
    .orderBy(desc(fuelTransactions.id))
    .limit(100);
}

export async function getShipmentCosts() {
  return await db
    .select({
      id: shipmentCosts.id,
      category: shipmentCosts.category,
      name: shipmentCosts.name,
      amount: shipmentCosts.amount,
      shipmentNumber: shipments.number,
    })
    .from(shipmentCosts)
    .leftJoin(shipments, eq(shipmentCosts.shipmentId, shipments.id))
    .orderBy(desc(shipmentCosts.id))
    .limit(100);
}
