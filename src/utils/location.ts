export const LOCATION_COORDINATES: { [key: string]: { lat: number; lng: number } } = {
  "Varanasi, Sigra Ward": { lat: 25.3176, lng: 82.9739 },
  "Varanasi, Orderly Bazar": { lat: 25.3258, lng: 82.9826 },
  "Varanasi, Bhelupur": { lat: 25.2997, lng: 82.9859 },
  "Varanasi, Lanka": { lat: 25.2796, lng: 82.9997 },
  "Varanasi, Sarnath": { lat: 25.3762, lng: 83.0227 },
  "Varanasi, Chowk": { lat: 25.3119, lng: 83.0101 },
  "Lucknow, Hazratganj": { lat: 26.8465, lng: 80.9460 },
  "Lucknow, Aminabad": { lat: 26.8400, lng: 80.9250 },
  "Prayagraj, Civil Lines": { lat: 25.4529, lng: 81.8349 },
  "Kanpur, Swaroop Nagar": { lat: 26.4764, lng: 80.3201 },
  "Delhi, Connaught Place": { lat: 28.6304, lng: 77.2177 },
  "Mumbai, Colaba": { lat: 18.9067, lng: 72.8147 }
};

export function findClosestLocation(lat: number, lng: number): string {
  let closestName = "Varanasi, Sigra Ward";
  let minDistance = Infinity;

  for (const [name, coords] of Object.entries(LOCATION_COORDINATES)) {
    const dLat = lat - coords.lat;
    const dLng = lng - coords.lng;
    const distance = dLat * dLat + dLng * dLng;
    if (distance < minDistance) {
      minDistance = distance;
      closestName = name;
    }
  }
  return closestName;
}

export async function detectLocationByIP(): Promise<{ lat: number; lng: number; city?: string } | null> {
  // Try freeipapi.com first (highly reliable and no keys needed)
  try {
    const res = await fetch("https://freeipapi.com/api/json");
    if (res.ok) {
      const data = await res.json();
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return {
          lat: data.latitude,
          lng: data.longitude,
          city: data.cityName
        };
      }
    }
  } catch (e) {
    console.warn("freeipapi lookup failed, trying fallback...", e);
  }

  // Try ipapi.co as secondary
  try {
    const res = await fetch("https://ipapi.co/json/");
    if (res.ok) {
      const data = await res.json();
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return {
          lat: data.latitude,
          lng: data.longitude,
          city: data.city
        };
      }
    }
  } catch (e) {
    console.warn("ipapi lookup failed, trying fallback 2...", e);
  }

  // Try ipinfo.io as tertiary (might be rate-limited, but handles public requests well)
  try {
    const res = await fetch("https://ipinfo.io/json");
    if (res.ok) {
      const data = await res.json();
      if (data.loc) {
        const [latStr, lngStr] = data.loc.split(",");
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        if (!isNaN(lat) && !isNaN(lng)) {
          return {
            lat,
            lng,
            city: data.city
          };
        }
      }
    }
  } catch (e) {
    console.warn("ipinfo lookup failed", e);
  }

  return null;
}

export function detectLocationByGPS(timeoutMs: number = 5000): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (err) => {
        console.warn("GPS detection failed:", err);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
    );
  });
}
