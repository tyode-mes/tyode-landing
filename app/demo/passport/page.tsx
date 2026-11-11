import Link from "next/link";
import { Card, PageHead, Pill } from "../ui";
import s from "../demo.module.css";

const ROWS = [
  ["Counting today", "Machine, builder, time built, cart, press, time loaded"],
  ["Materials", "Compound batch for each component, with supplier lot and expiry"],
  ["Build", "Build parameters for the cycle, alongside the count"],
  ["Cure", "Press temperature and time for the cycle, read only"],
  ["Inspection", "Inspection results and the inspector's decision, against the spec"],
  ["Dispatch", "Storage location, customer order and shipment"],
];

export default function Passport() {
  return (
    <>
      <PageHead title="Tyre passport" sub="The next phase. The same labels, scanners and server that make the count reliable become each tyre's complete history.">
        <Pill tone="blue">Next phase</Pill>
      </PageHead>
      <div className={s.gridTwo}>
        <Card title="What each tyre's record grows into">
          <ol className={s.timeline}>
            {ROWS.map(([k, v], i) => (
              <li key={k} className={i === 0 ? s.tlOk : s.tlNext}>
                <time>{k}</time><span>{v}</span>
              </li>
            ))}
          </ol>
        </Card>
        <Card title="What it answers">
          <ul className={s.answers}>
            <li><b>Which tyres are affected?</b><span>When a compound batch or press is in doubt, list every tyre it touched, wherever it is, and hold them in one step.</span></li>
            <li><b>Was it cured properly?</b><span>Each tyre&apos;s cure record is checked against what its compound needs, and anything unusual is flagged.</span></li>
            <li><b>Why did this defect happen?</b><span>Defects are compared by batch, machine, press and shift, so engineers start from the likely cause.</span></li>
          </ul>
          <p className={s.muted}>Built on the counting system, so nothing installed for counting is wasted. <Link href="/">See Tyode on tyode.com</Link></p>
        </Card>
      </div>
    </>
  );
}
