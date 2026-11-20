import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getSignedInUser, customerAddressesQueryOptions, saveCustomerAddress, deleteCustomerAddress } from "@/lib/store-data";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/account/addresses")({
  head: () => ({ meta: [
    { title: "Saved Delivery Addresses — ZORVELLAE" },
    { name: "description", content: "Manage saved shipping addresses for your ZORVELLAE customer account." },
    { property: "og:title", content: "Saved Delivery Addresses — ZORVELLAE" },
    { property: "og:description", content: "Your private ZORVELLAE delivery addresses." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(customerAddressesQueryOptions),
  component: AddressesPage,
});

function AddressesPage() {
  const { data: loadedAddresses } = useSuspenseQuery(customerAddressesQueryOptions);
  const addresses = loadedAddresses ?? [];
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const first_name = String(values.get("first_name") ?? "").trim();
    const last_name = String(values.get("last_name") ?? "").trim();
    const address_line_1 = String(values.get("address_line_1") ?? "").trim();
    const address_line_2 = String(values.get("address_line_2") ?? "").trim();
    const city = String(values.get("city") ?? "").trim();
    const region = String(values.get("region") ?? "").trim();
    const postal_code = String(values.get("postal_code") ?? "").trim();
    const country = String(values.get("country") ?? "").trim();
    if ([first_name,last_name,address_line_1,city,region,postal_code,country].some((value) => !value)) return setError("Fill in the required delivery details.");
    setLoading(true);
    setError("");
    try {
      await saveCustomerAddress({ first_name, last_name, address_line_1, address_line_2, city, region, postal_code, country });
      await queryClient.invalidateQueries({ queryKey: ["account", "addresses"] });
      form.reset();
      toast.success("Your delivery address has been saved.");
    } catch {
      setError("Your address could not be saved. Please check the details and try again.");
    }
    setLoading(false);
  }
  async function remove(id: string) {
    try {
      await deleteCustomerAddress(id);
      await queryClient.invalidateQueries({ queryKey: ["account", "addresses"] });
      toast.success("The saved address has been removed.");
    } catch {
      toast.error("That address could not be removed. Please try again.");
    }
  }
  return <><h1>Saved addresses</h1><p className="account-lead">Your delivery details are visible only to you.</p>{addresses.length === 0 ? <p className="account-lead">No saved addresses yet.</p> : <div className="address-list">{addresses.map((address) => <div className="address-card" key={address.id}><p><strong>{address.first_name} {address.last_name}</strong>{address.address_line_2 && <><br />{address.address_line_2}</>}<br />{address.address_line_1}<br />{address.city}, {address.region} {address.postal_code}<br />{address.country}</p><Button variant="ghost" size="sm" onClick={() => void remove(address.id)} aria-label="Remove saved address">Remove</Button></div>)}</div>}<form className="address-form" onSubmit={submit}><strong>Add a delivery address</strong><div className="address-form-grid address-fields">{[{ id: "first_name", label: "First name" },{ id: "last_name", label: "Last name" },{ id: "address_line_1", label: "Address" },{ id: "address_line_2", label: "Address line 2", required: false },{ id: "city", label: "City" },{ id: "region", label: "State / Region" },{ id: "postal_code", label: "Postal code" },{ id: "country", label: "Country" }].map((field) => <label className={`address-form-field ${field.id.startsWith("address_line") ? "form-span-two" : ""}`} key={field.id} htmlFor={field.id}><span>{field.label}</span><input id={field.id} className="store-field" name={field.id} autoComplete={field.id} required={field.required !== false} maxLength={field.id.startsWith("address_line") ? 120 : 80} /></label>)}</div><Button type="submit" className="store-link address-form-submit" disabled={loading}>{loading ? "Saving…" : "Save address"}</Button>{error && <p className="auth-error" role="alert">{error}</p>}</form></>;
}