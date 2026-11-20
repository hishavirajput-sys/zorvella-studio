import { createFileRoute } from "@tanstack/react-router";
import { Storefront } from "@/components/storefront";
import { ThankYouContent } from "@/routes/contact";

export const Route = createFileRoute("/contact/thank-you")({
  head: () => ({ meta: [
    { title: "Message Received — ZORVELLAE" },
    { name: "description", content: "Your message to ZORVELLAE has been received." },
    { property: "og:title", content: "Message Received — ZORVELLAE" },
    { property: "og:description", content: "Thank you for contacting ZORVELLAE." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <Storefront><ThankYouContent /></Storefront>,
});