import { PageTitle, Glass } from "@/components/ui";
import { QrDisplay } from "@/components/qr-display";

export const dynamic = "force-dynamic";

export default function QrPage() {
  return (
    <>
      <PageTitle title="Lobby QR code" sub="Show this on a screen at the entrance. It changes every 30 seconds, so photos of it stop working." />
      <Glass className="mx-auto max-w-md py-10"><QrDisplay /></Glass>
    </>
  );
}
