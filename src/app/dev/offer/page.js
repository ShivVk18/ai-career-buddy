import { notFound } from "next/navigation";
import DevOffer from "./DevOffer";

export const metadata = { title: "offer demo" };

// Dev-only: offer + rejection screens with mock data. 404 in production builds.
// ?mode=offer | offer-bare (no amounts) | compared | closed | closed-empty | other | loading | error | missing
export default async function Page({ searchParams }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { mode = "offer" } = await searchParams;
  return <DevOffer mode={mode} />;
}
