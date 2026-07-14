"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "../actions";
import styles from "./site-header.module.css";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/mieteingang", label: "Mieteingang" },
];

/**
 * Einfache, seitenübergreifende Kopfzeile mit Navigation und Abmelde-Button.
 * Der aktive Bereich wird anhand des aktuellen Pfads hervorgehoben.
 */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.brand}>Vermieter&nbsp;SaaS</span>
        <nav className={styles.nav}>
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={isActive ? styles.linkActive : styles.link}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <form action={logout}>
        <button type="submit" className={styles.logout}>
          Abmelden
        </button>
      </form>
    </header>
  );
}
