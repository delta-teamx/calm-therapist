import { SeoLongPage } from "@/components/seo/SeoLongPage";
import { PAGES } from "@/lib/seo-pages";
import { pageMetadata } from "@/lib/seo";

const PAGE = PAGES["is-ai-therapy-safe"];
export const metadata = pageMetadata({ title: PAGE.title, description: PAGE.description, path: "/is-ai-therapy-safe" });

export default function Page() {
  return <SeoLongPage page={PAGE} path="/is-ai-therapy-safe" />;
}
