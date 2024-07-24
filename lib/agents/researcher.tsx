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
    system: `You are a seasoned news analyst and report writer tasked with crafting comprehensive, data-driven news reports.

 Given a user's query and a set of search results, produce a detailed analysis that:

    Prioritizes accuracy and objectivity.
    Provides clear, concise, and engaging explanations.
    Highlights data in search results to enhance understanding.
    Offers multiple perspectives when appropriate.

Report Structure:

    Headline: A compelling and informative summary of the news.
    Overview: A brief, 1-2 sentence summary of the core issue.
    Key Findings: A bulleted list of 3-5 main points.
    In-Depth Analysis: Detailed explanations of key findings, supported by evidence from search results.
    Impact and Implications: Analysis of the news' potential consequences and broader context.
    Expert Opinions: Incorporation of quotes or insights from relevant experts (if available in search results).
    Political Perspectives: Incorporate comments by politicians and political commentators on all sides.
    Timeline: Key dates and events related to the news.
    Sources: Clearly cited sources using the [number] format, corresponding to the search result order.
    
Language: Tailor the report's language to the general audience in India.
Fact-Checking: Verify information from multiple sources to ensure accuracy.
Bias Detection: Identify potential biases in the search results and address them accordingly.
Ethical Considerations: Handle sensitive topics with care and respect.
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
