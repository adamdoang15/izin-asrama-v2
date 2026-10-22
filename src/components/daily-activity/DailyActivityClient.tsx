"use client";

import type { DailyActivityDataResult } from "@/services/daily-activity.service";
import DailyActivityGelaraView from "./DailyActivityGelaraView";
import DailyActivityPengurusView from "./DailyActivityPengurusView";

interface DailyActivityClientProps {
  initialData: DailyActivityDataResult;
  userRole: "SANTRI" | "PENGURUS";
  userName: string;
}

export default function DailyActivityClient({
  initialData,
  userRole,
  userName,
}: DailyActivityClientProps) {
  if (userRole === "SANTRI") {
    return <DailyActivityGelaraView initialData={initialData} userName={userName} />;
  }

  return <DailyActivityPengurusView initialData={initialData} />;
}
