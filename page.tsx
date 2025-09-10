import { createServerClient } from "@/lib/supabase/server"; // We will create this next
import { notFound } from "next/navigation";

type Props = {
  params: {
    domain: string;
    slug: string[];
  };
};

// This component will render the user's website
export default async function UserSitePage({ params }: Props) {
  const supabase = createServerClient();
  const { domain, slug } = params;

  // Determine the page slug. For the homepage, the slug array will be empty.
  const pageSlug = slug?.join("/") || "/";

  // Fetch website and page data from Supabase
  const { data: website } = await supabase
    .from("websites")
    .select("id, title, pages!inner(slug, content)")
    .eq("subdomain", domain)
    .eq("pages.slug", pageSlug)
    .single();

  if (!website) {
    notFound();
  }

  const page = website.pages[0];

  if (!page) {
    notFound();
  }

  // Here you would have a component that can render the JSONB `content`
  // For now, we'll just display the raw data.
  return (
    <div>
      <h1>Welcome to {website.title || domain}</h1>
      <h2>Page: {page.slug}</h2>
      <pre>{JSON.stringify(page.content, null, 2)}</pre>
      <p>Render your components based on the JSON content above.</p>
    </div>
  );
}
