import JobView from "./_components/JobView";

export default async function JobPage({ params, searchParams }) {
  const { id } = await params;
  const { notice } = (await searchParams) || {};
  return <JobView id={id} notice={typeof notice === "string" ? notice : null} />;
}
