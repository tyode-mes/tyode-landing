import styles from "./SectionPlaceholder.module.css";

type Props = {
  id: string;
  number: string;
  title: string;
  /** what the section should cover (from the site plan) */
  brief: string[];
};

/**
 * Stand-in for a section nobody has built yet. It keeps the section's anchor (#id) working
 * for the nav. Replace it with your real section; this file can go once every section has.
 */
export default function SectionPlaceholder({ id, number, title, brief }: Props) {
  return (
    <section id={id} className={styles.section}>
      <p className={styles.number}>Section {number}</p>
      <h2 className={styles.title}>{title}</h2>
      <ul className={styles.brief}>
        {brief.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </section>
  );
}
