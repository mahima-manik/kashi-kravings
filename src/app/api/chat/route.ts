import { streamText, tool, stepCountIs, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

const model = openai('o4-mini');

export async function POST(req: Request) {
  const { messages } = await req.json();
  const messagesArray = await convertToModelMessages(messages);
  const result = streamText({
    model: model,
    system: `You are a helpful data assistant for Kashi Kravings, a paan and Indian sweets company.
You answer questions about stores, invoices, sales, and aging reports using the tools available to you.
Always use the tools to fetch real data before answering — never make up numbers.
Format currency values in Indian Rupees (₹). Be concise and helpful.`,
    messages: messagesArray,
    tools: {
      listStores: tool({
        description: 'List all stores with their codes and names',
        inputSchema: z.object({}),
        execute: async () => {
          const { data, error } = await supabase
            .from('stores')
            .select('code, name')
            .order('name');
          if (error) throw error;
          return { stores: data ?? [] };
        },
      }),
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
