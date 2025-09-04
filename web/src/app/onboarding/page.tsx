import { cookies } from "next/headers";
import OnboardingPage from "./OnboardingClient";

export const dynamic = "force-dynamic";

export default async function OnboardingWrapper() {
  const store = await cookies();
  const showIntroDefault = !store.get("onboardingIntroSeen");

  return (
    <>
      {/* Guard redirect is handled by middleware; no DOM class mutations needed */}
      <OnboardingPage showIntroDefault={showIntroDefault} />
    </>
  );
}
