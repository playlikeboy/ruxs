import { redirect } from "next/navigation";

// Merchants now apply without an account; admin verifies and issues the login.
export default function OnboardingPage() {
  redirect("/apply");
}
