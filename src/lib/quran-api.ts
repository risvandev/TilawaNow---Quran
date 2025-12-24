// Quran.com API Types and Utilities

export interface Surah {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: {
    language_name: string;
    name: string;
  };
}

export interface Word {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: string;
  text_uthmani: string;
  text_imlaei?: string;
  translation?: {
    text: string;
    language_name: string;
  };
  transliteration?: {
    text: string;
    language_name: string;
  };
}

export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  hizb_number: number;
  rub_el_hizb_number: number;
  ruku_number: number;
  manzil_number: number;
  sajdah_number: number | null;
  page_number: number;
  juz_number: number;
  text_uthmani: string;
  text_imlaei?: string;
  words?: Word[];
  translations?: Translation[];
  audio?: {
    url: string;
    segments?: number[][];
  };
}

export interface Translation {
  resource_id: number;
  text: string;
}

export interface Reciter {
  id: number;
  reciter_name: string;
  style: string | null;
  translated_name: {
    name: string;
    language_name: string;
  };
}

export interface AudioFile {
  url: string;
  segments?: number[][];
}

const BASE_URL = "https://api.quran.com/api/v4";

// Fetch all surahs
export const fetchSurahs = async (): Promise<Surah[]> => {
  try {
    const response = await fetch(`${BASE_URL}/chapters`);
    const data = await response.json();
    return data.chapters;
  } catch (error) {
    console.error("Error fetching surahs:", error);
    return [];
  }
};

// Fetch single surah details
export const fetchSurah = async (surahNumber: number): Promise<Surah | null> => {
  try {
    const response = await fetch(`${BASE_URL}/chapters/${surahNumber}`);
    const data = await response.json();
    return data.chapter;
  } catch (error) {
    console.error("Error fetching surah:", error);
    return null;
  }
};

// Fetch surah info (context/summary)
export const fetchSurahInfo = async (surahNumber: number): Promise<any | null> => {
  try {
    const response = await fetch(`${BASE_URL}/chapters/${surahNumber}/info`);
    const data = await response.json();
    return data.chapter_info;
  } catch (error) {
    console.error("Error fetching surah info:", error);
    return null;
  }
};

// Fetch verses of a surah with translations and word data
export const fetchVerses = async (
  surahNumber: number,
  translationId: number = 20,
  page: number = 1,
  perPage: number = 50,
  script: string = "text_uthmani" // 'text_uthmani' | 'text_indopak' | 'text_imlaei'
): Promise<{ verses: Verse[]; pagination: any }> => {
  try {
    // Fetch verses with word-by-word translation and verse translations
    // Ensure we request the specific script field for both words and verses
    const scriptField = script === "text_indopak" ? "text_indopak" : "text_uthmani";
    const response = await fetch(
      `${BASE_URL}/verses/by_chapter/${surahNumber}?language=en&words=true&word_fields=${scriptField}&translations=${translationId}&fields=${scriptField}&per_page=${perPage}&page=${page}`
    );
    const data = await response.json();
    return {
      verses: data.verses,
      pagination: data.pagination,
    };
  } catch (error) {
    console.error("Error fetching verses:", error);
    return { verses: [], pagination: null };
  }
};

// Fetch audio for a specific verse
export const fetchVerseAudio = async (
  verseKey: string,
  reciterId: number = 7 // Default: Mishary Rashid Alafasy
): Promise<string | null> => {
  try {
    const response = await fetch(
      `${BASE_URL}/recitations/${reciterId}/by_ayah/${verseKey}`
    );
    const data = await response.json();
    if (data.audio_files && data.audio_files.length > 0) {
      return `https://verses.quran.com/${data.audio_files[0].url}`;
    }
    return null;
  } catch (error) {
    console.error("Error fetching verse audio:", error);
    return null;
  }
};

// Fetch single verse by key (e.g., "1:1")
export const fetchSingleVerse = async (
  verseKey: string,
  translationId: number = 20
): Promise<Verse | null> => {
  try {
    const response = await fetch(
      `${BASE_URL}/verses/by_key/${verseKey}?language=en&words=true&translations=${translationId}&fields=text_uthmani`
    );
    const data = await response.json();
    return data.verse;
  } catch (error) {
    console.error("Error fetching single verse:", error);
    return null;
  }
};

// Fetch all verse audios for a chapter
export const fetchChapterVerseAudios = async (
  surahNumber: number,
  reciterId: number = 7 // Default to Mishary
): Promise<Map<string, { url: string; segments: number[][] }>> => {
  const audioMap = new Map<string, { url: string; segments: number[][] }>();
  try {
    const response = await fetch(
      `${BASE_URL}/recitations/${reciterId}/by_chapter/${surahNumber}?per_page=300&segments=true`
    );
    const data = await response.json();
    console.log(`[AudioFetch] Loaded for ${surahNumber} Reciter ${reciterId}. Files: ${data.audio_files?.length}`);
    if (data.audio_files && data.audio_files.length > 0) {
      console.log(`[AudioFetch] Sample Segments for first verse (${data.audio_files[0].verse_key}):`, data.audio_files[0].segments);
    }
    if (data.audio_files) {
      data.audio_files.forEach((file: { verse_key: string; url: string; segments: number[][] }) => {
        audioMap.set(file.verse_key, {
          url: `https://verses.quran.com/${file.url}`,
          segments: file.segments
        });
      });
    }
  } catch (error) {
    console.error("Error fetching chapter verse audios:", error);
  }
  return audioMap;
};

// Fetch chapter audio (full surah)
export const fetchChapterAudio = async (
  surahNumber: number,
  reciterId: number = 7
): Promise<string | null> => {
  try {
    const response = await fetch(
      `${BASE_URL}/chapter_recitations/${reciterId}/${surahNumber}`
    );
    const data = await response.json();
    return data.audio_file?.audio_url || null;
  } catch (error) {
    console.error("Error fetching chapter audio:", error);
    return null;
  }
};

// Fetch reciters list
export const fetchReciters = async (): Promise<Reciter[]> => {
  try {
    const response = await fetch(`${BASE_URL}/resources/recitations`);
    const data = await response.json();
    return data.recitations;
  } catch (error) {
    console.error("Error fetching reciters:", error);
    return [];
  }
};

// Fetch available translations
export const fetchTranslations = async () => {
  try {
    const response = await fetch(`${BASE_URL}/resources/translations`);
    const data = await response.json();
    return data.translations;
  } catch (error) {
    console.error("Error fetching translations:", error);
    return [];
  }
};

// Search verses
export const searchVerses = async (
  query: string,
  size: number = 10,
  page: number = 1
) => {
  try {
    const response = await fetch(
      `${BASE_URL}/search?q=${encodeURIComponent(query)}&size=${size}&page=${page}`
    );
    const data = await response.json();
    return data.search;
  } catch (error) {
    console.error("Error searching verses:", error);
    return { results: [], total_results: 0 };
  }
};

// Core Reciters with known good segment data
// IDs based on Quran.com API v4
export const AVAILABLE_RECITERS = [
  { id: 7, name: "Mishary Rashid Alafasy (Default)", style: "Murattal" },
  { id: 1, name: "Mahmoud Khalil Al-Husary", style: "Murattal" },
  { id: 2, name: "AbdulBaset AbdulSamad", style: "Murattal" },
  { id: 4, name: "Abu Bakr al-Shatri", style: "Murattal" },
  { id: 3, name: "Abdur-Rahman as-Sudais", style: "Murattal" },
  { id: 5, name: "Hani Ar-Rifai", style: "Murattal" },
  { id: 10, name: "Saud Al-Shuraim", style: "Murattal" },
  { id: 9, name: "Mohamed Siddiq Al-Minshawi", style: "Murattal" },
];

export const getPreferredReciterId = (): number => {
  const saved = localStorage.getItem("reciterId");
  return saved ? parseInt(saved, 10) : 7; // Default to Mishary Rashid Alafasy (ID 7)
};

// Quran Statistics
export const QURAN_STATS = {
  totalAyahs: 6236,
  totalSurahs: 114,
  totalJuz: 30,
  totalPages: 604,
  totalWords: 77430,
  totalLetters: 323671,
};

// Popular Surahs for quick access
export const POPULAR_SURAHS = [
  { number: 1, name: "Al-Fatihah", arabicName: "الفاتحة", verses: 7 },
  { number: 18, name: "Al-Kahf", arabicName: "الكهف", verses: 110 },
  { number: 36, name: "Ya-Sin", arabicName: "يس", verses: 83 },
  { number: 55, name: "Ar-Rahman", arabicName: "الرحمن", verses: 78 },
  { number: 56, name: "Al-Waqi'ah", arabicName: "الواقعة", verses: 96 },
  { number: 67, name: "Al-Mulk", arabicName: "الملك", verses: 30 },
];

// Translation options with languages
export const TRANSLATIONS = [
  // English
  { id: "20", name: "Saheeh International", language: "English" },
  { id: "85", name: "Abdul Haleem", language: "English" },
  { id: "203", name: "Mustafa Khattab (Clear Quran)", language: "English" },
  { id: "84", name: "Mufti Taqi Usmani", language: "English" },
  { id: "95", name: "Dr. Ghali", language: "English" },
  { id: "22", name: "Pickthall", language: "English" },
  { id: "19", name: "Yusuf Ali", language: "English" },

  // Arabic
  { id: "78", name: "Tafsir Al-Muyassar", language: "Arabic" },
  { id: "91", name: "Tafsir Al-Waseet", language: "Arabic" },

  // Urdu
  { id: "97", name: "Fateh Muhammad Jalandhry", language: "Urdu" },
  { id: "234", name: "Abul Ala Maududi", language: "Urdu" },

  // Bengali
  { id: "161", name: "Muhiuddin Khan", language: "Bengali" },
  { id: "163", name: "Taisirul Quran", language: "Bengali" },

  // Indonesian
  { id: "33", name: "Indonesian Ministry of Religious Affairs", language: "Indonesian" },

  // Turkish
  { id: "77", name: "Diyanet İşleri", language: "Turkish" },
  { id: "112", name: "Elmalılı Hamdi Yazır", language: "Turkish" },

  // French
  { id: "31", name: "Muhammad Hamidullah", language: "French" },
  { id: "136", name: "Rashid Maash", language: "French" },

  // German
  { id: "27", name: "Bubenheim & Elyas", language: "German" },

  // Spanish
  { id: "140", name: "Isa Garcia", language: "Spanish" },

  // Russian
  { id: "45", name: "Elmir Kuliev", language: "Russian" },
  { id: "79", name: "Abu Adel", language: "Russian" },

  // Persian/Farsi
  { id: "29", name: "Ayatollah Makarem Shirazi", language: "Persian" },

  // Malay
  { id: "39", name: "Abdullah Muhammad Basmeih", language: "Malay" },

  // Hindi
  { id: "122", name: "Suhel Farooq Khan", language: "Hindi" },

  // Tamil
  { id: "229", name: "Jan Trust Foundation", language: "Tamil" },

  // Chinese
  { id: "109", name: "Ma Jian", language: "Chinese" },

  // Japanese
  { id: "35", name: "Japanese Translation", language: "Japanese" },

  // Korean
  { id: "219", name: "Korean Translation", language: "Korean" },

  // Portuguese
  { id: "43", name: "Samir El-Hayek", language: "Portuguese" },

  // Italian
  { id: "153", name: "Hamza Roberto Piccardo", language: "Italian" },

  // Dutch
  { id: "144", name: "Salomo Keyzer", language: "Dutch" },

  // Somali
  { id: "46", name: "Abdullahi Yusuf Ali", language: "Somali" },

  // Swahili
  { id: "48", name: "Ali Muhsin Al-Barwani", language: "Swahili" },

  // Thai
  { id: "211", name: "Thai Translation", language: "Thai" },

  // Vietnamese
  { id: "220", name: "Hasan Abdul-Karim", language: "Vietnamese" },

  // Malayalam
  { id: "37", name: "Cheriyamundam Abdul Hameed", language: "Malayalam" },
  { id: "80", name: "Muhammed Karakunnu", language: "Malayalam" },
];

// Group translations by language
export const getTranslationsByLanguage = () => {
  const grouped: { [key: string]: typeof TRANSLATIONS } = {};
  TRANSLATIONS.forEach((t) => {
    if (!grouped[t.language]) {
      grouped[t.language] = [];
    }
    grouped[t.language].push(t);
  });
  return grouped;
};
