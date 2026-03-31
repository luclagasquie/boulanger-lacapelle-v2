import type { APIRoute } from "astro";
import { adminCookieName } from "../../../../lib/config";
import { isAdminAuthenticated } from "../../../../lib/admin";
import { isDatabaseConfigured, listOrdersForPickupDate } from "../../../../lib/db";

function escapeCsvCell(value: string | number) {
  const text = String(value);
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function formatAmountForCsv(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function formatCreatedAtForCsv(createdAt: string) {
  const iso = createdAt.includes("T") ? createdAt : createdAt.replace(" ", "T");
  const parsed = new Date(`${iso}Z`);

  if (Number.isNaN(parsed.getTime())) {
    return createdAt;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Paris"
  }).format(parsed);
}

export const GET: APIRoute = async ({ cookies, request, url }) => {
  if (!isAdminAuthenticated(cookies.get(adminCookieName)?.value)) {
    return Response.redirect(new URL("/admin?status=auth", url), 303);
  }

  if (!isDatabaseConfigured()) {
    return Response.redirect(new URL("/admin?status=storage", url), 303);
  }

  const pickupDate = new URL(request.url).searchParams.get("pickup")?.trim() || "";

  if (!pickupDate) {
    return Response.redirect(new URL("/admin?status=invalid", url), 303);
  }

  const orders = await listOrdersForPickupDate(pickupDate);
  const rows = [
    [
      "Date retrait",
      "Libelle retrait",
      "Commande ID",
      "Commande passee le",
      "Prenom",
      "Nom",
      "Telephone",
      "Produits",
      "Nombre de pains",
      "Total EUR"
    ],
    ...orders.map((order) => [
      order.pickup_date,
      order.pickup_label,
      order.id,
      formatCreatedAtForCsv(order.created_at),
      order.customer_first_name,
      order.customer_last_name,
      order.phone,
      order.items.map((item) => `${item.quantity} x ${item.product_title} (${item.weight_grams} g)`).join(" | "),
      order.items.reduce((sum, item) => sum + item.quantity, 0),
      formatAmountForCsv(order.total_cents)
    ])
  ];

  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsvCell).join(";")).join("\r\n")}`;
  const safeDate = pickupDate.replace(/[^0-9-]/g, "") || "selection";

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="commandes-${safeDate}.csv"`,
      "Cache-Control": "no-store"
    }
  });
};
