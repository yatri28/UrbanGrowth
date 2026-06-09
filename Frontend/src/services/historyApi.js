import axios from 'axios'

const API =
  'http://127.0.0.1:8000'

export async function fetchHistory(
  gridId
) {

  const response =
    await axios.get(

      `${API}/history/${gridId}`

    )

  return response.data
}