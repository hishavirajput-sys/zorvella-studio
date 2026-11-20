GRANT DELETE ON public.legacy_user_mappings TO authenticated;
CREATE POLICY "Admins can unlink legacy customer mappings" ON public.legacy_user_mappings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE OR REPLACE FUNCTION public.update_order_status(p_order_id UUID, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized to update orders' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('placed', 'processing', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid order status' USING ERRCODE = '22023';
  END IF;
  UPDATE public.orders
  SET status = p_status,
      status_history = COALESCE(status_history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('status', p_status, 'changedAt', now())),
      updated_at = now()
  WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.update_order_status(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_order_status(UUID, TEXT) TO authenticated;