import { Scan } from "./_components/scan";
import { SettingsHeader } from "./_components/settings-header";

const SettingsPage = () => {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 pb-10">
      <SettingsHeader />
      <Scan />
    </div>
  );
};

export default SettingsPage;
