export interface Faq {
  _id?: string; 
  question: string;
  answer: string;
  }

export interface Topic {
  name: string;
  faqs: Faq[];
}

export interface Fact {
  id?: string;
  title: string;
  content: string;
}

export interface ConversationBox {
  sessionId: string;
  phoneId: string;
  conversation: any[];
}

export interface AnalyticsBox{
  date: string;
  uniqueSessions: number;
  sessions: { sessionId: string; phoneNumber: string; _id?: string }[];
}