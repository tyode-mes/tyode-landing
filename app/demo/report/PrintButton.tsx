"use client";

import s from "../demo.module.css";

export default function PrintButton() {
  return <button type="button" className={s.btn} onClick={() => window.print()}>Print or save as PDF</button>;
}
