import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

const exampleMessages = [
  {
    heading: 'Tell me about Intestinal Blockage',
    message: 'Intestinal Blockage'
  },
  {
    heading: 'Why am I tired all the time?',
    message: 'Why am I tired all the time?'
  },
  {
    heading: 'How does Aspirin work?',
    message: 'How does Aspirin work?'
  },
  {
    heading: 'What is Alzheimers Disease?',
    message: 'What is Alzheimers Disease?'
  }
]
export function EmptyScreen({
  submitMessage,
  className
}: {
  submitMessage: (message: string) => void
  className?: string
}) {
  return (
    <div className={`mx-auto w-full transition-all ${className}`}>
      <div className="bg-background p-2">
        <div className="mt-4 flex flex-col items-start space-y-2 mb-4">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              name={message.message}
              onClick={async () => {
                submitMessage(message.message)
              }}
            >
              <ArrowRight size={16} className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
