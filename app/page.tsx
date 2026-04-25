import { redirect } from "next/navigation";

export default function Home() {
  // BajetHidup is an app-first experience. 
  // We bypass a landing page and go straight to the dashboard.
  redirect("/dashboard");
}
