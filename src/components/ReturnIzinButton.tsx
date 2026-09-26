"use client";

import { useEffect, useRef, useState, useTransition, useActionState } from "react";
import { tandaiKembaliAction, type KembaliState } from "@/app/santri/actions";

const initialState: KembaliState = {};

export default function ReturnIzinButton({ id }: { id: number }) {
  const [state, action, isActionPending] = useActionState(tandaiKembaliAction, initialState);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const watchIdRef = useRef<number | null>(null);
  const timerIdRef = useRef<NodeJS.Timeout | null>(null);
  const bestPositionRef = useRef<GeolocationPosition | null>(null);

  const cleanupGeo = () => {
    if (watchIdRef.current !== null && typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerIdRef.current !== null) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupGeo();
    };
  }, []);

  const handleReturnClick = () => {
    setGeoError(null);
    setGeoStatus(null);
    cleanupGeo();
    bestPositionRef.current = null;

    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoError("Perangkat atau browser Anda tidak mendukung fitur lokasi GPS.");
      return;
    }

    setGeoLoading(true);
    setGeoStatus("Mencari sinyal GPS, mohon tunggu...");

    const finishAndSubmit = (position: GeolocationPosition) => {
      cleanupGeo();
      setGeoLoading(false);
      setGeoStatus(null);

      const formData = new FormData();
      formData.append("id", String(id));
      formData.append("latitude", String(position.coords.latitude));
      formData.append("longitude", String(position.coords.longitude));
      formData.append("accuracy", String(position.coords.accuracy));

      startTransition(() => {
        action(formData);
      });
    };

    // Timeout 25 detik untuk mencari GPS terbaik
    timerIdRef.current = setTimeout(() => {
      if (bestPositionRef.current) {
        finishAndSubmit(bestPositionRef.current);
      } else {
        cleanupGeo();
        setGeoLoading(false);
        setGeoStatus(null);
        setGeoError(
          "Waktu pencarian sinyal GPS habis (timeout). Pastikan GPS aktif dan Anda berada di area terbuka atau dekat jendela, lalu coba lagi."
        );
      }
    }, 25000);

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const currentAcc = position.coords.accuracy;

          if (!bestPositionRef.current || currentAcc < bestPositionRef.current.coords.accuracy) {
            bestPositionRef.current = position;
          }

          setGeoStatus(`Mengunci sinyal GPS (akurasi: ±${Math.round(currentAcc)}m)...`);

          // Jika akurasi sudah sangat baik (<= 30 meter), langsung proses
          if (currentAcc <= 30) {
            finishAndSubmit(position);
          }
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            cleanupGeo();
            setGeoLoading(false);
            setGeoStatus(null);
            setGeoError(
              "Izin lokasi ditolak. Harap aktifkan akses lokasi (GPS) pada browser/perangkat Anda untuk mencatat kepulangan."
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 25000,
          maximumAge: 0,
        }
      );
    } catch (err: unknown) {
      cleanupGeo();
      setGeoLoading(false);
      setGeoStatus(null);
      setGeoError("Terjadi kesalahan saat mengakses GPS: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const loading = isActionPending || geoLoading || isPending;

  return (
    <div className="mt-3 pt-3 border-t border-line">
      <button
        type="button"
        onClick={handleReturnClick}
        disabled={loading}
        className="w-full sm:w-auto rounded-md bg-sage px-4 py-2 text-sm font-medium text-paper-raised hover:opacity-90 disabled:opacity-60 transition-opacity inline-flex items-center justify-center gap-2"
      >
        {geoLoading ? (
          <>
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]" />
            <span>Mencari sinyal GPS...</span>
          </>
        ) : loading ? (
          <>
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]" />
            <span>Mencatat kepulangan...</span>
          </>
        ) : (
          "Saya sudah kembali"
        )}
      </button>

      {geoLoading && geoStatus && (
        <p className="text-xs text-ink-soft mt-2 flex items-center gap-1.5" role="status">
          <span className="inline-block h-2 w-2 rounded-full bg-teal animate-pulse" />
          {geoStatus}
        </p>
      )}

      {geoError && (
        <p className="text-sm text-clay mt-2" role="alert">
          {geoError}
        </p>
      )}
      {!geoError && state.error && (
        <p className="text-sm text-clay mt-2" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-sage mt-2" role="status">
          Kepulangan berhasil dicatat.
        </p>
      )}
    </div>
  );
}
