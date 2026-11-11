export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export async function apiGet<T>(path: string, searchParams?: URLSearchParams): Promise<T> {
  const query = searchParams?.toString()
  const url = `${API_BASE}${path}${query ? `?${query}` : ''}`

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    let code: string | undefined

    try {
      const body = (await response.json()) as { error?: { message?: string; code?: string } }
      message = body.error?.message ?? message
      code = body.error?.code
    } catch {
      // ignore parse errors
    }

    throw new ApiError(message, response.status, code)
  }

  return response.json() as Promise<T>
}
