export type ToolCategory = 'document' | 'media' | 'writing' | 'planning' | 'data';

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ToolCategory;
  color: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}
