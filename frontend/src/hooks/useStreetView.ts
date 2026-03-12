import { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import type { City } from "../lib/cities";

export interface StreetViewPosition {
  lat: number;
  lng: number;
  heading: number;
  pitch: number;
  pov: google.maps.StreetViewPov;
}

interface UseStreetViewOptions {
  city: City;
  onPositionChange?: (position: StreetViewPosition) => void;
}

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

let loaderInstance: Loader | null = null;
function getMapsLoader() {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: MAPS_API_KEY,
      version: "weekly",
      libraries: ["maps", "streetView"],
    });
  }
  return loaderInstance;
}

export function useStreetView({ city, onPositionChange }: UseStreetViewOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onPositionChangeRef = useRef(onPositionChange);

  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    getMapsLoader()
      .importLibrary("streetView")
      .then(() => {
        if (cancelled || !container) return;

        const panorama = new google.maps.StreetViewPanorama(container, {
          position: { lat: city.lat, lng: city.lng },
          pov: { heading: city.heading, pitch: city.pitch },
          zoom: 1,
          addressControl: false,
          fullscreenControl: false,
          motionTracking: false,
          motionTrackingControl: false,
          showRoadLabels: true,
          clickToGo: true,
        });

        panoramaRef.current = panorama;

        panorama.addListener("position_changed", () => {
          const pos = panorama.getPosition();
          const pov = panorama.getPov();
          if (pos && onPositionChangeRef.current) {
            onPositionChangeRef.current({
              lat: pos.lat(),
              lng: pos.lng(),
              heading: pov.heading,
              pitch: pov.pitch,
              pov,
            });
          }
        });

        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Maps API failed to load:", err);
        setError("Failed to load Google Maps. Check your API key.");
      });

    return () => {
      cancelled = true;
    };
  }, [city.lat, city.lng, city.heading, city.pitch]);

  const moveTo = useCallback((lat: number, lng: number) => {
    panoramaRef.current?.setPosition({ lat, lng });
  }, []);

  return { containerRef, isLoaded, error, panorama: panoramaRef, moveTo };
}
