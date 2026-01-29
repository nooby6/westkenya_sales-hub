import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'low_stock' | 'order_confirmation' | 'shipment_update' | 'return_processed';
  to: string;
  subject?: string;
  data: Record<string, unknown>;
}

const getEmailTemplate = (type: string, data: Record<string, unknown>): { subject: string; html: string } => {
  switch (type) {
    case 'low_stock':
      return {
        subject: `⚠️ Low Stock Alert: ${data.productName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626;">Low Stock Alert</h1>
            <p>The following product is running low on stock:</p>
            <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Product:</strong> ${data.productName}</p>
              <p><strong>Current Stock:</strong> ${data.currentStock} units</p>
              <p><strong>Minimum Level:</strong> ${data.minLevel} units</p>
              <p><strong>Depot:</strong> ${data.depotName}</p>
            </div>
            <p>Please restock as soon as possible to avoid stockouts.</p>
          </div>
        `,
      };
    
    case 'order_confirmation':
      return {
        subject: `✅ Order Confirmed: ${data.orderNumber}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #059669;">Order Confirmed</h1>
            <p>Your order has been confirmed and is being processed.</p>
            <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p><strong>Total Amount:</strong> KES ${(data.totalAmount as number)?.toLocaleString()}</p>
              <p><strong>Expected Delivery:</strong> ${data.expectedDelivery}</p>
            </div>
            <p>You will receive another notification when your order is dispatched.</p>
          </div>
        `,
      };
    
    case 'shipment_update':
      return {
        subject: `🚚 Shipment Update: ${data.orderNumber}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">Shipment Update</h1>
            <p>Your shipment status has been updated.</p>
            <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p><strong>Status:</strong> ${data.status}</p>
              <p><strong>Driver:</strong> ${data.driverName}</p>
              <p><strong>Vehicle:</strong> ${data.vehiclePlate}</p>
            </div>
          </div>
        `,
      };
    
    case 'return_processed':
      return {
        subject: `↩️ Return Processed: ${data.orderNumber}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #7c3aed;">Return Processed</h1>
            <p>A sales return has been processed.</p>
            <div style="background: #faf5ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Order Number:</strong> ${data.orderNumber}</p>
              <p><strong>Product:</strong> ${data.productName}</p>
              <p><strong>Quantity:</strong> ${data.quantity} units</p>
              <p><strong>Weight:</strong> ${data.weight} kg</p>
              <p><strong>Reason:</strong> ${data.reason}</p>
            </div>
          </div>
        `,
      };
    
    default:
      return {
        subject: 'Notification from Kabras Sugar',
        html: `<p>${JSON.stringify(data)}</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { type, to, subject, data }: NotificationRequest = await req.json();

    if (!to || !type) {
      throw new Error("Missing required fields: 'to' and 'type'");
    }

    const template = getEmailTemplate(type, data);
    
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Kabras Sugar <notifications@kabras.co.ke>",
        to: [to],
        subject: subject || template.subject,
        html: template.html,
      }),
    });

    const emailResponse = await res.json();

    if (!res.ok) {
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending notification:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
