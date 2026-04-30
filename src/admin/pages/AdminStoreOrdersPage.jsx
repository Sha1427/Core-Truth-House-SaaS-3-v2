import React from "react";
import { ShoppingCart } from "lucide-react";
import { AdminStoreOrders } from "../../pages/admin/AdminStorePanel";

export default function AdminStoreOrdersPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in srgb, var(--cth-admin-ruby) 12%, var(--cth-admin-panel))] text-[var(--cth-admin-ruby)]">
            <ShoppingCart size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--cth-admin-ruby)]">Commerce</p>
            <h2 className="mt-1 text-3xl font-semibold text-[var(--cth-admin-ink)]">Store Orders</h2>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-[var(--cth-admin-muted)]">
          Manage store orders from the new separated admin shell using the existing authenticated store admin component.
        </p>
      </section>

      <section className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-6 shadow-sm">
        <AdminStoreOrders />
      </section>
    </div>
  );
}
