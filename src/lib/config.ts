import { env } from "cloudflare:workers";

export const bakery = {
  bakerName: env.BAKER_NAME || "Zacharie Zion",
  village: env.BAKERY_VILLAGE || "Lacapelle-Cabanac",
  region: env.BAKERY_REGION || "Lot",
  openingWindow: "17 h a 18 h 30",
  openingDays: [
    "Lundi soir",
    "Jeudi soir"
  ],
  cashOnlyLabel: "Paiement sur place en especes uniquement"
};

export const shopTimeZone = env.SHOP_TZ || "Europe/Paris";

export const reservationRules = {
  monday: {
    orderDay: 0,
    orderDayLabel: "dimanche",
    pickupDayLabel: "lundi"
  },
  thursday: {
    orderDay: 3,
    orderDayLabel: "mercredi",
    pickupDayLabel: "jeudi"
  }
};

export const adminCookieName = "zl_admin";
