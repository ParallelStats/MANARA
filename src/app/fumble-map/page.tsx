import type { Metadata } from "next";

import { FumbleMapExperience } from "@/features/insights/components/fumble-map-experience";

export const metadata: Metadata = {
  title: "Your Fumble Map · خريطة تعلّمك",
  description: "A personal view of your spoken-Arabic journey · نظرة شخصية إلى مسار رحلتك في العربية المحكية.",
};

export default function FumbleMapPage() {
  return <FumbleMapExperience />;
}
