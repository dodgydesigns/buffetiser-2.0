export async function fetchHealth() {
  const response = await fetch('/api/v1/health')
  if (!response.ok) {
    throw new Error('Health check failed')
  }
  return response.json()
}
