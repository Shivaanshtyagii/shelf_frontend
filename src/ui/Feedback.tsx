import type { ReactNode } from "react";

export function Feedback({ error, children }: { error?: boolean; children: ReactNode }) {
  return <p role={error ? "alert" : "status"} className={error ? "feedback error" : "feedback"}>{children}</p>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty"><strong>{title}</strong>{children && <div>{children}</div>}</div>;
}
