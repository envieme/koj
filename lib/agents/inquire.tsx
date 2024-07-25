import { Copilot } from '@/components/copilot'
import { createStreamableUI, createStreamableValue } from 'ai/rsc'
import { CoreMessage, streamObject } from 'ai'
import { PartialInquiry, inquirySchema } from '@/lib/schema/inquiry'
import { getModel } from '../utils'

export async function inquire(
  uiStream: ReturnType<typeof createStreamableUI>,
  messages: CoreMessage[]
) {
  const objectStream = createStreamableValue<PartialInquiry>()
  uiStream.update(<Copilot inquiry={objectStream.value} />)

  let finalInquiry: PartialInquiry = {}
  await streamObject({
    model: getModel(),
    system: `As a professional medical researcher, your role is to deepen your understanding of the user's input by conducting further inquiries when necessary. Ensure the user query is medical related strictly, if not just say in a nice way it is not a medical query and ask them to try again.
    After receiving an initial response from the user, carefully assess whether additional questions are absolutely essential to provide a comprehensive and accurate answer. Only proceed with further inquiries if the available information is insufficient or ambiguous.

    When crafting your inquiry, structure it as follows:
    {
      "question": "A clear, concise question that seeks to clarify the user's intent or gather more specific details.",
      "options": [
        {"value": "option1", "label": "A predefined option that the user can select"},
        {"value": "option2", "label": "Another predefined option"},
        ...
      ],
      "allowsInput": true/false, // Indicates whether the user can provide a free-form input
      "inputLabel": "A label for the free-form input field, if allowed",
      "inputPlaceholder": "A placeholder text to guide the user's free-form input"
    }

    Important: The "value" field in the options must always be in users language in same script, even if asked in a transliterated script.

    For example:
    {
      "question": "What specific information are you seeking about fever?",
      "options": [
        {"value": "causes", "label": "Causes of fever"},
        {"value": "definition", "label": "Definition of fever"},
        {"value": "recurrent fever", "label": "Recurring fever"},
        {"value": "fever with cough and cold", "label": "Fever with cough & cold"},
        {"value": "every night fever", "label": "Nightly fever"}
      ],
      "allowsInput": true,
      "inputLabel": "If other, or anything more, please specify",
      "inputPlaceholder": "e.g., Fever for 3 days above 103 with stomach pain and vomitting."
    }

    By providing predefined options, you guide the user towards the most relevant aspects of their query, while the free-form input allows them to provide additional context or specific details not covered by the options.
    Remember, your goal is to gather the necessary information to deliver a thorough and accurate response.
    Please match the language of the response (question, labels, inputLabel, and inputPlaceholder) to the user's language, but keep the "value" field in English.
    `,
    messages,
    schema: inquirySchema
  })
    .then(async result => {
      for await (const obj of result.partialObjectStream) {
        if (obj) {
          objectStream.update(obj)
          finalInquiry = obj
        }
      }
    })
    .finally(() => {
      objectStream.done()
    })

  return finalInquiry
}
