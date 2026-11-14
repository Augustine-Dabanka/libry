import AdminLoginForm from "@/components/AdminLoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staff sign in · Lybry", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
