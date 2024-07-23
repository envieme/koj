import { createStreamableUI, createStreamableValue } from 'ai/rsc'
import { CoreMessage, ToolCallPart, ToolResultPart, streamText } from 'ai'
import { getTools } from './tools'
import { getModel, transformToolMessages } from '../utils'
import { AnswerSection } from '@/components/answer-section'

export async function researcher(
  uiStream: ReturnType<typeof createStreamableUI>,
  streamableText: ReturnType<typeof createStreamableValue<string>>,
  messages: CoreMessage[]
) {
  let fullResponse = ''
  let hasError = false
  let finishReason = ''

  // Transform the messages if using Ollama provider
  let processedMessages = messages
  const useOllamaProvider = !!(
    process.env.OLLAMA_MODEL && process.env.OLLAMA_BASE_URL
  )
  const useAnthropicProvider = !!process.env.ANTHROPIC_API_KEY
  if (useOllamaProvider) {
    processedMessages = transformToolMessages(messages)
  }
  const includeToolResponses = messages.some(message => message.role === 'tool')
  const useSubModel = useOllamaProvider && includeToolResponses

  const streambleAnswer = createStreamableValue<string>('')
  const answerSection = <AnswerSection result={streambleAnswer.value} />

  const currentDate = new Date().toLocaleString()
  const result = await streamText({
    model: getModel(useSubModel),
    maxTokens: 2500,
    system: `You are an expert news analyst and report writer with access to the latest web search results. Your task is to create a comprehensive, data-driven news report based on the user's query. Follow these guidelines:

Search and Analyze:

Utilize web search results to gather information on the news topic.
Focus on reputable sources and recent articles.


Report Structure:

Title: Create a concise, informative title for the report.
Summary: Provide a brief overview of the news (2-3 sentences).
Key Points: List 3-5 main takeaways from the news.
Detailed Analysis: Expand on the key points with supporting information.


Data and Statistics Focus:

Prioritize quantitative data and statistics related to the news.
Include relevant charts, graphs, or infographics if available.
Explain the significance of the data in the context of the news.


Contextual Information:

Provide background information necessary to understand the news.
Explain any technical terms or concepts for a general audience.


Multiple Perspectives:

Present different viewpoints or interpretations of the news, if applicable.
Highlight any controversies or debates surrounding the topic.


Source Citation:

Use the [number] format to cite sources, where 'number' corresponds to the search result order.
Include multiple citations as needed: [number], [number].
Only use URLs provided in the search results or by the user.


Language and Accessibility:

Match the language of the response to the user's language.
Ensure the report is accessible to a general audience while maintaining accuracy.


Timeliness:

Include the current date and time: ${currentDate}
Highlight how recent the news is and its relevance to current events.


Limitations and Disclaimer:

Clearly state if certain information is speculative or unconfirmed.
Mention any significant gaps in available information.


Follow-up Suggestions:

Propose 2-3 related topics or questions for further exploration
    `,
    messages: processedMessages,
    tools: getTools({
      uiStream,
      fullResponse
    }),
    onFinish: async event => {
      finishReason = event.finishReason
      fullResponse = event.text
      streambleAnswer.done()
    }
  }).catch(err => {
    hasError = true
    fullResponse = 'Error: ' + err.message
    streamableText.update(fullResponse)
  })

  // If the result is not available, return an error response
  if (!result) {
    return { result, fullResponse, hasError, toolResponses: [] }
  }

  const hasToolResult = messages.some(message => message.role === 'tool')
  if (!useAnthropicProvider || hasToolResult) {
    uiStream.append(answerSection)
  }

  // Process the response
  const toolCalls: ToolCallPart[] = []
  const toolResponses: ToolResultPart[] = []
  for await (const delta of result.fullStream) {
    switch (delta.type) {
      case 'text-delta':
        if (delta.textDelta) {
          fullResponse += delta.textDelta
          if (useAnthropicProvider && !hasToolResult) {
            streamableText.update(fullResponse)
          } else {
            streambleAnswer.update(fullResponse)
          }
        }
        break
      case 'tool-call':
        toolCalls.push(delta)
        break
      case 'tool-result':
        if (!delta.result) {
          hasError = true
        }
        toolResponses.push(delta)
        break
      case 'error':
        console.log('Error: ' + delta.error)
        hasError = true
        fullResponse += `\nError occurred while executing the tool`
        break
    }
  }
  messages.push({
    role: 'assistant',
    content: [{ type: 'text', text: fullResponse }, ...toolCalls]
  })

  if (toolResponses.length > 0) {
    // Add tool responses to the messages
    messages.push({ role: 'tool', content: toolResponses })
  }

  return { result, fullResponse, hasError, toolResponses, finishReason }
}
