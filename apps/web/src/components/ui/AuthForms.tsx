"use client";
import { useActionState, useState } from "react";
import { login, register, type AuthState } from "@/app/actions";

export function AuthForms() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(login, {});
  const [regState, regAction, regPending] = useActionState<AuthState, FormData>(register, {});
  return (
    <div className="card">
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "login"} onClick={() => setTab("login")}>دخول</button>
        <button role="tab" aria-selected={tab === "register"} onClick={() => setTab("register")}>حساب جديد</button>
      </div>
      {tab === "login" ? (
        <form action={loginAction}>
          {loginState.error && <div className="err">{loginState.error}</div>}
          <label className="field">الإيميل<input id="login-email" name="email" type="email" autoComplete="email" required /></label>
          <label className="field">الباسورد<input id="login-password" name="password" type="password" autoComplete="current-password" required /></label>
          <button className="btn go" disabled={loginPending}>{loginPending ? "..." : "ادخل"}</button>
        </form>
      ) : (
        <form action={regAction}>
          {regState.error && <div className="err">{regState.error}</div>}
          <label className="field">اسمك<input id="reg-name" name="name" autoComplete="name" required maxLength={60} /></label>
          <label className="field">الإيميل<input id="reg-email" name="email" type="email" autoComplete="email" required /></label>
          <label className="field">الباسورد (٨ حروف على الأقل)<input id="reg-password" name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
          <button className="btn go" disabled={regPending}>{regPending ? "..." : "اعمل حساب"}</button>
        </form>
      )}
    </div>
  );
}
