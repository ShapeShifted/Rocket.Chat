// helper to build QnA payloads (same shape used by Angular helper)
import type { Topic } from '../shared/types';

export function generateQnaFormat(topic: Topic) {
  const documents = topic.faqs.map(faq => ({
    question: faq.question,
    answer: faq.answer,
    topic: topic.name,
    source: 'QnA_Answers',
  }));
  return {
    type: 'qna',
    documents,
  };
}