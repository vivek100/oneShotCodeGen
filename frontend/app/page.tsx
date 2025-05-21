import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to new project page
  redirect("/new-project")
}
