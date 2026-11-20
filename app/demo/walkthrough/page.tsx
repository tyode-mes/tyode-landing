import CountingDemo from "./CountingDemo";
import { PageHead } from "../ui";

export default function Walkthrough() {
  return (
    <>
      <PageHead title="How the count works"
        sub="Follow one green tyre at the building machine, one click at a time. The count comes from the auto-stitch, linked to the operator's badge. Then try to cheat it and see how each attempt is caught." />
      <CountingDemo embedded />
    </>
  );
}
