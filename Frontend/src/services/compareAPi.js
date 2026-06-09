export async function fetchAiComparison(payload) {
  const res = await fetch(
    "http://localhost:8000/compare-summary",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  )

  return await res.json()
}