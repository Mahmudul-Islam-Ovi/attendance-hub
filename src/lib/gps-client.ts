"use client";

export interface GpsProgress {
  stage: "requesting" | "locking" | "resolving" | "geocoding";
  accuracy?: number;
  bestAccuracy?: number;
  elapsedSeconds: number;
  message: string;
}

export interface AccuratePositionResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
  address?: string;
  isHighPrecision: boolean;
  rawPosition: GeolocationPosition;
}

export interface GetPositionOptions {
  /** Target accuracy in meters to immediately resolve (default: 20 meters) */
  desiredAccuracy?: number;
  /** Maximum time in milliseconds to wait for a better fix (default: 7000ms) */
  maxWaitTimeMs?: number;
  /** Timeout for geolocation call overall (default: 12000ms) */
  timeoutMs?: number;
  /** Callback for real-time progress update */
  onProgress?: (progress: GpsProgress) => void;
  /** Whether to fetch reverse geocode address via OpenStreetMap */
  reverseGeocode?: boolean;
}

/**
 * Clean and fresh reverse geocoding without stale cache
 */
export async function fetchAddressFromCoords(
  lat: number,
  lng: number,
  timeoutMs: number = 4000
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&_t=${Date.now()}`;
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(",");
        return parts.length > 3
          ? parts.slice(0, 4).join(",").trim()
          : data.display_name.trim();
      }
    }
  } catch (_) {
    // If geocoding fails or times out, fallback to formatted coordinate text
  } finally {
    clearTimeout(timer);
  }

  return `Lat: ${lat.toFixed(5)}, Lon: ${lng.toFixed(5)}`;
}

/**
 * Gets real-time, non-cached, high-accuracy GPS position.
 * Uses watchPosition to let the hardware GPS lock satellites and filter coarse initial readings.
 */
export function getAccurateCurrentPosition(
  options: GetPositionOptions = {}
): Promise<AccuratePositionResult> {
  const {
    desiredAccuracy = 20, // 20 meters target
    maxWaitTimeMs = 6500, // wait up to 6.5s to see if satellite accuracy improves
    timeoutMs = 12000,
    onProgress,
    reverseGeocode = true,
  } = options;

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return reject(new Error("আপনার ব্রাউজারে লোকেশন/জিপিএস সাপোর্ট নেই।"));
    }

    let watchId: number | null = null;
    let fallbackTimer: NodeJS.Timeout | null = null;
    let maxWaitTimer: NodeJS.Timeout | null = null;
    let hasResolved = false;
    let bestPosition: GeolocationPosition | null = null;
    const startTime = Date.now();

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (maxWaitTimer) clearTimeout(maxWaitTimer);
    };

    const finishWithPosition = async (pos: GeolocationPosition) => {
      if (hasResolved) return;
      hasResolved = true;
      cleanup();

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const acc = Math.round(pos.coords.accuracy);

      onProgress?.({
        stage: "geocoding",
        accuracy: acc,
        bestAccuracy: acc,
        elapsedSeconds: elapsed,
        message: "ঠিকানা বের করা হচ্ছে...",
      });

      let address = `Lat: ${pos.coords.latitude.toFixed(5)}, Lon: ${pos.coords.longitude.toFixed(5)}`;
      if (reverseGeocode) {
        try {
          address = await fetchAddressFromCoords(
            pos.coords.latitude,
            pos.coords.longitude
          );
        } catch (_) {}
      }

      resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
        speed: pos.coords.speed,
        heading: pos.coords.heading,
        timestamp: pos.timestamp,
        address,
        isHighPrecision: pos.coords.accuracy <= 30,
        rawPosition: pos,
      });
    };

    onProgress?.({
      stage: "requesting",
      elapsedSeconds: 0,
      message: "GPS স্যাটেলাইট সিগন্যাল অনুসন্ধান করা হচ্ছে...",
    });

    const geoOptions: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0, // Force fresh fix without cache
      timeout: timeoutMs,
    };

    // Global hard timeout
    fallbackTimer = setTimeout(() => {
      if (!hasResolved) {
        if (bestPosition) {
          finishWithPosition(bestPosition);
        } else {
          cleanup();
          reject(
            new Error(
              "জিপিএস লোকেশন পেতে অতিরিক্ত সময় লাগছে। খোলা স্থানে গিয়ে পুনরায় চেষ্টা করুন।"
            )
          );
        }
      }
    }, timeoutMs);

    // Watch position to receive progressive updates
    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const currentAcc = Math.round(pos.coords.accuracy);
          const elapsed = Math.round((Date.now() - startTime) / 1000);

          // Update best position found so far
          if (!bestPosition || pos.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = pos;
          }

          onProgress?.({
            stage: "locking",
            accuracy: currentAcc,
            bestAccuracy: Math.round(bestPosition.coords.accuracy),
            elapsedSeconds: elapsed,
            message: `GPS সিগন্যাল পাওয়া গেছে (Accuracy: ${currentAcc}m)...`,
          });

          // If accuracy is high enough (<= desiredAccuracy), lock immediately!
          if (pos.coords.accuracy <= desiredAccuracy) {
            finishWithPosition(pos);
            return;
          }

          // Otherwise, start a grace timer (e.g. 3.5s after first fix) to accept the best reading
          if (!maxWaitTimer) {
            maxWaitTimer = setTimeout(() => {
              if (!hasResolved && bestPosition) {
                finishWithPosition(bestPosition);
              }
            }, maxWaitTimeMs);
          }
        },
        (err) => {
          // If watchPosition fails immediately but we have a best position, use it
          if (bestPosition) {
            finishWithPosition(bestPosition);
            return;
          }

          cleanup();
          if (err.code === 1) {
            reject(
              new Error(
                "লোকেশন পারমিশন দেওয়া হয়নি। ব্রাউজার সেটিংসে লোকেশন অন করে পারমিশন দিন।"
              )
            );
          } else if (err.code === 2) {
            reject(
              new Error(
                "ডিভাইসের জিপিএস বন্ধ অথবা সিগন্যাল পাওয়া যাচ্ছে না। জিপিএস চালু করুন।"
              )
            );
          } else {
            reject(
              new Error(
                "লোকেশন রিড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে ইন্টারনেট ও জিপিএস চেক করে আবার চেষ্টা করুন।"
              )
            );
          }
        },
        geoOptions
      );
    } catch (e: any) {
      cleanup();
      reject(new Error(e?.message || "লোকেশন প্রসেসিংয়ে সমস্যা হয়েছে।"));
    }
  });
}
