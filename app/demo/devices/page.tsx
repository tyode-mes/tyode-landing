import { DEVICES } from "../data";
import { Card, PageHead, Pill } from "../ui";
import s from "../demo.module.css";

export default function Devices() {
  const online = DEVICES.filter((d) => d.status === "Online").length;
  return (
    <>
      <PageHead title="Devices" sub={`${online} of ${DEVICES.length} devices online. Everything that connects to a machine only reads from it, and all data stays on the plant's own server.`} />
      <div className={s.principles}>
        <div><b>Read only</b><span>Cycle signals are read from the machine. Nothing writes to it or changes its settings.</span></div>
        <div><b>Runs in parallel</b><span>The current count continues until the automatic count is proven and the plant approves the switch.</span></div>
        <div><b>Installed in planned stops</b><span>Sensors, printers and scanners go in during stops agreed with the line supervisor.</span></div>
        <div><b>Data stays in the plant</b><span>A local server holds every record, exportable to Excel at any time.</span></div>
      </div>
      <Card>
        <table className={s.table}>
          <thead><tr><th>Device</th><th>Type</th><th>Location</th><th>Mode</th><th>Status</th></tr></thead>
          <tbody>
            {DEVICES.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td><td>{d.type}</td><td>{d.where}</td><td>{d.mode}</td>
                <td><Pill tone={d.status === "Online" ? "green" : "grey"}>{d.status}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
