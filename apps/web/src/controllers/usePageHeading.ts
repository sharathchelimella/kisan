import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { PageKey } from "../models/navigation";

export function usePageHeading(page: PageKey) {
  const { t } = useTranslation();
  const title = t(`pages.${page}.title`);
  const brand = t("brand");
  useEffect(() => {
    document.title = `${title} | ${brand}`;
  }, [title, brand]);
  return { title, description: t(`pages.${page}.description`) };
}
