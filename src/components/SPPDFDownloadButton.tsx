"use client";

import React, { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import SPPDFDocument from "./SPPDFDocument";
import type { GelaraSummary, AbsentActivityRecord } from "@/services/daily-activity.service";

interface SPPDFDownloadButtonProps {
  monthLabel: string;
  year: number;
  gelara: GelaraSummary;
  absences: AbsentActivityRecord[];
}

export default function SPPDFDownloadButton({
  monthLabel,
  year,
  gelara,
  absences,
}: SPPDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Konversi nama bulan Indonesia ke romawi
  const bulanRomawi: Record<string, string> = {
    Januari: "I", Februari: "II", Maret: "III", April: "IV",
    Mei: "V", Juni: "VI", Juli: "VII", Agustus: "VIII",
    September: "IX", Oktober: "X", November: "XI", Desember: "XII",
  };
  const detectedBulan = bulanRomawi[monthLabel] ?? "I";

  const [formData, setFormData] = useState({
    nomor: "",
    bulan: detectedBulan,
    tahun: String(year),
  });

  const handleDownload = async () => {
    if (!formData.nomor || !formData.bulan || !formData.tahun) return;

    setIsGenerating(true);
    try {
      const doc = (
        <SPPDFDocument
          monthLabel={monthLabel}
          year={year}
          gelara={gelara}
          absences={absences}
          nomorSurat={formData.nomor}
          bulanSurat={formData.bulan}
          tahunSurat={formData.tahun}
        />
      );
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SPB-Keaktifan-${gelara.namaGelara.replace(/\s+/g, "-")}-${monthLabel}-${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShowForm(false);
    } catch (error) {
      console.error(error);
      alert("Gagal membuat PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  if (showForm) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 bg-paper p-1.5 rounded-lg border border-line shadow-sm text-sm animate-in fade-in slide-in-from-right-4 duration-200">
        <input 
          type="text" 
          value={formData.nomor} 
          onChange={e => setFormData({...formData, nomor: e.target.value})} 
          placeholder="No. Surat" 
          className="w-16 px-2 py-1.5 border border-line rounded-md text-xs bg-paper-raised text-ink focus:outline-none focus:ring-1 focus:ring-teal" 
        />
        <span className="text-ink-soft font-medium">/</span>
        <input 
          type="text" 
          value={formData.bulan} 
          onChange={e => setFormData({...formData, bulan: e.target.value})} 
          placeholder="Bln" 
          className="w-12 px-2 py-1.5 border border-line rounded-md text-xs uppercase bg-paper-raised text-ink focus:outline-none focus:ring-1 focus:ring-teal" 
        />
        <span className="text-ink-soft font-medium">/</span>
        <input 
          type="text" 
          value={formData.tahun} 
          onChange={e => setFormData({...formData, tahun: e.target.value})} 
          placeholder="Tahun" 
          className="w-14 px-2 py-1.5 border border-line rounded-md text-xs bg-paper-raised text-ink focus:outline-none focus:ring-1 focus:ring-teal" 
        />
        <button 
          onClick={handleDownload} 
          disabled={isGenerating || !formData.nomor.trim()} 
          className="ml-1 bg-teal text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-teal-hover transition-colors disabled:opacity-50"
        >
          {isGenerating ? "..." : "Unduh"}
        </button>
        <button 
          onClick={() => setShowForm(false)} 
          disabled={isGenerating} 
          className="text-ink-soft hover:text-ink px-2 py-1.5 text-xs font-medium transition-colors"
        >
          Batal
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      disabled={isGenerating}
      className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-xs font-semibold text-white hover:bg-teal-hover transition-colors disabled:opacity-50"
    >
      Cetak SPB (&lt;85%)
    </button>
  );
}
