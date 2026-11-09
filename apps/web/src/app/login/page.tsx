import { AuthForms } from "@/components/ui/AuthForms";

export default function LoginPage() {
  return (
    <main className="page">
      <div className="wrap" style={{ maxWidth: 420 }}>
        <h1 className="brand">Speak City</h1>
        <p className="sub">اتعلم أهم ٥٠٠٠ كلمة إنجليزي وإنت ماشي جوه مشاهد ثلاثية الأبعاد وبتكلم الناس.</p>
        <AuthForms />
      </div>
    </main>
  );
}
