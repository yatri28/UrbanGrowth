import axios from 'axios'

const API =
    'https://urbangrowth.onrender.com'

export async function fetchHistory(
  gridId
) {

  const response =
    await axios.get(

      `${API}/history/${gridId}`

    )

  return response.data
}