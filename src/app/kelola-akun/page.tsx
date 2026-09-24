import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAllUsers, syncBlacklistStatus } from "@/services/user.service";
import AccountForm from "@/components/AccountForm";
import AccountRow from "@/components/AccountRow";
import GelaraSearch from "@/components/GelaraSearch";

type SearchParams = Promise<{ q?: string }>;

export default async function KelolaAkunPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "PENGURUS") redirect("/beranda");

  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();

  await syncBlacklistStatus();
  const users = await getAllUsers();

  const allSantri = users.filter((u) => u.role === "SANTRI");
  const santri = query
    ? allSantri.filter((u) => u.name.toLowerCase().includes(query))
    : allSantri;
  const petugas = users.filter((u) => u.role === "PENGURUS");

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 space-y-10">
      <section>
        <h2 className="text-base font-semibold tracking-tight mb-1">
          Tambah akun
        </h2>
        <p className="text-sm text-ink-soft mb-5">
          Buat akun baru untuk gelara atau mentor asrama.
        </p>
        <AccountForm />
      </section>

      <section>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-base font-semibold tracking-tight shrink-0">
            Gelara ({query ? `${santri.length} dari ${allSantri.length}` : allSantri.length})
          </h2>
        </div>
        <div className="mb-4">
          <GelaraSearch />
        </div>
        {santri.length === 0 ? (
          <p className="text-sm text-ink-soft">
            {query ? `Tidak ada gelara dengan nama "${q}".` : "Belum ada akun gelara."}
          </p>
        ) : (
          <ul className="space-y-3">
            {santri.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                isSelf={String(account.id) === session.user.id}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-4">
          Mentor ({petugas.length})
        </h2>
        {petugas.length === 0 ? (
          <p className="text-sm text-ink-soft">Belum ada akun petugas.</p>
        ) : (
          <ul className="space-y-3">
            {petugas.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                isSelf={String(account.id) === session.user.id}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
