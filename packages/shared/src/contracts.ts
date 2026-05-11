import { z } from "zod";

export const DecisionSchema = z.enum(["pass", "warn", "block"]);

export const AgentTraceSchema = z.object({
  model: z.string(),
  latencyMs: z.number().int().nonnegative(),
  tokenUsage: z.number().int().nonnegative(),
  fallbackUsed: z.boolean()
});

export const AgentOutputSchema = z.object({
  requestId: z.string(),
  agentName: z.string(),
  decision: DecisionSchema,
  confidence: z.number().min(0).max(1),
  trace: AgentTraceSchema
});

export type AgentOutput = z.infer<typeof AgentOutputSchema>;
