import { notFound } from "next/navigation";
import UiGallery from "./UiGallery";

export const metadata = { title: "ui gallery" };

// Dev-only: 404 in production builds.
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <UiGallery />;
}
