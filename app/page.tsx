import Image from "next/image";

const LINKS = {
  mood: "/",
  enak: "/",
  paham: "/",
  docs: "/",
} as const;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-between bg-white px-16 py-32 dark:bg-black sm:items-start">
        <Image
          src="/logo-cgkn.png"
          alt="Logo CGKN"
          width={100}
          height={100}
          priority
        />

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-400">
            Sek bariki kape gae{" "}
            <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
              project management DIGIMAR
            </code>
            , ojok takon kapan marine
          </h1>

          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            sek suwe marine{" "}
            <a
              href={LINKS.mood}
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Sak mood ku
            </a>{" "}
            karo{" "}
            <a
              href={LINKS.enak}
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Sak enak ku
            </a>{" "}
            oyi.
          </p>
        </div>

        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            href={LINKS.paham}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
          >
            Paham
          </a>
          <a
            href={LINKS.docs}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
          >
            ra paham yowes
          </a>
        </div>
      </main>
    </div>
  );
}