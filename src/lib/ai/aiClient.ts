// aiClient.ts — backend fetch disabled; all callers use local mock data via geminiAuditService.
// Kept as a no-op stub so existing imports do not break.

export async function callAIEndpoint(_endpoint: string, _payload: object) {
  // Intentionally disabled — no fetch call is made to prevent 404 route errors.
  return {
    isOfflineFallback: true,
    choices: [{ message: { content: null } }],
  };
}
