import { beforeEach, describe, expect, it, vi } from "vitest"

import { createCostTracker } from "../src/utils/cost-tracker"
import { executeV0, v0ExecutableTool, v0Tool } from "../src/tools/v0"

// Mock the Vercel AI SDK
vi.mock('@ai-sdk/vercel', () => ({
  vercel: vi.fn().mockImplementation(() => ({
    modelId: 'v0-1.0-md',
    provider: 'vercel',
  }))
}))

vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: 'Mock v0 generated UI component with React and Tailwind CSS',
    usage: {
      promptTokens: 100,
      completionTokens: 300,
      totalTokens: 400,
    },
    finishReason: 'stop',
  })
}))

describe("v0 Tool", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("v0Tool Schema", () => {
    it("should have correct structure", () => {
      expect(v0Tool).toEqual({
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
      })
    })

    it("should have required function properties", () => {
      expect(v0Tool).toHaveProperty("type", "function")
      expect(v0Tool.function).toHaveProperty("name", "v0")
      expect(v0Tool.function).toHaveProperty("description")
      expect(v0Tool.function).toHaveProperty("parameters")
      expect(v0Tool.function).toHaveProperty("strict", true)
    })

    it("should require prompt and apiKey parameters", () => {
      expect(v0Tool.function.parameters.required).toEqual([
        "prompt",
        "apiKey",
      ])
    })

    it("should have additionalProperties set to false", () => {
      expect(v0Tool.function.parameters.additionalProperties).toBe(false)
    })

    it("should have enum for modelName", () => {
      expect(v0Tool.function.parameters.properties.modelName.enum).toEqual([
        "v0-1.0-md", 
        "v0-1.0-sm"
      ])
    })

    it("should include maxTokens parameter for cost-aware usage", () => {
      expect(v0Tool.function.parameters.properties.maxTokens).toEqual({
        type: "number",
        description: "Maximum number of tokens to generate (optional, will use cost-aware default if not specified)",
      })
    })
  })

  describe("v0ExecutableTool", () => {
    it("should extend tool with execute function", () => {
      expect(v0ExecutableTool.type).toBe(v0Tool.type)
      expect(v0ExecutableTool.function).toEqual(v0Tool.function)
      expect(v0ExecutableTool).toHaveProperty("execute")
      expect(typeof v0ExecutableTool.execute).toBe("function")
    })
  })

  describe("executeV0 function", () => {
    describe("successful execution without cost tracking", () => {
      it("should execute with required parameters", async () => {
        const result = await executeV0({
          prompt: "Create a modern login form",
          apiKey: "test-api-key",
          modelName: "v0-1.0-md",
        })

        expect(result).toEqual({
          success: true,
          response: "Mock v0 generated UI component with React and Tailwind CSS",
          model: "v0-1.0-md",
          usage: {
            promptTokens: 100,
            completionTokens: 300,
            totalTokens: 400,
          },
        })
      })

      it("should use default model when not provided", async () => {
        const result = await executeV0({
          prompt: "Create a dashboard component",
          apiKey: "test-api-key",
        })

        expect(result.success).toBe(true)
        expect(result.response).toContain("Mock v0 generated UI component")
        expect(result.model).toBe("v0-1.0-md")
      })

      it("should handle custom maxTokens", async () => {
        const result = await executeV0({
          prompt: "Create a complex e-commerce website",
          apiKey: "test-api-key",
          modelName: "v0-1.0-md",
          maxTokens: 2000,
        })

        expect(result.success).toBe(true)
        expect(result.model).toBe("v0-1.0-md")
      })

      it("should work with v0-1.0-sm model", async () => {
        const result = await executeV0({
          prompt: "Create a simple button component",
          apiKey: "test-api-key",
          modelName: "v0-1.0-sm",
        })

        expect(result.success).toBe(true)
        expect(result.model).toBe("v0-1.0-sm")
      })
    })

    describe("cost-aware execution", () => {
      it("should enforce budget limits", async () => {
        const insufficientBudget = createCostTracker(1) // Only 1 cent

        await expect(executeV0({
          prompt: "Create a comprehensive web application with multiple pages",
          apiKey: "test-api-key",
          modelName: "v0-1.0-md",
        }, insufficientBudget)).rejects.toThrow("Insufficient budget")
      })

      it("should use cost-aware token limits", async () => {
        const costTracker = createCostTracker(1000) // $10 budget
        
        const result = await executeV0({
          prompt: "Create a modern dashboard",
          apiKey: "test-api-key",
          modelName: "v0-1.0-md",
        }, costTracker)

        expect(result.success).toBe(true)
        expect(result.costTracker).toBeDefined()
      })

      it("should track usage when cost tracker provided", async () => {
        const costTracker = createCostTracker(500) // $5 budget
        
        const result = await executeV0({
          prompt: "Create a landing page",
          apiKey: "test-api-key",
          modelName: "v0-1.0-md",
        }, costTracker)

        expect(result.costTracker).toBeDefined()
        expect(result.costTracker.totalQueries).toBeGreaterThan(0)
        expect(result.costTracker.toolQueries).toBeGreaterThan(0)
      })

      it("should handle missing usage metadata gracefully", async () => {
        // Mock generateText to return no usage
        const { generateText } = await import('ai')
        vi.mocked(generateText).mockResolvedValueOnce({
          text: 'Mock response without usage',
          usage: null,
          finishReason: 'stop',
        } as any)

        const costTracker = createCostTracker(500)
        
        const result = await executeV0({
          prompt: "Create a simple form",
          apiKey: "test-api-key",
          modelName: "v0-1.0-md",
        }, costTracker)

        expect(result.success).toBe(true)
        expect(result.usage).toBeNull()
      })
    })

    describe("error handling", () => {
      it("should handle v0 API errors gracefully", async () => {
        const { generateText } = await import('ai')
        vi.mocked(generateText).mockRejectedValueOnce(new Error("v0 API rate limit exceeded"))

        await expect(executeV0({
          prompt: "Create a component",
          apiKey: "invalid-key",
          modelName: "v0-1.0-md",
        })).rejects.toThrow("v0 execution failed: v0 API rate limit exceeded")
      })

      it("should handle network errors", async () => {
        const { generateText } = await import('ai')
        vi.mocked(generateText).mockRejectedValueOnce(new Error("Network connection failed"))

        await expect(executeV0({
          prompt: "Create a component",
          apiKey: "test-key",
          modelName: "v0-1.0-md",
        })).rejects.toThrow("v0 execution failed: Network connection failed")
      })

      it("should handle malformed responses", async () => {
        const { generateText } = await import('ai')
        vi.mocked(generateText).mockRejectedValueOnce(new Error("Invalid response format"))

        await expect(executeV0({
          prompt: "Create a component",
          apiKey: "test-key",
          modelName: "v0-1.0-md",
        })).rejects.toThrow("v0 execution failed: Invalid response format")
      })
    })

    describe("parameter validation", () => {
      it("should handle empty prompts", async () => {
        const result = await executeV0({
          prompt: "",
          apiKey: "test-key",
          modelName: "v0-1.0-md",
        })

        expect(result.success).toBe(true)
      })

      it("should handle very long prompts", async () => {
        const longPrompt = "Create a component ".repeat(1000)
        
        const result = await executeV0({
          prompt: longPrompt,
          apiKey: "test-key",
          modelName: "v0-1.0-md",
        })

        expect(result.success).toBe(true)
      })

      it("should work with UI-specific prompts", async () => {
        const uiPrompts = [
          "Create a modern login form with email and password",
          "Build a responsive navigation header",
          "Design a pricing table with three tiers",
          "Create a hero section for a landing page",
          "Build a dashboard with charts and metrics",
        ]

        for (const prompt of uiPrompts) {
          const result = await executeV0({
            prompt,
            apiKey: "test-key",
            modelName: "v0-1.0-sm",
          })

          expect(result.success).toBe(true)
          expect(result.response).toContain("Mock v0 generated")
        }
      })
    })

    describe("integration scenarios", () => {
      it("should work in a design workflow", async () => {
        const costTracker = createCostTracker(1000)

        // Step 1: Create a basic component
        const component = await executeV0({
          prompt: "Create a user profile card component",
          apiKey: "test-key",
          modelName: "v0-1.0-md",
        }, costTracker)

        expect(component.success).toBe(true)

        // Step 2: Create a layout that uses the component
        const layout = await executeV0({
          prompt: "Create a user directory page that displays user profile cards in a grid",
          apiKey: "test-key",
          modelName: "v0-1.0-md",
        }, costTracker)

        expect(layout.success).toBe(true)

        // Verify cost tracking across both calls
        const summary = costTracker.getSummary()
        expect(summary.totalQueries).toBe(2)
        expect(summary.toolQueries).toBe(2)
      })

      it("should handle progressive enhancement prompts", async () => {
        const iterations = [
          "Create a basic button",
          "Make the button responsive with hover effects",
          "Add loading state and icon support to the button",
          "Create variants for primary, secondary, and danger buttons",
        ]

        const costTracker = createCostTracker(2000)

        for (const [index, prompt] of iterations.entries()) {
          const result = await executeV0({
            prompt,
            apiKey: "test-key",
            modelName: "v0-1.0-sm",
          }, costTracker)

          expect(result.success).toBe(true)
          expect(result.costTracker?.totalQueries).toBe(index + 1)
        }
      })
    })
  })
})