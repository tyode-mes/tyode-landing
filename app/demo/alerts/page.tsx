import Link from "next/link";
import { FLAGS, builderByBadge, flagLabel, hhmm } from "../data";
import { Card, PageHead, Pill } from "../ui";
import s from "../demo.module.css";

const WHY: Record<string, string> = {
  "empty-cycle": "The machine reported a finished cycle, but the unload sensor saw no tyre. Both must agree for a tyre to count.",
  "sensor-no-cycle": "The unload sensor was triggered, but the machine had not finished a cycle. Both must agree for a tyre to count.",
  "duplicate-scan": "This label had already been scanned into a press. Each label can be loaded once.",
  "label-request": "Labels only print for a counted tyre. There is no way to print one on request.",
};

export default function Alerts() {
  return (
    <>
      <PageHead title="Flagged attempts"
        sub="Anything that could have pushed a count up without a real tyre is stopped and listed here. None of these were counted." />
      <div className={s.cases}>
        {[...FLAGS].reverse().map((f) => (
          <Card key={f.id}>
            <div className={s.caseHead}>
              <div>
                <Pill tone="amber">{flagLabel[f.kind]}</Pill>
                <h2 className={s.caseId}>{f.where} · {hhmm(f.at)}</h2>
                <p className={s.muted}>
                  {f.badge ? `Builder ${builderByBadge(f.badge).name}, badge ${f.badge}` : `Press loading at ${f.where}`}
                  {f.serial ? ` · label ${f.serial}` : ""} · case {f.id}
                </p>
              </div>
              {f.serial && <Link className={s.cardLink} href={`/demo/tyres?serial=${f.serial}`}>Tyre record</Link>}
            </div>
            <p className={s.body}>{f.text}</p>
            <p className={s.why}><b>Why it was stopped.</b> {WHY[f.kind]}</p>
            <div className={s.where}>
              <div><span>Counted</span><b>No</b></div>
              <div><span>Evidence</span><b>{f.kind === "duplicate-scan" ? "Scan log" : "Signal log and unload clip"}</b></div>
              <div><span>Seen by</span><b>Shift supervisor</b></div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
