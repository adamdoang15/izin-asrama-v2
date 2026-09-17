"use client";

import { useActionState, useState, useTransition } from "react";
import { tandaiKembaliAction, type KembaliState } from "@/app/santri/actions";

const initialState: KembaliState = {};

export default function ReturnIzinButton({ id }: { id: number }) {
  const [state, action, isActionPending] = useActionState(tandaiKembaliAction, initialState);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleReturnClick = () => {
    setGeoError(null);

    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoError("Perangkat atau browser Anda tidak mendukung fitur lokasi GPS.");
      return;
    }

    setGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLoading(false);
        const formData = new FormData();
        formData.append("id", String(id));
        formData.append("latitude", String(position.coords.latitude));
        formData.append("longitude", String(position.coords.longitude));

        startTransition(() => {
          action(formData);
        });
      },
      (error) => {
        setGeoLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError("Izin lokasi ditolak. Harap aktifkan akses lokasi (GPS) pada browser Anda untuk mencatat kepulangan.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError("Informasi lokasi tidak tersedia. Pastikan fitur lokasi/GPS pada perangkat Anda aktif.");
            break;
          case error.TIMEOUT:
            setGeoError("Waktu pengambilan lokasi habis (timeout). Silakan coba beberapa saat lagi.");
            break;
          default:
            setGeoError("Gagal mengambil lokasi GPS: " + error.message);
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const loading = isActionPending || geoLoading || isPending;

  return (
    <div className="mt-3 pt-3 border-t border-line">
      <button
        type="button"
        onClick={handleReturnClick}
        disabled={loading}
        className="w-full sm:w-auto rounded-md bg-sage px-4 py-2 text-sm font-medium text-paper-raised hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {geoLoading
          ? "Mengambil lokasi GPS..."
          : loading
          ? "Mencatat kepulangan..."
          : "Saya sudah kembali"}
      </button>

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
