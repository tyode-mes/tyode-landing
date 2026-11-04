import styles from "./Team.module.css";

// Who builds Tyode. Add each photo to /public/team/ and set `photo` (e.g. "/team/name.jpg");
// until then the avatar shows initials. Fill in the links when you have them.
const TEAM: {
  name: string;
  role: string;
  photo?: string;
  linkedin?: string;
  github?: string;
  email?: string;
}[] = [
  // Placeholders: replace with your team's names and roles
  { name: "Name Surname", role: "Role" },
  { name: "Name Surname", role: "Role" },
  { name: "Name Surname", role: "Role" },
  { name: "Name Surname", role: "Role" },
  { name: "Name Surname", role: "Role" },
];

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

/**
 * Section 07: Team — set like film credits: centred, the role in small capitals over each
 * name, a small avatar beside the name, and the person's links under it. The nav links to
 * id="team".
 */
export default function Team() {
  return (
    <section id="team" className={styles.team}>
      <p className={styles.kicker}>07 — Team</p>
      <h2 className={styles.heading}>The team behind Tyode</h2>

      <ul className={styles.credits}>
        {TEAM.map((m, i) => (
          <li key={i} className={styles.credit}>
            <p className={styles.role}>{m.role}</p>
            <p className={styles.name}>
              <span className={styles.avatar}>
                {m.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.photo} alt="" />
                ) : (
                  <span aria-hidden="true">{initials(m.name)}</span>
                )}
              </span>
              {m.name}
            </p>
            <div className={styles.links}>
              <a href={m.linkedin ?? "#"} aria-label={`${m.name} on LinkedIn`}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
                </svg>
              </a>
              <a href={m.github ?? "#"} aria-label={`${m.name} on GitHub`}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3" />
                </svg>
              </a>
              <a href={m.email ? `mailto:${m.email}` : "#"} aria-label={`Email ${m.name}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 4h16a2 2 0 0 1 2 2v.4l-10 6.25L2 6.4V6a2 2 0 0 1 2-2zm-2 4.75 9.47 5.92a1 1 0 0 0 1.06 0L22 8.75V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
                </svg>
              </a>
            </div>
          </li>
        ))}
      </ul>

      <p className={styles.note}>Informatics Institute of Technology · University of Westminster</p>
    </section>
  );
}
