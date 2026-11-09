import { Suspense } from "react";
import { PilarContent } from "@/app/components/pilar/pilar-content";
import { getPilarAccounts, getPilarRows } from "@/lib/pilar-queries";

export default function PilarPage() {
  return (
    <div className="flex-1 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Pilar Content</h1>
        {/* <p className="text-sm text-muted">Panduan pilar konten dan target produksi</p> */}
      </div>
      <Suspense fallback={<p className="text-sm text-muted">Memuat...</p>}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const [rows, accounts] = await Promise.all([getPilarRows(), getPilarAccounts()]);
  return <PilarContent rows={rows} accounts={accounts} />;
}