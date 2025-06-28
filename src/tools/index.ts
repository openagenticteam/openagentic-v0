import type { Tool, ToolCollection } from "../types"
import { createToolCollection } from "../utils"

// Import all tool implementations
import { anthropicExecutableTool, anthropicTool } from "./anthropic"
import { openaiExecutableTool, openaiTool } from "./openai"
import { v0ExecutableTool, v0Tool } from "./v0"

// Re-export individual tools for direct usage
export { anthropic, anthropicExecutableTool, anthropicTool, executeAnthropic } from "./anthropic"
export { executeOpenAi, openai, openaiExecutableTool, openaiTool } from "./openai"
export { executeV0, v0, v0ExecutableTool, v0Tool } from "./v0"

// Re-export utilities
export { createToolCollection }

// Export tools array for legacy compatibility
export const tools: Tool[] = [openaiTool, anthropicTool, v0Tool]

// Standard tool collection (all available tools)
export const allTools: ToolCollection = createToolCollection([
  openaiExecutableTool,
  anthropicExecutableTool,
  v0ExecutableTool,
])

// Legacy execution function for backward compatibility
export const executeTool = async (toolCall: any, costTracker?: any): Promise<any> => {
  return allTools.execute(toolCall, costTracker)
}