import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Dezente Rechts-Links „Impressum · Datenschutz". `tone="onDark"` für die
 * Verwendung auf dunklem (Violett-/Blau-)Grund.
 */
export function FooterLinks({
  tone = "default",
  className,
}: {
  tone?: "default" | "onDark";
  className?: string;
}) {
  const base =
    tone === "onDark"
      ? "text-secondary-100 [&_a:hover]:text-white"
      : "text-neutral-500 [&_a:hover]:text-neutral-700";

  return (
    <nav
      className={cn(
        "flex items-center justify-center gap-2 text-xs",
        base,
        className,
      )}
      aria-label="Rechtliches"
    >
      <Link href="/impressum" className="hover:underline">
        Impressum
      </Link>
      <span aria-hidden>·</span>
      <Link href="/datenschutz" className="hover:underline">
        Datenschutz
      </Link>
      <span aria-hidden>·</span>
      <Link href="/agb" className="hover:underline">
        AGB
      </Link>
      <span aria-hidden>·</span>
      <Link href="/avv" className="hover:underline">
        AVV
      </Link>
    </nav>
  );
}
