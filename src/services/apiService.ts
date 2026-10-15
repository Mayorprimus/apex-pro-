const API_BASE = "/api"

class ApiService {
  private static sessionId: string | null = 
    typeof window !== 'undefined' ? localStorage.getItem("z_session_id") : null

  private static get headers() {
    return {
      "Content-Type": "application/json",
      "x-session-id": this.sessionId || "",
    }
  }

  static setSession(id: string) {
    this.sessionId = id
    if (typeof window !== 'undefined') {
      localStorage.setItem("z_session_id", id)
    }
  }

  static clearSession() {
    this.sessionId = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem("z_session_id")
    }
  }

  static async handleResponse(res: Response) {
    if (!res.ok) {
      let errorMessage = "Unknown error"
      try {
        const text = await res.text()
        console.error('[API Error Response]', res.status, text)
        try {
          const data = JSON.parse(text)
          errorMessage = data.error || data.message || text
        } catch {
          errorMessage = text
        }
      } catch {
        errorMessage = `HTTP ${res.status}: ${res.statusText}`
      }
      throw new Error(errorMessage)
    }
    return res.json()
  }

  // Auth
  static async register(name: string, email: string, password: string, phone?: string, country?: string) {
    console.log('[API] Registering:', { name, email, phone, country })
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone, country }),
    })
    console.log('[API] Register response:', res.status, res.statusText)
    return this.handleResponse(res)
  }

  static async login(email: string, password: string) {
    console.log('[API] Logging in:', { email })
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    console.log('[API] Login response:', res.status, res.statusText)
    return this.handleResponse(res)
  }

  static async logout() {
    this.clearSession()
  }

  // Assets
  static async getAssets() {
    const res = await fetch(`${API_BASE}/assets`)
    return this.handleResponse(res)
  }

  // Payment Settings
  static async getPaymentSettings() {
    const res = await fetch(`${API_BASE}/payment-settings`)
    return this.handleResponse(res)
  }

  static async updatePaymentSettings(settings: any) {
    const res = await fetch(`${API_BASE}/admin/update-payment-settings`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(settings),
    })
    return this.handleResponse(res)
  }

  // User
  static async getMe() {
    const res = await fetch(`${API_BASE}/user/me`, { headers: this.headers })
    return this.handleResponse(res)
  }

  static async claimBonus() {
    const res = await fetch(`${API_BASE}/user/claim-bonus`, {
      method: "POST",
      headers: this.headers
    })
    return this.handleResponse(res)
  }

  static async updateProfile(data: { name?: string; phone?: string; country?: string }) {
    const res = await fetch(`${API_BASE}/user/update-profile`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(data),
    })
    return this.handleResponse(res)
  }

  // Trades
  static async placeTrade(assetId: string, type: 'BUY' | 'SELL', lot: number) {
    const res = await fetch(`${API_BASE}/trades/place?asset=${assetId}`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ type, lot }),
    })
    return this.handleResponse(res)
  }

  // Admin
  static async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: this.headers })
    return this.handleResponse(res)
  }

  static async adjustBalance(userId: string, amount: number) {
    const res = await fetch(`${API_BASE}/admin/adjust-balance`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ userId, amount }),
    })
    return this.handleResponse(res)
  }

  static async setTrend(assetId: string, trend: string, trendRate?: number) {
    const res = await fetch(`${API_BASE}/admin/set-trend`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ assetId, trend, trendRate }),
    })
    return this.handleResponse(res)
  }

  static async updateUserStatus(userId: string, status: string, verified?: boolean) {
    const res = await fetch(`${API_BASE}/admin/update-user-status`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ userId, status, verified }),
    })
    return this.handleResponse(res)
  }

  // Messages
  static async getMessages() {
    const res = await fetch(`${API_BASE}/messages`, { headers: this.headers })
    if (!res.ok) return []
    return this.handleResponse(res)
  }

  static async sendMessage(text: string, sender: string = 'user') {
    const res = await fetch(`${API_BASE}/messages`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ text, sender }),
    })
    return this.handleResponse(res)
  }
}

export { ApiService }