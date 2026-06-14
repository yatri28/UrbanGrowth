export async function fetchAiComparison(payload) {
  const res = await fetch(
    "https://urbangrowth.onrender.com/compare-summary",
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