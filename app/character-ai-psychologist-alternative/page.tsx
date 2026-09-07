import { SeoLongPage } from "@/components/seo/SeoLongPage";
import { PAGES } from "@/lib/seo-pages";
import { pageMetadata } from "@/lib/seo";

const PAGE = PAGES["character-ai-psychologist-alternative"];
export const metadata = pageMetadata({ title: PAGE.title, description: PAGE.description, path: "/character-ai-psychologist-alternative" });

export default function Page() {
  return <SeoLongPage page={PAGE} path="/character-ai-psychologist-alternative" />;
}
