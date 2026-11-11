/* Small shared pieces for the demo pages. */
import Link from "next/link";
import s from "./demo.module.css";

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className={s.pageHead}>
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className={s.headActions}>{children}</div>}
    </div>
  );
}

const PATHS: Record<string, string> = {
  overview: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
  missing: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 5v5m0 3.5v.5",
  flag: "M5 21V4m0 0h11l-2 4 2 4H5",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4.2-4.2",
  people: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm-6 9c0-3.3 2.7-6 6-6s6 2.7 6 6m1-9a3 3 0 1 0 0-6m2 15c0-2.5-1.3-4.6-3.2-5.6",
  report: "M6 3h9l4 4v14H6zM9 17v-3m3 3v-6m3 6v-4",
  device: "M7 7h10v10H7zM10 3v4m4-4v4m-4 10v4m4-4v4M3 10h4m-4 4h4m10-4h4m-4 4h4",
  play: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm-2 5.5v7l6-3.5z",
  passport: "M5 3h14v18H5zM12 8.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM9 17h6",
  tyre: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  press: "M5 4h14M7 4v5h10V4M12 9v4m-6 7h12v-4H6z",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4v5l3.5 2",
  shield: "M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6zm-3 9 2 2 4-4",
};

export function Icon({ name, color, size = 22 }: { name: string; color: string; size?: number }) {
  return (
    <span className={s.icon} style={{ "--c": color, width: size, height: size } as React.CSSProperties} aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d={PATHS[name]} /></svg>
    </span>
  );
}

export function Kpi({ value, label, sub, tone, href, icon, color, filled }: { value: string | number; label: string; sub?: string; tone?: "red" | "amber" | "green"; href?: string; icon?: string; color?: string; filled?: boolean }) {
  const body = (
    <>
      {icon && color && <span className={s.kIcon}><Icon name={icon} color={color} size={30} /></span>}
      <span className={s.kLabel}>{label}</span>
      <b className={tone ? s["t_" + tone] : ""}>{value}</b>
      {sub && <span className={s.kSub}>{sub}</span>}
    </>
  );
  const cls = `${s.kpi} ${filled ? s.kpiFilled : ""}`;
  return href ? <Link href={href} className={`${cls} ${s.kpiLink}`}>{body}</Link> : <div className={cls}>{body}</div>;
}

export function Pill({ tone = "grey", children }: { tone?: "grey" | "green" | "amber" | "red" | "blue"; children: React.ReactNode }) {
  return <span className={`${s.pill} ${s["p_" + tone]}`}>{children}</span>;
}

export function Card({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`${s.card} ${className ?? ""}`}>
      {(title || action) && (
        <div className={s.cardHead}>
          {title && <h2>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
