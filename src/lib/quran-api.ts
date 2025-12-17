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
  audio?: Audio;
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

export interface Translation {
  resource_id: number;
  text: string;
}

export interface Audio {
  url: string;
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

// Fetch verses of a surah with translations
export const fetchVerses = async (
  surahNumber: number,
  translationId: number = 131, // Default: Sahih International
  page: number = 1,
  perPage: number = 50
): Promise<{ verses: Verse[]; pagination: any }> => {
  try {
    const response = await fetch(
      `${BASE_URL}/verses/by_chapter/${surahNumber}?language=en&words=true&translations=${translationId}&page=${page}&per_page=${perPage}&fields=text_uthmani`
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

// Fetch audio for a verse
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

// Fetch chapter audio
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
