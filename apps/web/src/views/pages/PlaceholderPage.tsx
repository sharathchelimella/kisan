import { usePageHeading } from "../../controllers/usePageHeading";
import { pages, type PageKey } from "../../models/navigation";
import { Card, EmptyState } from "../components/ui";

export function PlaceholderPage({ page }: { page: PageKey }) {
  const { title, description } = usePageHeading(page);
  return (
    <section aria-labelledby="page-heading">
      <h1 id="page-heading">{title}</h1>
      <Card className="page-card">
        <EmptyState icon={pages[page].icon} description={description} />
      </Card>
    </section>
  );
}
