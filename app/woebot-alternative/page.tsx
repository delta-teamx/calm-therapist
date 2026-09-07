import { SeoLongPage } from "@/components/seo/SeoLongPage";
import { PAGES } from "@/lib/seo-pages";
import { pageMetadata } from "@/lib/seo";

const PAGE = PAGES["woebot-alternative"];
export const metadata = pageMetadata({ title: PAGE.title, description: PAGE.description, path: "/woebot-alternative" });

export default function Page() {
  return <SeoLongPage page={PAGE} path="/woebot-alternative" />;
}
