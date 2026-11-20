import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminGate } from "@/components/admin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [
    { title: "Store Settings — ZORVELLAE" },
    { name: "description", content: "Review and update public contact settings for ZORVELLAE." },
    { property: "og:title", content: "Store Settings — ZORVELLAE" },
    { property: "og:description", content: "Control public settings for the ZORVELLAE store." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData({ queryKey: ["admin", "store-settings"], queryFn: async () => {
    const { data, error } = await supabase.from("store_settings").select("setting_key,setting_value,updated_at").order("setting_key");
    if (error) throw error;
    return data;
  } }),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings } = useSuspenseQuery({ queryKey: ["admin", "store-settings"], queryFn: async () => {
    const { data, error } = await supabase.from("store_settings").select("setting_key,setting_value,updated_at").order("setting_key");
    if (error) throw error;
    return data;
  } });
  const [error, setError] = useState("");
  async function saveSetting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const contactEmail = String(values.get("contact_email") ?? "").trim();
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return setError("Enter a valid customer-care email address.");
    const settingsValue = {
      contactEmail,
      supportPhone: String(values.get("support_phone") ?? "").trim(),
      storeName: String(values.get("store_name") ?? "").trim(),
      currencyCode: String(values.get("currency") ?? "USD").trim().toUpperCase(),
      storeAddress: {
        addressLine1: String(values.get("address_line_1") ?? "").trim(),
        addressLine2: String(values.get("address_line_2") ?? "").trim(),
        city: String(values.get("city") ?? "").trim(),
        region: String(values.get("region") ?? "").trim(),
        postalCode: String(values.get("postal_code") ?? "").trim(),
        country: String(values.get("country") ?? "").trim(),
      },
      taxConfiguration: { ratePercent: String(values.get("tax_rate") ?? "").trim() },
      shippingConfiguration: { flatRate: String(values.get("shipping_rate") ?? "").trim(), serviceName: String(values.get("shipping_service") ?? "").trim() },
      checkoutConfiguration: { allowGuestCheckout: values.get("allow_guest_checkout") === "on" },
    };
    if (!/^[A-Z]{3}$/.test(settingsValue.currencyCode)) return setError("Use a valid three-letter currency code.");
    for (const [label, value] of [["Tax", settingsValue.taxConfiguration.ratePercent], ["Shipping", settingsValue.shippingConfiguration.flatRate]]) {
      if (value && (!Number.isFinite(Number(value)) || Number(value) < 0)) return setError(`${label} must be a non-negative amount.`);
    }
    const { error: saveError } = await supabase.from("store_settings").upsert({ setting_key: "store.configuration", setting_value: settingsValue });
    if (saveError) return setError("The contact details could not be saved.");
    const { error: publicSaveError } = await supabase.from("store_settings").upsert({ setting_key: "public.contact", setting_value: { email: contactEmail || null, phone: settingsValue.supportPhone || null, storeName: settingsValue.storeName || null } });
    if (publicSaveError) return setError("Store settings were saved, but public contact details could not be updated.");
    setError("");
    toast.success("Public customer-care details updated.");
    await queryClient.invalidateQueries({ queryKey: ["admin", "store-settings"] });
  }
  const config = settings.find((setting) => setting.setting_key === "store.configuration")?.setting_value;
  const configField = (key: string) => config && typeof config === "object" && !Array.isArray(config) ? config[key] : undefined;
  const address = configField("storeAddress");
  const addressField = (key: string) => address && typeof address === "object" && !Array.isArray(address) ? address[key] : undefined;
  const tax = configField("taxConfiguration");
  const shipping = configField("shippingConfiguration");
  const checkout = configField("checkoutConfiguration");
  const allowGuest = checkout && typeof checkout === "object" && !Array.isArray(checkout) ? checkout["allowGuestCheckout"] === true : false;
  const stringValue = (value: unknown) => typeof value === "string" ? value : "";
  return <><h2 className="admin-page-heading">Store identity and operating settings</h2><p className="account-lead">Save public business details and future tax, shipping and checkout preferences. Settings alone do not process orders or calculate charges.</p><form className="admin-add-form admin-settings-form" onSubmit={saveSetting}><label>Store name<input className="store-field" name="store_name" maxLength={140} defaultValue={stringValue(configField("storeName"))} /></label><label>Customer-care email<input className="store-field" name="contact_email" type="email" maxLength={254} defaultValue={stringValue(configField("contactEmail"))} /></label><label>Customer-care phone<input className="store-field" name="support_phone" type="tel" maxLength={40} defaultValue={stringValue(configField("supportPhone"))} /></label><label>Currency code<input className="store-field" name="currency" maxLength={3} minLength={3} defaultValue={stringValue(configField("currencyCode")) || "USD"} /></label><h3 className="admin-subheading">Public business address</h3><label>Address line 1<input className="store-field" name="address_line_1" maxLength={180} defaultValue={stringValue(addressField("addressLine1"))} /></label><label>Address line 2<input className="store-field" name="address_line_2" maxLength={180} defaultValue={stringValue(addressField("addressLine2"))} /></label><label>City<input className="store-field" name="city" maxLength={120} defaultValue={stringValue(addressField("city"))} /></label><label>State or region<input className="store-field" name="region" maxLength={120} defaultValue={stringValue(addressField("region"))} /></label><label>Postal code<input className="store-field" name="postal_code" maxLength={30} defaultValue={stringValue(addressField("postalCode"))} /></label><label>Country<input className="store-field" name="country" maxLength={120} defaultValue={stringValue(addressField("country"))} /></label><h3 className="admin-subheading">Tax and shipping preferences</h3><p className="admin-settings-note">Saved for future setup only; not applied to checkout or customer totals.</p><label>Tax rate (%)<input className="store-field" name="tax_rate" type="number" min="0" step="0.001" max="100" defaultValue={stringValue(tax && typeof tax === "object" && !Array.isArray(tax) ? tax["ratePercent"] : "")} /></label><label>Flat shipping rate<input className="store-field" name="shipping_rate" type="number" min="0" step="0.01" defaultValue={stringValue(shipping && typeof shipping === "object" && !Array.isArray(shipping) ? shipping["flatRate"] : "")} /></label><label>Shipping service<input className="store-field" name="shipping_service" maxLength={120} defaultValue={stringValue(shipping && typeof shipping === "object" && !Array.isArray(shipping) ? shipping["serviceName"] : "")} /></label><label className="admin-check-row"><input type="checkbox" name="allow_guest_checkout" defaultChecked={allowGuest} />Allow guest checkout preference for future integration</label><Button type="submit" className="store-link admin-add-button">Save store settings</Button>{error && <p className="auth-error" role="alert">{error}</p>}</form><section className="admin-settings-notice"><h3>Current checkout state</h3><p>Checkout, payments, shipping calculation, and tax collection are not configured. These preferences do not place orders or take payment.</p></section></>;
}