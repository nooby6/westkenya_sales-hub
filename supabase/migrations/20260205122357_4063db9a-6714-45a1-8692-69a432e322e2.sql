-- Create delivery incidents table
CREATE TABLE public.delivery_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL,
  incident_type TEXT NOT NULL,
  description TEXT NOT NULL,
  reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_incidents ENABLE ROW LEVEL SECURITY;

-- Drivers can report incidents on their assigned shipments
CREATE POLICY "Drivers can insert incidents for their shipments"
ON public.delivery_incidents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shipments s
    JOIN public.profiles p ON p.phone = s.driver_phone
    WHERE s.id = shipment_id AND p.user_id = auth.uid()
  )
);

-- Drivers can view their own incidents
CREATE POLICY "Drivers can view their incidents"
ON public.delivery_incidents
FOR SELECT
TO authenticated
USING (reported_by = auth.uid());

-- Supervisors and above can view all incidents
CREATE POLICY "Supervisors can view all incidents"
ON public.delivery_incidents
FOR SELECT
TO authenticated
USING (public.is_supervisor_or_higher(auth.uid()));

-- Supervisors and above can update incidents (resolve them)
CREATE POLICY "Supervisors can update incidents"
ON public.delivery_incidents
FOR UPDATE
TO authenticated
USING (public.is_supervisor_or_higher(auth.uid()));