import { redirect } from "next/navigation";

export default function Home() {
  // Simple redirect to login page
  // If user is already authenticated, /login will redirect to /notes
  redirect("/login");
}
