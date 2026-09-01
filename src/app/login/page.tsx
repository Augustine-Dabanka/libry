import LoginGate from "@/components/LoginGate";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; auth?: string }>;
}) {
  const { error, next, auth } = await searchParams;
  const initialTab = auth === "signup" ? "signup" : "login";
  return <LoginGate initialTab={initialTab} next={next} serverError={!!error} />;
}
