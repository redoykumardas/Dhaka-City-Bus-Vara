// ============================================================
// STOP NORMALIZER — Links bus list stops + fare chart stops
// The bus list uses English names from dhakabusservice.com
// The fare charts use Bengali with English in parentheses
// This file is the bridge between them.
// ============================================================

/**
 * Canonical → variations mapping.
 * Key = canonical display name (used everywhere in the app).
 * Value = array of alternate spellings found in the data.
 */
const ALIASES: Record<string, string[]> = {
  "Mirpur 1": ["Mirpur-1", "মিরপুর-১", "মিরপুর-১ (Mirpur-1)", "Mirpur 1", "মিরপুর (১)"],
  "Mirpur 2": ["Mirpur-2", "মিরপুর-২"],
  "Mirpur 10": ["Mirpur-10", "মিরপুর-১০", "মিরপুর-১০ (Mirpur-10)", "মিরপুর (১০)", "মিরপুর (১০)"],
  "Mirpur 11": ["Mirpur-11", "মিরপুর-১১", "মিরপুর-১১ ১/২"],
  "Mirpur 12": ["Mirpur-12", "মিরপুর-১২", "পল্লবী (মিরপুর-১২)", "Pallabi"],
  "Mirpur 14": ["Mirpur-14", "মিরপুর (১৪)"],
  "Kalshi": ["কালশী (Kalshi)", "কালশী"],
  "Kazipara": ["কাজীপাড়া (Kazipara)", "কাজীপাড়া", "Kazipara"],
  "Shewrapara": ["শেওড়াপাড়া (Shewrapara)", "শেওড়াপাড়া", "Shewra", "শেওড়া"],
  "Farmgate": ["ফার্মগেট (Farmgate)", "ফার্মগেট"],
  "Shahbag": ["শাহবাগ (Shahbag)", "শাহবাগ"],
  "Paltan": ["পল্টন (Paltan)", "পল্টন"],
  "Gulistan": ["গুলিস্তান (Gulistan)", "গুলিস্তান", "গুলিস্তান মোড়"],
  "Mohakhali": ["মহাখালী (Mohakhali)", "মহাখালী"],
  "Gulshan 1": ["গুলশান-১ (Gulshan-1)", "গুলশান-১", "Golshan 1"],
  "Banasree": ["বনশ্রী (Banasree)", "বনশ্রী"],
  "Gabtoli": ["গাবতলী (Gabtoli)", "গাবতলী", "Gabtoli"],
  "Savar": ["সাভার (Savar)", "সাভার"],
  "Amulia Staff Quarter": ["আমুলিয়া স্টাফ কোয়ার্টার (Amulia Staff Quarter)", "আমুলিয়া স্টাফ কোয়ার্টার"],
  "Sayedabad": ["সায়দাবাদ (Sayedabad)", "সায়েদাবাদ", "Sayedabad"],
  "Jatrabari": ["যাত্রাবাড়ী (Jatrabari)", "যাত্রাবাড়ী"],
  "Signboard": ["সাইনবোর্ড (Signboard)", "সাইনবোর্ড"],
  "Kanchpur Bridge": ["কাঁচপুরব্রীজ (Kanchpur Bridge)", "কাঁচপুর ব্রীজ"],
  "Tikatuli": ["টিকাটুলি (Tikatuli)", "টিকাটুলি"],
  "Agargaon": ["আগারগাঁও (Agargaon)", "আগারগাঁও"],
  "Shyamoli": ["শ্যামলী (Shyamoli)", "শ্যামলী"],
  "Azimpur": ["আজিমপুর (Azimpur)", "আজিমপুর"],
  "Science Lab": ["সায়েন্সল্যাব (Science Lab)", "সায়েন্সল্যাব", "সাইন্সল্যাবঃ"],
  "New Market": ["নিউমার্কেট (New Market)", "নিউমার্কেট", "New Market"],
  "Nilkhet": ["নীলক্ষেত (Nilkhet)", "নীলক্ষেত"],
  "Kalabagan": ["কলাবাগান (Kalabagan)", "কলাবাগান"],
  "Asad Gate": ["আসাদগেট (Asad Gate)", "আসাদগেট", "Asad Gate"],
  "College Gate": ["কলেজগেট (College Gate)", "কলেজগেট", "কলেজগেইট"],
  "Dhanmondi 27": ["ধানমন্ডি ২৭"],
  "Dhanmondi 32": ["ধানমন্ডি ৩২"],
  "Dhanmondi": ["ধানমন্ডি (Dhanmondi)", "ধানমন্ডি"],
  "Shukrabad": ["শুক্রাবাদ (Shukrabad)", "শুক্রাবাদ"],
  "Press Club": ["প্রেসক্লাব (Press Club)", "প্রেসক্লাব", "Press Club"],
  "Kawran Bazar": ["কাওরানবাজার (Kawran Bazar)", "কাওরানবাজার", "Kawran Bazar"],
  "Bangla Motor": ["বাংলা মোটর"],
  "Bijoy Sarani": ["বিজয় সারাণী"],
  "Jahangir Gate": ["জাহাঙ্গীর গেট"],
  "Banani": ["বনানী"],
  "Airport": ["বিমানবন্দর"],
  "Khilkhet": ["খিলক্ষেত"],
  "Kuril Bishwa Road": ["কুড়িল বিশ্ব রোড"],
  "Jashimuddin": ["জসিমউদ্দিন", "Uttara"],
  "Rajlakshmi": ["রাজলক্ষ্মী"],
  "Azampur": ["আজমপুর"],
  "House Building": ["হাউজ বিল্ডিং"],
  "Abdullahpur": ["আব্দুল্লাহপুর"],
  "Tongi": ["টঙ্গী"],
  "Sadarghat": ["সদরঘাট"],
  "Babubazar": ["বাবুবাজার"],
  "Naya Bazar": ["নয়া বাজার"],
  "GPO": ["জিপিও"],
  "High Court": ["উচ্চ আদালত"],
  "Matsya Bhaban": ["মৎস্য ভবন"],
  "Kakrail": ["কাকরাইল"],
  "Shantinagar": ["শান্তিনগর"],
  "Malibagh": ["মালিবাগ"],
  "Mouchak": ["মৌচাক"],
  "Rampura Bridge": ["রামপুরা ব্রিজ", "Rampura Bazar"],
  "Badda": ["বাড্ডা"],
  "Merul Badda": ["মেরুল বাড্ডা"],
  "Uttar Badda": ["উত্তর বাড্ডা"],
  "Notun Bazar": ["নতুন বাজার"],
  "Bashundhara": ["বসুন্ধরা"],
  "Jamuna Future Park": ["যমুনা ফিউচার পার্ক"],
  "Nadda": ["নদ্দা"],
  "Shahjadpur": ["শাহজাদপুর"],
  "Bashtola": ["বাঁশতলা"],
  "Uttara": ["উত্তরা", "Uttara Diabari"],
  "Technical": ["টেকনিক্যাল"],
  "Ansar Camp": ["আনসার ক্যাম্প", "আনসারক্যাম্প"],
  "Kallyanpur": ["কল্যাণপুর"],
  "Motijheel": ["মতিঝিল", "মতিঝিল (Motijheel)"],
  "Kamlapur": ["কমলাপুর"],
  "Khilgaon": ["খিলগাও", "খিলগাও তালতলা"],
  "Basabo": ["বাসাবো"],
  "Mohammadpur": ["মোহাম্মদপুর"],
  "Shahbag": ["শাহবাগ"],
  "Bosila": ["বোসিলা"],
  "Kanchpur": ["কাঁচপুর"],
  "Sonargaon": ["সোনারগাঁও"],
  "Dhakeshwari": ["ঢাকেশ্বরী মন্দির"],
}

// Build reverse lookup: alias → canonical
const reverseMap = new Map<string, string>()
for (const [canonical, aliases] of Object.entries(ALIASES)) {
  reverseMap.set(canonical.toLowerCase().trim(), canonical)
  for (const alias of aliases) {
    reverseMap.set(alias.toLowerCase().trim(), canonical)
  }
}

/**
 * Normalize a raw stop name to its canonical form.
 * Falls back to the original string if no match found.
 */
export function normalizeStop(raw: string): string {
  const key = raw.toLowerCase().trim()
  return reverseMap.get(key) ?? toTitleCase(raw.trim())
}

function toTitleCase(s: string): string {
  return s.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
}

/** Extract English name from "Bengali (English)" patterns in fare chart data */
export function extractEnglishName(stopName: string): string {
  const match = stopName.match(/\(([^)]+)\)/)
  if (match) return match[1].trim()
  return stopName.trim()
}
