/* A tablet frame for the station screens, so they read as the device on the floor. */
import s from "../demo.module.css";

export default function Tablet({ head, children, foot }: { head: React.ReactNode; children: React.ReactNode; foot?: React.ReactNode }) {
  return (
    <div className={s.tabletWrap}>
      <div className={s.tablet}>
        <div className={s.tabHead}>{head}</div>
        <div className={s.tabBody}>{children}</div>
      </div>
      {foot && <div className={s.tabFoot}>{foot}</div>}
    </div>
  );
}
