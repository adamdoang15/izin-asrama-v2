"use client";

import { useEffect, useRef, useState, useTransition, useActionState } from "react";
import { tandaiKembaliAction, type KembaliState } from "@/app/santri/actions";
import { MapPinLine, SpinnerGap, WarningCircle, CheckCircle } from "@phosphor-icons/react";

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
    <div className="mt-4 pt-4 border-t border-line flex flex-col gap-2">
      <button
        type="button"
        onClick={handleReturnClick}
        disabled={loading}
        className="w-full sm:w-auto rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper-raised 
                   hover:bg-teal-soft hover:text-teal focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 
                   focus:ring-offset-paper disabled:opacity-60 disabled:pointer-events-none 
                   active:scale-95 transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-sm"
      >
        {geoLoading ? (
          <>
            <SpinnerGap weight="bold" className="animate-spin text-lg" />
            <span>Mencari GPS...</span>
          </>
        ) : loading ? (
          <>
            <SpinnerGap weight="bold" className="animate-spin text-lg" />
            <span>Mencatat...</span>
          </>
        ) : (
          <>
            <MapPinLine weight="bold" className="text-lg" />
            <span>Saya sudah kembali</span>
          </>
        )}
      </button>

      {/* Status & Feedback Area */}
      <div className="flex flex-col gap-2 empty:hidden">
        {geoLoading && geoStatus && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-soft text-amber rounded-md text-xs font-medium" role="status">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber"></span>
            </span>
            <span>{geoStatus}</span>
          </div>
        )}

        {geoError && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-clay-soft text-clay rounded-md text-sm font-medium" role="alert">
            <WarningCircle weight="fill" className="text-lg shrink-0 mt-0.5" />
            <span>{geoError}</span>
          </div>
        )}

        {!geoError && state.error && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-clay-soft text-clay rounded-md text-sm font-medium" role="alert">
            <WarningCircle weight="fill" className="text-lg shrink-0 mt-0.5" />
            <span>{state.error}</span>
          </div>
        )}

        {state.success && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-sage-soft text-sage rounded-md text-sm font-medium" role="status">
            <CheckCircle weight="fill" className="text-lg shrink-0 mt-0.5" />
            <span>Kepulangan berhasil dicatat.</span>
          </div>
        )}
      </div>
    </div>
  );
}
