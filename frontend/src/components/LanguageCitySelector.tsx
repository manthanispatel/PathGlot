import { useState } from "react";
import { LANGUAGES, type Language, type City } from "../lib/cities";

interface Props {
  onStart: (languageCode: string, cityId: string, guideName: string) => void;
}

export function LanguageCitySelector({ onStart }: Props) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    null
  );
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  function handleLanguageSelect(lang: Language) {
    setSelectedLanguage(lang);
    setSelectedCity(null);
  }

  function handleStart() {
    if (!selectedLanguage || !selectedCity) return;
    const guideName =
      selectedLanguage.guideNames[
        Math.floor(Math.random() * selectedLanguage.guideNames.length)
      ];
    onStart(selectedLanguage.code, selectedCity.id, guideName);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-[#0c1117] via-[#0f1a2e] to-[#0c1117]">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <svg
            className="w-10 h-10 text-brand-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">
            PathGlot
          </h1>
        </div>
        <p className="text-slate-400 text-lg max-w-md">
          Explore a foreign city via Street View while an AI guide speaks
          exclusively in your target language.
        </p>
      </div>

      {/* Language Selection */}
      <div className="w-full max-w-3xl mb-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
          1. Choose a language
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang)}
              className={`
                glass-card p-4 text-left transition-all duration-200 hover:border-brand-500/50 hover:bg-white/10 active:scale-95
                ${selectedLanguage?.code === lang.code ? "border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/20" : ""}
              `}
            >
              <div className="text-3xl mb-2">{lang.flag}</div>
              <div className="font-semibold text-white">{lang.name}</div>
              <div className="text-sm text-slate-400">{lang.nativeName}</div>
            </button>
          ))}
        </div>
      </div>

      {/* City Selection */}
      {selectedLanguage && (
        <div className="w-full max-w-3xl mb-8 animate-fade-in">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
            2. Choose a city
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {selectedLanguage.cities.map((city) => (
              <button
                key={city.id}
                onClick={() => setSelectedCity(city)}
                className={`
                  glass-card p-4 text-left transition-all duration-200 hover:border-brand-500/50 hover:bg-white/10 active:scale-95
                  ${selectedCity?.id === city.id ? "border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/20" : ""}
                `}
              >
                <div className="font-semibold text-white text-lg">
                  {city.name}
                </div>
                <div className="text-sm text-slate-400">{city.country}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {city.lat.toFixed(4)}°, {city.lng.toFixed(4)}°
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={!selectedLanguage || !selectedCity}
        className={`
          px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-200
          ${
            selectedLanguage && selectedCity
              ? "bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 active:scale-95 hover:-translate-y-0.5"
              : "bg-white/5 text-slate-600 cursor-not-allowed"
          }
        `}
      >
        {selectedLanguage && selectedCity
          ? `Start in ${selectedCity.name} →`
          : "Select a language and city"}
      </button>

      {/* Footer */}
      <p className="mt-8 text-xs text-slate-600">
        Powered by Gemini Live API · Google Maps Street View · Places API
      </p>
    </div>
  );
}
