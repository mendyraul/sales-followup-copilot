import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "../server/auth";
import { isDemo } from "../server/config";
import WorkspacePage from "./workspace-page";
export const dynamic = "force-dynamic";
export default async function Home() {
  if (!isDemo()) {
    const incoming = await headers();
    const session = await getAuth().api.getSession({ headers: incoming });
    if (!session) redirect("/login");
  }
  return <WorkspacePage />;
}
