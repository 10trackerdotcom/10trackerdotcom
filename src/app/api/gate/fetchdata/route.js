// src/app/api/fetchdata/route.js
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Replace with your Supabase URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Replace with your Supabase API Key
const supabase = createClient(supabaseUrl, supabaseKey);

// Handler for GET requests
export async function GET(req) {
  try {
    // Parse query parameters if any
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic");
    const difficulty = searchParams.get("difficulty");
    const subject = searchParams.get("subject");

    // Query Supabase to filter questions based on parameters
    if (topic || difficulty || subject) {
      let query = supabase.from("gatequestions").select("*");

      if (topic) query = query.eq("topic", topic);
      if (difficulty) query = query.eq("difficulty", difficulty);
      if (subject) query = query.eq("subject", subject);

      const { data, error } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
        });
      }
      return new Response(JSON.stringify(data), { status: 200 });
    } else {
      return new Response(JSON.stringify("No Paramter Available."), {
        status: 200,
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

// Handler for POST requests (if needed for other functionality)
export async function POST(req) {
  try {
    const data = await req.json();
    // Handle POST request logic (e.g., storing data in Supabase)
    return new Response(JSON.stringify({ message: "Data received" }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
