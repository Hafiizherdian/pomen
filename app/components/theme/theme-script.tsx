import Script from 'next/script';

/**
 * Script inline yang dijalankan sebelum React hydrate, supaya tema yang tersimpan
 * langsung terpasang dan tidak ada kedipan terang→gelap.
 *
 * Sengaja TANPA "use client": harus dirender dari Server Component (layout.tsx).
 */
const script = `(function(){try{var t=localStorage.getItem("theme");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var r=t==="dark"||((t===null||t==="system")&&d)?"dark":"light";var e=document.documentElement;e.classList.remove("light","dark");e.classList.add(r);e.setAttribute("data-theme",r);e.style.colorScheme=r}catch(_){}})()`;

export function ThemeScript() {
  return (
    <Script 
      id="theme-script-init" 
      strategy="beforeInteractive" 
      dangerouslySetInnerHTML={{ __html: script }} 
    />
  );
}