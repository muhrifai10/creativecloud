import { OnboardingWizard } from "./wizard";

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-lg pt-6">
      <p className="text-center text-sm text-muted">Selamat datang di Creative Drive</p>
      <div className="mt-4">
        <OnboardingWizard />
      </div>
    </div>
  );
}
