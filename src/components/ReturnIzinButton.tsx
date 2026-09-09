"use client";

import { useActionState } from "react";
import { tandaiKembaliAction, type KembaliState } from "@/app/santri/actions";

const initialState: KembaliState = {};

export default function ReturnIzinButton({ id }: { id: number }) {
  const [state, action, pending] = useActionState(tandaiKembaliAction, initialState);

  return (
    <div className="mt-3 pt-3 border-t border-line">
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={pending}
          className="w-full sm:w-auto rounded-md bg-sage px-4 py-2 text-sm font-medium text-paper-raised hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Mencatat kepulangan..." : "Saya sudah kembali"}
        </button>
      </form>
      {state.error && <p className="text-sm text-clay mt-2" role="alert">{state.error}</p>}
      {state.success && <p className="text-sm text-sage mt-2" role="status">Kepulangan berhasil dicatat.</p>}
    </div>
  );
}
