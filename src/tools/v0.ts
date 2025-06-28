import { vercel } from '@ai-sdk/vercel'
import { generateText } from 'ai'

import type { CostTracker, Tool, ExecutableTool } from "../types"

/**
 * v0 Code Designer Tool Schema
 * Uses Vercel's v0 model for generating UI components and web applications
 */
export const v0Tool: Tool = {
  type: "function",
  function: {
    name: "v0",
    description: "Use Vercel's v0 AI to generate UI components, web applications, and interactive designs with modern frameworks like Next.js, React, and Tailwind CSS",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "The design prompt describing what UI component or application to create (e.g., 'Create a modern dashboard with charts', 'Build a landing page for a SaaS product')",
        },
        apiKey: {
          type: "string",
          description: "The Vercel API key for accessing v0 AI services",
        },
        modelName: {
          type: "string",
          description: "The v0 model to use for generation",
          enum: ["v0-1.0-md", "v0-1.0-sm"],
        },
        maxTokens: {
          type: "number",
          description: "Maximum number of tokens to generate (optional, will use cost-aware default if not specified)",
        },
      },
      required: ["prompt", "apiKey"],
      additionalProperties: false,
    },
    strict: true,
  },
}

/**
 * v0 Tool Arguments Interface
 */
export interface V0Args {
  prompt: string
  apiKey: string
  modelName?: string
  maxTokens?: number
}

/**
 * Execute v0 AI generation with optional cost tracking
 */
export async function executeV0(
  args: V0Args,
  costTracker?: CostTracker
): Promise<{
  success: boolean
  response: string
  model: string
  usage: any
  costTracker?: any
}> {
  const { prompt, apiKey, modelName = "v0-1.0-md", maxTokens } = args

  // Pre-execution cost check
  if (costTracker) {
    const estimatedCost = costTracker.estimateQueryCost(modelName, prompt.length, maxTokens)
    if (!costTracker.canAfford(estimatedCost)) {
      throw new Error(`Insufficient budget: v0 query estimated to cost ${estimatedCost} cents, but only ${costTracker.getRemainingBudgetCents()} cents remaining`)
    }
  }

  // Determine maxTokens - use cost-aware default if not provided
  let finalMaxTokens = maxTokens
  if (!finalMaxTokens && costTracker) {
    finalMaxTokens = costTracker.getDefaultMaxTokens(modelName)
  }

  try {
    // Initialize v0 model
    const model = vercel(modelName, {
      apiKey,
    })

    // Generate with v0
    const result = await generateText({
      model,
      prompt,
      ...(finalMaxTokens && { maxTokens: finalMaxTokens }),
    })

    // Track usage if cost tracker provided
    if (costTracker && result.usage) {
      const actualCost = costTracker.estimateCost(
        modelName,
        result.usage.promptTokens || 0,
        result.usage.completionTokens || 0
      )

      costTracker.addUsage({
        model: modelName,
        inputTokens: result.usage.promptTokens || 0,
        outputTokens: result.usage.completionTokens || 0,
        costCents: actualCost,
        timestamp: new Date(),
        source: "tool",
        toolName: "v0",
      })
    }

    return {
      success: true,
      response: result.text,
      model: modelName,
      usage: result.usage || null,
      ...(costTracker && { costTracker: costTracker.getSummary() }),
    }
  } catch (error) {
    throw new Error(`v0 execution failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * v0 Executable Tool
 * Combines the tool schema with the execution function
 */
export const v0ExecutableTool: ExecutableTool = {
  ...v0Tool,
  execute: executeV0,
}

// Legacy export for backward compatibility
export const v0 = v0Tool