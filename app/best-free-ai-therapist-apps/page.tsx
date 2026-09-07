import { SeoLongPage } from "@/components/seo/SeoLongPage";
import { PAGES } from "@/lib/seo-pages";
import { pageMetadata } from "@/lib/seo";

const PAGE = PAGES["best-free-ai-therapist-apps"];
export const metadata = pageMetadata({ title: PAGE.title, description: PAGE.description, path: "/best-free-ai-therapist-apps" });

export default function Page() {
  return <SeoLongPage page={PAGE} path="/best-free-ai-therapist-apps" />;
}
