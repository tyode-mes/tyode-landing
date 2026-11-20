import { DEVICES } from "../data";
import { Card, PageHead, Pill } from "../ui";
import s from "../demo.module.css";

export default function Devices() {
  const online = DEVICES.filter((d) => d.status === "Online").length;
  return (
    <>
      <PageHead title="Devices" sub={`${online} of ${DEVICES.length} devices online on line PL-1. Everything connected to a machine only reads from it.`} />
      <div className={s.principles}>
        <div><b>Read-only on machines</b><span>Tyode reads the auto-stitch and cure signals. It never writes to a machine or changes its settings.</span></div>
        <div><b>Heartbeat</b><span>Each counter sends a heartbeat every minute. No heartbeat for 2 minutes raises an alert.</span></div>
        <div><b>Data stays in the plant</b><span>Production data is stored on a local server inside the plant.</span></div>
        <div><b>Works through network drops</b><span>If the network drops, devices store their data and send it when it is back.</span></div>
      </div>
      <Card>
        <table className={s.table}>
          <thead><tr><th>Device</th><th>Type</th><th>Location</th><th>Mode</th><th>Last heartbeat</th><th>Status</th></tr></thead>
          <tbody>
            {DEVICES.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td><td>{d.type}</td><td>{d.where}</td><td>{d.mode}</td><td>{d.beat}</td>
                <td><Pill tone={d.status === "Online" ? "green" : "grey"}>{d.status}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={s.muted}>Each user only sees what their role allows. Operator screens are in English and Sinhala.</p>
      </Card>
    </>
  );
}
