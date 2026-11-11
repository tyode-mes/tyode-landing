import Link from "next/link";
import { BUILDERS, FLAGS, MACHINES, NOW, TYRES, hhmm } from "../data";
import { Card, PageHead, Pill } from "../ui";
import s from "../demo.module.css";

export default function Builders() {
  return (
    <>
      <PageHead title="Builders"
        sub="Verified output for each tyre builder this shift. A builder signs in once with their badge, and every tyre the machine and sensor confirm is credited to them." />
      <div className={s.builderGrid}>
        {BUILDERS.map((b) => {
          const m = MACHINES.find((x) => x.id === b.machine)!;
          const mine = TYRES.filter((t) => t.badge === b.badge);
          const loaded = mine.filter((t) => t.status === "loaded" || t.status === "found").length;
          const missing = mine.filter((t) => t.status === "missing").length;
          const flags = FLAGS.filter((f) => f.badge === b.badge);
          const last = mine[mine.length - 1];
          const perHour = mine.length / ((Math.min(NOW, last.builtAt + 1) - 6 * 60) / 60);
          return (
            <Card key={b.badge} className={s.builder}>
              <div id={b.machine} className={s.caseHead}>
                <div className={s.who}>
                  <span className={s.avatar}>
                    {b.name.split(" ").map((w) => w[0]).join("").replace(".", "")}
                  </span>
                  <div>
                  <h2 className={s.caseId}>{b.name}</h2>
                  <p className={s.muted}>Badge {b.badge} · {b.machine} · {m.size}</p>
                  </div>
                </div>
                <Pill tone={m.status === "running" ? "green" : m.status === "alert" ? "amber" : "grey"}>
                  {m.status === "running" ? "Building" : m.status === "alert" ? "Flagged" : "Size change"}
                </Pill>
              </div>
              <div className={s.facts4}>
                <div><span>Built</span><b>{mine.length}</b></div>
                <div><span>Loaded</span><b>{loaded}</b></div>
                <div><span>Missing</span><b className={missing ? s.red : ""}>{missing}</b></div>
                <div><span>Per hour</span><b>{perHour.toFixed(1)}</b></div>
              </div>
              <p className={s.muted}>
                Last tyre <Link href={`/demo/tyres?serial=${last.serial}`}>{last.serial}</Link> at {hhmm(last.builtAt)}
                {flags.length ? ` · ${flags.length} flagged attempt` : ""}
              </p>
            </Card>
          );
        })}
      </div>
    </>
  );
}
