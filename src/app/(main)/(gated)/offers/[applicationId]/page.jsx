import OfferLive from "@/components/offer/OfferLive";

export const metadata = { title: "Offer" };

export default async function OfferPage({ params }) {
  const { applicationId } = await params;
  return <OfferLive applicationId={applicationId} />;
}
