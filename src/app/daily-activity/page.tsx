import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDailyActivityData } from "@/services/daily-activity.service";
import DailyActivityClient from "@/components/DailyActivityClient";

type SearchParams = Promise<{
  week?: string;
  month?: string;
  date?: string;
  gelara?: string;
}>;

export default async function DailyActivityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;

  const data = await getDailyActivityData({
    weekId: params.week,
    monthId: params.month,
    date: params.date,
    gelara: params.gelara,
  });

  return (
    <DailyActivityClient
      initialData={data}
      userRole={session.user.role}
      userName={session.user.name || "Gelara"}
    />
  );
}
