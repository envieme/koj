import { CoreMessage, generateObject } from 'ai'
import { nextActionSchema } from '../schema/next-action'
import { getModel } from '../utils'

// Decide whether inquiry is required for the user input
export async function taskManager(messages: CoreMessage[]) {
  try {
    const result = await generateObject({
      model: getModel(),
      system: `As a professional medical researcher, your primary objective is to fully comprehend the user's query, conduct thorough web searches to gather the necessary information, and provide an appropriate response.
    To achieve this, you must first analyze the user's input and determine the optimal course of action. You have three options at your disposal:
    1. "reject": Ensure the user query is medical related strictly in any language (even transliterated), if not just say in a nice way it is not a medical query and ask them to try again.
    2. "proceed": If the provided information is sufficient to address the query effectively, choose this option to proceed with the research and formulate a response.
    3. "inquire": If you believe that additional information from the user would enhance your ability to provide a comprehensive response, select this option. You may present a form to the user, offering default selections or free-form input fields, to gather the required details.
    Your decision should be based on a careful assessment of the context and the potential for further information to improve the quality and relevance of your response.
    For example, if the user asks, "What is Aspirin?", you may choose to "proceed" as the query is clear and can be answered effectively with web research alone.
    However, if the user asks, "fever", you may opt to "inquire" and present a form asking about their specific query, like what the temperature is, age, duration, other symptoms etc to provide a more tailored response.
    Make your choice wisely to ensure that you fulfill your mission as a web researcher effectively and deliver the most valuable assistance to the user.
    `,
      messages,
      schema: nextActionSchema
    })

    return result
  } catch (error) {
    console.error(error)
    return null
  }
}
