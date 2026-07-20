import { cookies } from "next/headers";

export type Locale = "so" | "en" | "ar";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get("kireeye-language")?.value;
  return value === "en" || value === "ar" ? value : "so";
}

export const publicTranslations = {
  so: {
    vehicles: "Gaadiid", cities: "Magaalooyin", partners: "Shirkadaha", about: "Nagu saabsan", signin: "Soo gal", signup: "Isdiiwaangeli",
    region: "Somaliland & Soomaaliya", hero: "Gaadhiga saxda ah, goob kasta, goor kasta.", heroBody: "Ka hel gaadhi la hubo Hargeysa, Muqdisho iyo garoomada diyaaradaha. Dooro darawal leh ama darawal la’aan, saacad, maalin ama safar magaalo kale.",
    verified: "Marketplace la xaqiijiyey", trust: "Safarkaaga ka bilow kalsooni.", cars: "Gaadiid la xaqiijiyey", pickup: "Goobta laga qaadanayo", pickupDate: "Taariikhda qaadashada", returnDate: "Taariikhda celinta", rentalType: "Nooca kirada", search: "Raadi gaadhi",
    popular: "Ugu caansan", mostRented: "Gaadiidka loogu kiraysiga badan yahay", viewAll: "Dhammaan eeg", locations: "Goobaha", chooseCity: "Ka raadi magaaladaada", available: "Gaadiid diyaar ah", daily: "Maalinle", hourly: "Saacadle", intercity: "Safar magaalo kale", airport: "Airport pickup"
  },
  en: {
    vehicles: "Vehicles", cities: "Cities", partners: "Partners", about: "About us", signin: "Sign in", signup: "Create account",
    region: "Somaliland & Somalia", hero: "The right car, anywhere, anytime.", heroBody: "Find a trusted vehicle in Hargeisa, Mogadishu and at the airports. Choose a vehicle with a driver or self-drive, by the hour, day or for an intercity trip.",
    verified: "Verified marketplace", trust: "Start your journey with confidence.", cars: "Verified vehicles", pickup: "Pickup location", pickupDate: "Pickup date", returnDate: "Return date", rentalType: "Rental type", search: "Find a car",
    popular: "Popular", mostRented: "Most rented vehicles", viewAll: "View all", locations: "Locations", chooseCity: "Find a car in your city", available: "Vehicles available", daily: "Daily", hourly: "Hourly", intercity: "Intercity trip", airport: "Airport pickup"
  },
  ar: {
    vehicles: "السيارات", cities: "المدن", partners: "الشركاء", about: "من نحن", signin: "تسجيل الدخول", signup: "إنشاء حساب",
    region: "صوماليلاند والصومال", hero: "السيارة المناسبة، في أي مكان، وفي أي وقت.", heroBody: "اعثر على سيارة موثوقة في هرجيسا ومقديشو والمطارات. اختر سيارة مع سائق أو بدون سائق، بالساعة أو اليوم أو لرحلة بين المدن.",
    verified: "سوق موثّق", trust: "ابدأ رحلتك بثقة.", cars: "سيارات موثّقة", pickup: "مكان الاستلام", pickupDate: "تاريخ الاستلام", returnDate: "تاريخ الإرجاع", rentalType: "نوع الإيجار", search: "ابحث عن سيارة",
    popular: "الأكثر شيوعاً", mostRented: "السيارات الأكثر استئجاراً", viewAll: "عرض الكل", locations: "المواقع", chooseCity: "ابحث في مدينتك", available: "سيارات متاحة", daily: "يومي", hourly: "بالساعة", intercity: "رحلة بين المدن", airport: "استلام من المطار"
  }
} as const;
