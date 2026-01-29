import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InventoryItem {
  product_name: string;
  depot_name: string;
  quantity: number;
  min_stock_level: number;
  unit_price: number;
}

interface SalesData {
  order_date: string;
  total_amount: number;
  status: string;
  product_name?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, inventoryData, salesData } = await req.json();
    
    // Input validation
    if (!type || typeof type !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request: type is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!['stock_replenishment', 'sales_trends'].includes(type)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid type: must be stock_replenishment or sales_trends' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (type === 'stock_replenishment') {
      if (!inventoryData || !Array.isArray(inventoryData)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid request: inventoryData must be an array' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (inventoryData.length > 100) {
        return new Response(
          JSON.stringify({ success: false, error: 'Too many inventory items (max 100)' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (type === 'sales_trends') {
      if (!salesData || !Array.isArray(salesData)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid request: salesData must be an array' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (salesData.length > 200) {
        return new Response(
          JSON.stringify({ success: false, error: 'Too many sales items (max 200)' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let prompt = "";
    
    if (type === "stock_replenishment") {
      const inventoryContext = (inventoryData as InventoryItem[])
        .map(i => `${i.product_name} at ${i.depot_name}: ${i.quantity} units (min: ${i.min_stock_level}, price: KES ${i.unit_price})`)
        .join("\n");
      
      prompt = `You are an inventory management AI assistant for Kabras Sugar company. Analyze the following inventory data and provide stock replenishment recommendations.

Current Inventory:
${inventoryContext}

Provide concise, actionable recommendations for:
1. Products that need immediate restocking (below minimum level)
2. Suggested order quantities based on current levels
3. Any patterns or concerns you notice

Format your response as a JSON object with the following structure:
{
  "urgentItems": [{"product": "name", "depot": "name", "currentStock": number, "recommended": number, "reason": "string"}],
  "suggestions": ["string"],
  "insights": "string"
}`;
    } else if (type === "sales_trends") {
      const salesContext = (salesData as SalesData[])
        .slice(0, 50)
        .map(s => `${s.order_date}: KES ${s.total_amount} (${s.status})`)
        .join("\n");
      
      prompt = `You are a sales analytics AI assistant for Kabras Sugar company. Analyze the following recent sales data and provide trend analysis.

Recent Sales:
${salesContext}

Provide insights on:
1. Sales trends (increasing, decreasing, stable)
2. Peak sales periods
3. Recommendations for improving sales
4. Any anomalies or concerns

Format your response as a JSON object with the following structure:
{
  "trend": "increasing" | "decreasing" | "stable",
  "totalRevenue": number,
  "averageOrderValue": number,
  "insights": ["string"],
  "recommendations": ["string"],
  "peakPeriods": ["string"]
}`;
    } else {
      throw new Error("Invalid analysis type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant for a sugar sales management system. Always respond with valid JSON only, no markdown formatting.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content;
    
    // Parse the JSON response
    let parsedContent;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedContent = JSON.parse(cleanContent);
    } catch {
      parsedContent = { rawResponse: content };
    }

    return new Response(JSON.stringify({ success: true, data: parsedContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in ai-suggestions:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
