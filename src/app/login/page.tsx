import LoginGate from "@/components/LoginGate";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; auth?: string; ref?: string }>;
}) {
  const { error, next, auth, ref } = await searchParams;
  const initialTab = auth === "signup" ? "signup" : "login";
  return <LoginGate initialTab={initialTab} next={next} serverError={!!error} referrer={ref} />;
}
