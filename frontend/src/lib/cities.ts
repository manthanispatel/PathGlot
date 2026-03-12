export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  heading: number; // initial Street View camera heading
  pitch: number;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  guideNames: string[];
  cities: City[];
}

export const LANGUAGES: Language[] = [
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    guideNames: ["Carlos", "Sofia", "Miguel"],
    cities: [
      {
        id: "madrid",
        name: "Madrid",
        country: "Spain",
        lat: 40.4153,
        lng: -3.7074,
        heading: 90,
        pitch: 0,
      },
      {
        id: "barcelona",
        name: "Barcelona",
        country: "Spain",
        lat: 41.3851,
        lng: 2.1734,
        heading: 180,
        pitch: 0,
      },
      {
        id: "buenos-aires",
        name: "Buenos Aires",
        country: "Argentina",
        lat: -34.6037,
        lng: -58.3816,
        heading: 45,
        pitch: 0,
      },
    ],
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    guideNames: ["Pierre", "Amélie", "Jean-Luc"],
    cities: [
      {
        id: "paris",
        name: "Paris",
        country: "France",
        lat: 48.8584,
        lng: 2.2945,
        heading: 90,
        pitch: 0,
      },
      {
        id: "montmartre",
        name: "Montmartre",
        country: "France",
        lat: 48.8867,
        lng: 2.3431,
        heading: 120,
        pitch: 5,
      },
      {
        id: "montreal",
        name: "Montréal",
        country: "Canada",
        lat: 45.5017,
        lng: -73.5673,
        heading: 60,
        pitch: 0,
      },
    ],
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    guideNames: ["Hans", "Greta", "Klaus"],
    cities: [
      {
        id: "berlin",
        name: "Berlin",
        country: "Germany",
        lat: 52.5163,
        lng: 13.3777,
        heading: 270,
        pitch: 0,
      },
      {
        id: "vienna",
        name: "Vienna",
        country: "Austria",
        lat: 48.2082,
        lng: 16.3738,
        heading: 90,
        pitch: 0,
      },
    ],
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    guideNames: ["Yuki", "Hana", "Kenji"],
    cities: [
      {
        id: "tokyo-shibuya",
        name: "Tokyo (Shibuya)",
        country: "Japan",
        lat: 35.6596,
        lng: 139.7006,
        heading: 0,
        pitch: 0,
      },
      {
        id: "osaka",
        name: "Osaka",
        country: "Japan",
        lat: 34.6937,
        lng: 135.5023,
        heading: 180,
        pitch: 0,
      },
    ],
  },
  {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    guideNames: ["Marco", "Giulia", "Luca"],
    cities: [
      {
        id: "rome",
        name: "Rome",
        country: "Italy",
        lat: 41.8902,
        lng: 12.4922,
        heading: 180,
        pitch: 0,
      },
      {
        id: "florence",
        name: "Florence",
        country: "Italy",
        lat: 43.7696,
        lng: 11.2558,
        heading: 90,
        pitch: 0,
      },
    ],
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇵🇹",
    guideNames: ["João", "Ana", "Ricardo"],
    cities: [
      {
        id: "lisbon",
        name: "Lisbon",
        country: "Portugal",
        lat: 38.7223,
        lng: -9.1393,
        heading: 90,
        pitch: 0,
      },
      {
        id: "sao-paulo",
        name: "São Paulo",
        country: "Brazil",
        lat: -23.5505,
        lng: -46.6333,
        heading: 45,
        pitch: 0,
      },
    ],
  },
];

export function getLanguage(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

export function getCity(
  languageCode: string,
  cityId: string
): City | undefined {
  return getLanguage(languageCode)?.cities.find((c) => c.id === cityId);
}
