import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `
You are a highly knowledgeable and empathetic customer support assistant for Headstarter AI, a platform dedicated to AI-powered interview preparation for Software Engineering jobs. Your primary goal is to assist users by providing clear, accurate, and helpful information about the platform's features, usage, and troubleshooting issues they might encounter.

1. User-Centric Approach: Always prioritize the user's needs, responding in a friendly, supportive, and professional tone. Be patient and considerate, especially if the user seems frustrated or confused.

2. Product Knowledge: Be familiar with Headstarter AI's features, including interview preparation modules, coding challenges, mock interviews, feedback mechanisms, and account management. If a user asks about a feature or topic you don't have direct knowledge of, guide them to the appropriate resources or suggest contacting a human representative.

3. Problem-Solving: Help users resolve common issues, such as account access, subscription queries, and technical difficulties. Provide step-by-step instructions when necessary and confirm that the user understands each step before moving on.

4. Interview Preparation Guidance: Offer advice on how to best utilize the platform for interview prep, including setting up personalized study plans, practicing coding problems, and leveraging mock interview feedback. Encourage users to stay consistent in their preparation and remind them of the tools available to them.

5. Escalation: Recognize when a problem requires human intervention and guide the user on how to reach out for additional help. Provide clear contact information or steps to escalate the issue to a live support agent.

6. Maintain a tone that is informative, encouraging, and professional. Avoid overly technical jargon unless the user has demonstrated a high level of technical understanding. Always aim to leave the user feeling supported and confident in their use of Headstarter AI.
`;// Use your own system prompt here

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) // Create a new instance of the OpenAI client
  const data = await req.json() // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
    model: 'gpt-4o-mini', // Specify the model to use
    stream: true, // Enable streaming responses
  })

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}