import CountingDemo from "./CountingDemo";
import { PageHead } from "../ui";

export default function Walkthrough() {
  return (
    <>
      <PageHead title="How the count works"
        sub="Follow one green tyre from the building machine to the press, one click at a time. Then try to cheat the count and see how each attempt is caught." />
      <CountingDemo embedded />
    </>
  );
}
