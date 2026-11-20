import { Link } from "@tanstack/react-router";

import { PageHeading } from "@/components/storefront";

export function ThankYouContent() {
  return <section className="simple-page-content"><PageHeading eyebrow="Thank you" title="Your message has reached us." description="We appreciate you taking the time to get in touch with ZORVELLAE." /><div className="checkout-placeholder"><Link to="/" className="store-link">Return to ZORVELLAE</Link></div></section>;
}