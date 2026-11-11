import { Suspense } from "react";
import Lookup from "./Lookup";

export default function TyresPage() {
  return (
    <Suspense>
      <Lookup />
    </Suspense>
  );
}
