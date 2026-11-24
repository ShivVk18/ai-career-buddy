import NeedsYouQueue from "./_components/NeedsYouQueue";

export const metadata = { title: "Needs you" };

export default async function NeedsYouPage({ searchParams }) {
  const { item } = (await searchParams) || {};
  return <NeedsYouQueue focus={typeof item === "string" ? item : null} />;
}
