"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/offers", label: "Offres" },
  { href: "/profile", label: "Profil" },
  { href: "/rag", label: "RAG" },
  { href: "/agent", label: "Agent" },
  { href: "/data-quality", label: "Qualité" },
  { href: "/scraping-runs", label: "Imports" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-bold text-white" onClick={() => setOpen(false)}>
          JobRadar IA
        </Link>

        {/* Desktop nav */}
        <nav className="hidden gap-1 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                pathname.startsWith(link.href)
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-900 hover:text-gray-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex items-center gap-1 rounded-md p-2 text-gray-400 hover:bg-gray-900 sm:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="sr-only">Menu</span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="border-t border-gray-800 px-4 pb-3 sm:hidden">
          <div className="mt-2 flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2.5 text-sm transition-colors ${
                  pathname.startsWith(link.href)
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-900 hover:text-gray-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
