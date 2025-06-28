/**
 * Tool Testing Script
 * Test all available tools with proper API keys
 */

import { executeAnthropic } from "./src/tools/anthropic"
import { executeOpenAi } from "./src/tools/openai"
import { executeV0 } from "./src/tools/v0"
import { createCostTracker } from "./src/utils/cost-tracker"

// Test configuration
const TEST_CONFIG = {
  apiKeys: {
    openai: process.env.OPENAI_API_KEY || "your-openai-api-key",
    anthropic: process.env.ANTHROPIC_API_KEY || "your-anthropic-api-key",
    vercel: process.env.VERCEL_API_KEY || "your-vercel-api-key",
  },
  prompts: {
    simple: "Hello, how are you?",
    complex: "Explain the concept of machine learning in simple terms",
    creative: "Write a short poem about AI and creativity",
    ui: "Create a modern login form with email and password fields, styled with Tailwind CSS",
    dashboard: "Build a dashboard component with charts showing user analytics",
  },
  budgets: {
    small: 50, // 50 cents
    medium: 200, // $2.00
    large: 500, // $5.00
  },
}

/**
 * Test OpenAI tool
 */
async function testOpenAI() {
  console.log("\n=== Testing OpenAI Tool ===")

  try {
    // Test without cost tracking
    console.log("1. Testing without cost tracking...")
    const result1 = await executeOpenAi({
      message: TEST_CONFIG.prompts.simple,
      apiKey: TEST_CONFIG.apiKeys.openai,
      modelName: "gpt-3.5-turbo",
    })
    console.log("✅ Success:", result1.response.substring(0, 100) + "...")

    // Test with cost tracking
    console.log("2. Testing with cost tracking...")
    const costTracker = createCostTracker(TEST_CONFIG.budgets.medium)
    const result2 = await executeOpenAi({
      message: TEST_CONFIG.prompts.complex,
      apiKey: TEST_CONFIG.apiKeys.openai,
      modelName: "gpt-4",
      maxTokens: 1000,
    }, costTracker)
    console.log("✅ Success with cost tracking")
    console.log("📊 Cost:", result2.costTracker?.totalCostCents, "cents")
    console.log("🎯 Budget used:", result2.costTracker?.budgetUsedPercentage.toFixed(1) + "%")

  } catch (error) {
    console.error("❌ OpenAI test failed:", error instanceof Error ? error.message : error)
  }
}

/**
 * Test Anthropic tool
 */
async function testAnthropic() {
  console.log("\n=== Testing Anthropic Tool ===")

  try {
    // Test without cost tracking
    console.log("1. Testing without cost tracking...")
    const result1 = await executeAnthropic({
      message: TEST_CONFIG.prompts.creative,
      apiKey: TEST_CONFIG.apiKeys.anthropic,
      modelName: "claude-3-haiku-20240307",
    })
    console.log("✅ Success:", result1.response.substring(0, 100) + "...")

    // Test with cost tracking
    console.log("2. Testing with cost tracking...")
    const costTracker = createCostTracker(TEST_CONFIG.budgets.medium)
    const result2 = await executeAnthropic({
      message: TEST_CONFIG.prompts.complex,
      apiKey: TEST_CONFIG.apiKeys.anthropic,
      modelName: "claude-3-5-sonnet-20240620",
      maxTokens: 1000,
    }, costTracker)
    console.log("✅ Success with cost tracking")
    console.log("📊 Cost:", result2.costTracker?.totalCostCents, "cents")
    console.log("🎯 Budget used:", result2.costTracker?.budgetUsedPercentage.toFixed(1) + "%")

  } catch (error) {
    console.error("❌ Anthropic test failed:", error instanceof Error ? error.message : error)
  }
}

/**
 * Test v0 tool
 */
async function testV0() {
  console.log("\n=== Testing v0 Code Designer Tool ===")

  try {
    // Test UI component generation
    console.log("1. Testing UI component generation...")
    const result1 = await executeV0({
      prompt: TEST_CONFIG.prompts.ui,
      apiKey: TEST_CONFIG.apiKeys.vercel,
      modelName: "v0-1.0-md",
    })
    console.log("✅ Success - Generated UI component")
    console.log("📝 Response length:", result1.response.length, "characters")

    // Test dashboard generation with cost tracking
    console.log("2. Testing dashboard generation with cost tracking...")
    const costTracker = createCostTracker(TEST_CONFIG.budgets.large)
    const result2 = await executeV0({
      prompt: TEST_CONFIG.prompts.dashboard,
      apiKey: TEST_CONFIG.apiKeys.vercel,
      modelName: "v0-1.0-md",
      maxTokens: 2000,
    }, costTracker)
    console.log("✅ Success with cost tracking")
    console.log("📊 Cost:", result2.costTracker?.totalCostCents, "cents")
    console.log("🎯 Budget used:", result2.costTracker?.budgetUsedPercentage.toFixed(1) + "%")
    console.log("📝 Generated code preview:", result2.response.substring(0, 200) + "...")

  } catch (error) {
    console.error("❌ v0 test failed:", error instanceof Error ? error.message : error)
  }
}

/**
 * Test cost tracking across multiple tools
 */
async function testCostTrackingAcrossTools() {
  console.log("\n=== Testing Cost Tracking Across Multiple Tools ===")

  try {
    const sharedBudget = createCostTracker(TEST_CONFIG.budgets.large)
    
    console.log("📊 Starting budget:", sharedBudget.maxCostCents, "cents")

    // Use OpenAI
    console.log("1. Using OpenAI tool...")
    const openaiResult = await executeOpenAi({
      message: "Explain React hooks briefly",
      apiKey: TEST_CONFIG.apiKeys.openai,
      modelName: "gpt-3.5-turbo",
    }, sharedBudget)
    console.log("✅ OpenAI cost:", openaiResult.costTracker?.totalCostCents, "cents")

    // Use Anthropic
    console.log("2. Using Anthropic tool...")
    const anthropicResult = await executeAnthropic({
      message: "Explain state management in React",
      apiKey: TEST_CONFIG.apiKeys.anthropic,
      modelName: "claude-3-haiku-20240307",
    }, sharedBudget)
    console.log("✅ Anthropic cost:", anthropicResult.costTracker?.totalCostCents, "cents")

    // Use v0
    console.log("3. Using v0 tool...")
    const v0Result = await executeV0({
      prompt: "Create a React component that demonstrates state management",
      apiKey: TEST_CONFIG.apiKeys.vercel,
      modelName: "v0-1.0-sm",
    }, sharedBudget)
    console.log("✅ v0 cost:", v0Result.costTracker?.totalCostCents, "cents")

    // Final summary
    const summary = sharedBudget.getSummary()
    console.log("\n📊 Final Cost Summary:")
    console.log("- Total cost:", summary.totalCostCents, "cents")
    console.log("- Budget used:", summary.budgetUsedPercentage.toFixed(1) + "%")
    console.log("- Remaining budget:", summary.remainingBudgetCents, "cents")
    console.log("- Total queries:", summary.totalQueries)
    console.log("- Tool queries:", summary.toolQueries)

  } catch (error) {
    console.error("❌ Multi-tool cost tracking test failed:", error instanceof Error ? error.message : error)
  }
}

/**
 * Test budget exhaustion protection
 */
async function testBudgetExhaustion() {
  console.log("\n=== Testing Budget Exhaustion Protection ===")

  try {
    const tinyBudget = createCostTracker(5) // Only 5 cents
    
    console.log("📊 Testing with tiny budget:", tinyBudget.maxCostCents, "cents")

    const result = await executeV0({
      prompt: "Create a complex e-commerce website with multiple pages and components",
      apiKey: TEST_CONFIG.apiKeys.vercel,
      modelName: "v0-1.0-md",
      maxTokens: 4000, // Large request
    }, tinyBudget)

    console.log("❌ Should not reach here - budget should be exhausted")
    
  } catch (error) {
    if (error instanceof Error && error.message.includes("Insufficient budget")) {
      console.log("✅ Budget protection working correctly")
      console.log("🛡️ Error:", error.message)
    } else {
      console.error("❌ Unexpected error:", error instanceof Error ? error.message : error)
    }
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log("🚀 Starting OpenAgentic Tool Testing Suite")
  console.log("=" .repeat(50))

  await testOpenAI()
  await testAnthropic()
  await testV0()
  await testCostTrackingAcrossTools()
  await testBudgetExhaustion()

  console.log("\n🎉 Testing Complete!")
  console.log("=" .repeat(50))
  console.log("\n💡 Tips:")
  console.log("- Make sure you have valid API keys set in environment variables")
  console.log("- Check the cost tracking results to understand usage patterns")
  console.log("- Try different models and prompts to see cost variations")
  console.log("- Use the v0 tool to generate UI components and applications")
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error)
}

export {
  runAllTests,
  testAnthropic,
  testCostTrackingAcrossTools,
  testOpenAI,
  testV0,
  TEST_CONFIG,
}