import { SeoLongPage } from "@/components/seo/SeoLongPage";
import { PAGES } from "@/lib/seo-pages";
import { pageMetadata } from "@/lib/seo";

const PAGE = PAGES["youper-alternative"];
export const metadata = pageMetadata({ title: PAGE.title, description: PAGE.description, path: "/youper-alternative" });

export default function Page() {
  return <SeoLongPage page={PAGE} path="/youper-alternative" />;
}
