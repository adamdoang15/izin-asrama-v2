// Seed akun contoh ke Supabase. Jalankan sekali setelah schema.sql dibuat:
//   npm run seed
//
// Aman dijalankan berkali-kali -- script ini berhenti tanpa melakukan apa pun
// jika tabel users sudah ada isinya.

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

// dotenv's default import only reads ".env" -- Next.js's convention of
// using ".env.local" needs to be loaded explicitly here.
config({ path: ".env.local" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Pastikan .env.local sudah diisi."
  );
  process.exitCode = 1;
} else {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  await main(supabase);
}

function describeError(err) {
  if (!err) return "(tidak ada detail error)";
  const parts = [];
  if (err.message) parts.push(err.message);
  if (err.code) parts.push(`code: ${err.code}`);
  if (err.details) parts.push(`details: ${err.details}`);
  if (err.hint) parts.push(`hint: ${err.hint}`);
  if (parts.length === 0) {
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return parts.join(" | ");
}

async function main(supabase) {
  let countResult;
  try {
    countResult = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });
  } catch (err) {
    console.error("Tidak bisa terhubung ke Supabase:", describeError(err));
    console.error(
      "Cek lagi SUPABASE_URL di .env.local -- pastikan formatnya seperti https://xxxx.supabase.co (tanpa garis miring di akhir)."
    );
    process.exitCode = 1;
    return;
  }

  const { count, error: countError } = countResult;

  if (countError) {
    console.error("Gagal mengecek tabel users:", describeError(countError));
    console.error(
      "Sudah menjalankan supabase/schema.sql di SQL Editor Supabase? Atau cek SUPABASE_SERVICE_ROLE_KEY di .env.local (pastikan pakai service_role key, bukan anon key)."
    );
    process.exitCode = 1;
    return;
  }

  if ((count ?? 0) > 0) {
    console.log("Tabel users sudah berisi data. Tidak melakukan seeding.");
    return;
  }

  const accounts = [
    {
      username: "pengurus",
      password: "pengurus123",
      name: "Ust. Fajar Ramadhan",
      role: "PENGURUS",
      kamar: null,
    },
    {
      username: "santri1",
      password: "santri123",
      name: "Ahmad Fauzan",
      role: "SANTRI",
      kamar: "Asrama A - Kamar 12",
    },
    {
      username: "santri2",
      password: "santri123",
      name: "Bilal Hidayat",
      role: "SANTRI",
      kamar: "Asrama A - Kamar 07",
    },
  ];

  for (const account of accounts) {
    const password_hash = bcrypt.hashSync(account.password, 10);
    const { error } = await supabase.from("users").insert({
      username: account.username,
      password_hash,
      name: account.name,
      role: account.role,
      kamar: account.kamar,
    });
    if (error) {
      console.error(
        `Gagal membuat akun ${account.username}:`,
        describeError(error)
      );
      process.exitCode = 1;
      return;
    }
    console.log(`Akun dibuat: ${account.username} (${account.role})`);
  }

  console.log("\nSelesai. Akun contoh siap dipakai untuk login.");
}
