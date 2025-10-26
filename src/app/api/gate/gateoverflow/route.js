import axios from "axios";
import { JSDOM } from "jsdom";

// Handler for GET requests
export async function GET(req) {
  try {
    // Parse query parameters from URL
    const { searchParams } = new URL(req.url);
    const solutionUrl = searchParams.get("solutionUrl");

    if (!solutionUrl) {
      return new Response(
        JSON.stringify({ error: "solutionUrl parameter is required" }),
        { status: 400 }
      );
    }

    // Fetch the data from the provided solutionUrl
    const response = await axios.get(solutionUrl);
    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    // Extract question text from paragraphs
    const pTags = document.querySelectorAll(".qa-q-view-content p");
    let questionText = "";
    pTags.forEach((p) => {
      questionText += p.textContent.trim() + "\n";
    });

    // Extract solution content
    const questionSolution =
      document.querySelector(".qa-a-item-content div")?.innerHTML || null;

    // Extract options from the ordered list
    const optionsList = document.querySelectorAll("ol li");

    // Map the options using the specified format: options_A, options_B, etc.
    const result = {
      question: questionText,
      questionSolution: questionSolution,
    };

    // Add options in the required format
    const optionLabels = ["A", "B", "C", "D"];
    for (let i = 0; i < optionsList.length; i++) {
      if (i < optionLabels.length) {
        result[`options_${optionLabels[i]}`] =
          optionsList[i]?.textContent.trim() || "";
      }
    }

    // Return the result as JSON
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error("Error fetching solution details:", error.message);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch solution details: " + error.message,
      }),
      { status: 500 }
    );
  }
}
