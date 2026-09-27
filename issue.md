# Redesain Web Izin Asrama

## Tujuan
Redesain web. Jangan ganggu web jalan. Pindah bertahap.

## Aturan Desain
- Pakai Phosphor icons (`@phosphor-icons/react`). Larang emoji.
- Spacing 8dp rhythm.
- Contrast text 4.5:1.
- Token-driven theming. Larang hardcode hex.
- Tap feedback jelas.

## Strategi
- Buat komponen UI baru (misal `src/components/v2/`).
- Jangan ubah logika backend + DB (`src/services/`).
- Terapkan design tokens Tailwind v4.
- Rilis bertahap pakai feature flag atau rute `/v2`.

## Tugas
- [x] Setup design system token (colors, spacing).
- [x] Update UI `ReturnIzinButton.tsx`, logika tetap.
- [x] Update dashboard santri.
- [x] Update dashboard admin.
- [ ] Test mobile + desktop + dark/light mode.