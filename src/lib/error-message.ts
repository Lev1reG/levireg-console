import axios from 'axios'

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Couldn't reach the server."
    if (error.response.status === 500)
      return 'Something went wrong on the server.'
  }
  return 'Something went wrong.'
}
