import { shopTimeZone } from "./config";

type PickupWindow = {
  orderDay: number;
  orderDayLabel: string;
  pickupDayLabel: string;
  pickupDateISO: string;
  pickupDateLabel: string;
};

const forceReservationsOpenForTesting = true;

const weekdayNames: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
};

const weekdayLabels: Record<number, string> = {
  0: "dimanche",
  1: "lundi",
  2: "mardi",
  3: "mercredi",
  4: "jeudi",
  5: "vendredi",
  6: "samedi"
};

function getParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: shopTimeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    weekday: weekdayNames[values.weekday]
  };
}

export function getCurrentParisDateISO(date = new Date()) {
  const parts = getParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function addDays(isoDate: string, days: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
}

export function formatPickupDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(date);
}

function nextOrderingDayLabel(today: number) {
  const options = [0, 3];
  for (const day of options) {
    if (day > today) {
      return weekdayLabels[day];
    }
  }
  return "dimanche";
}

export function getActivePickupWindow(date = new Date()): PickupWindow | null {
  const parts = getParts(date);
  const todayISO = getCurrentParisDateISO(date);

  if (forceReservationsOpenForTesting) {
    const pickupDateISO = addDays(todayISO, 1);
    const nextDate = new Date(`${pickupDateISO}T12:00:00Z`);
    const nextWeekday = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      weekday: "short"
    }).format(nextDate);

    return {
      orderDay: parts.weekday,
      orderDayLabel: weekdayLabels[parts.weekday],
      pickupDayLabel: weekdayLabels[weekdayNames[nextWeekday]],
      pickupDateISO,
      pickupDateLabel: formatPickupDate(pickupDateISO)
    };
  }

  if (parts.weekday === 0) {
    const pickupDateISO = addDays(todayISO, 1);
    return {
      orderDay: 0,
      orderDayLabel: "dimanche",
      pickupDayLabel: "lundi",
      pickupDateISO,
      pickupDateLabel: formatPickupDate(pickupDateISO)
    };
  }

  if (parts.weekday === 3) {
    const pickupDateISO = addDays(todayISO, 1);
    return {
      orderDay: 3,
      orderDayLabel: "mercredi",
      pickupDayLabel: "jeudi",
      pickupDateISO,
      pickupDateLabel: formatPickupDate(pickupDateISO)
    };
  }

  return null;
}

export function getReservationContext(date = new Date()) {
  const parts = getParts(date);
  const activeWindow = getActivePickupWindow(date);
  const nextDayLabel = nextOrderingDayLabel(parts.weekday);

  return {
    todayLabel: weekdayLabels[parts.weekday],
    isOpen: Boolean(activeWindow),
    activeWindow,
    statusMessage: activeWindow
      ? forceReservationsOpenForTesting
        ? `Mode test actif: les reservations sont temporairement ouvertes tous les jours pour un retrait le ${activeWindow.pickupDateLabel}.`
        : `Les reservations en ligne sont ouvertes aujourd'hui pour le retrait du ${activeWindow.pickupDateLabel}.`
      : `Les reservations en ligne sont fermees aujourd'hui. Elles ouvrent le dimanche pour le lundi et le mercredi pour le jeudi. Prochaine ouverture: ${nextDayLabel}.`
  };
}
