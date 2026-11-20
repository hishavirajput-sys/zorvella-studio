import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function publishedPageContentQueryOptions(pageKey: string) {
  return queryOptions({
    queryKey: ["store", "published-page-content", pageKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_pages")
        .select("page_key,title,body")
        .eq("page_key", pageKey)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}