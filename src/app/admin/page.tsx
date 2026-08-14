"use client";

import { useEffect, useState } from "react";
import { isAdminAuthed } from "@/lib/admin-auth";
import { useSiteContent } from "@/lib/site-content-context";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const { isLoaded } = useSiteContent();
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // sessionStorage is only available client-side, so this check must run post-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAuthed(isAdminAuthed());
    setChecked(true);
  }, []);

  if (!checked || !isLoaded) return null;

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />;
  }

  return <AdminDashboard onLogout={() => setAuthed(false)} />;
}
