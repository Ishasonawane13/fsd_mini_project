// API Client for MongoDB + JWT Backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Types based on our MongoDB models
export interface User {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
}

export interface Hackathon {
    _id: string;
    title: string;
    description: string;
    organizer: string;
    category: 'AI/ML' | 'Web Development' | 'Mobile Development' | 'Blockchain' | 'IoT' | 'Game Development' | 'Data Science' | 'Cybersecurity' | 'Design' | 'Other';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    location: {
        type: 'online' | 'offline' | 'hybrid';
        venue?: string;
        address?: {
            city: string;
            state: string;
            country: string;
        };
    };
    teamSize: {
        min: number;
        max: number;
    };
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    registrationDeadline: string;
    startDate: string;
    endDate: string;
    links?: {
        website?: string;
        discord?: string;
        slack?: string;
    };
    prizes: Array<{
        position: string;
        amount: number;
        currency: string;
        description: string;
    }>;
    tags: string[];
    requirements?: string[];
    rules?: string[];
    judgingCriteria?: string[];
    views: number;
    featured: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    status: string;
    message: string;
    token?: string;
    user?: User;
}

// JWT Token Management
class TokenManager {
    private static TOKEN_KEY = 'hackathon_hub_token';

    static getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    static setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    static removeToken(): void {
        localStorage.removeItem(this.TOKEN_KEY);
    }

    static getAuthHeaders(): HeadersInit {
        const token = this.getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }
}

// Generic API Request Handler
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...TokenManager.getAuthHeaders(),
    };

    const config: RequestInit = {
        headers: { ...defaultHeaders, ...options.headers },
        ...options,
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

// Authentication API
export const authApi = {
    async login(email: string, password: string): Promise<AuthResponse> {
        // Development fallback: accept a couple of dummy accounts without backend
        if (import.meta.env.DEV) {
            const devAccounts: Record<string, { password: string; user: User }> = {
                '2023.isha.sonawane@ves.ac.in': {
                    password: '1234@5678@910',
                    user: { id: 'dev-isha', username: 'isha', email: '2023.isha.sonawane@ves.ac.in', firstName: 'Isha', lastName: 'Sonawane', role: 'user', isActive: true }
                },
                '2023.amruta.sahu@ves.ac.in': {
                    password: '1234@5678@910',
                    user: { id: 'dev-amruta', username: 'amruta', email: '2023.amruta.sahu@ves.ac.in', firstName: 'Amruta', lastName: 'Sahu', role: 'user', isActive: true }
                }
            };

            const acct = devAccounts[email];
            if (acct && acct.password === password) {
                // Set a dummy token so other code thinks we're authenticated
                const fakeToken = 'dev-token-' + acct.user.id;
                TokenManager.setToken(fakeToken);
                return { status: 'success', message: 'Logged in (dev)', token: fakeToken, user: acct.user } as AuthResponse;
            }
            // fallthrough to real request if not matched
        }

        const response = await apiRequest<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (response.token) {
            TokenManager.setToken(response.token);
        }

        return response;
    },

    async register(userData: {
        username: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }): Promise<AuthResponse> {
        // Dev fallback: create local user without backend
        if (import.meta.env.DEV) {
            // Simple mock response for development only
            const fakeToken = 'dev-token-' + (userData.username || 'dev');
            const user: User = {
                id: 'dev-' + (userData.username || 'user'),
                username: userData.username,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: 'user',
                isActive: true
            };
            TokenManager.setToken(fakeToken);
            return { status: 'success', message: 'Registered (dev)', token: fakeToken, user } as AuthResponse;
        }

        const response = await apiRequest<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });

        if (response.token) {
            TokenManager.setToken(response.token);
        }

        return response;
    },

    async getProfile(): Promise<User> {
        return apiRequest<User>('/auth/profile');
    },

    logout(): void {
        TokenManager.removeToken();
    },

    isAuthenticated(): boolean {
        return !!TokenManager.getToken();
    }
};

// Hackathons API
export const hackathonsApi = {
    async getAll(params?: {
        search?: string;
        status?: string;
        location?: string;
        sortBy?: string;
        page?: number;
        limit?: number;
    }): Promise<{ status: string; message: string; data: { hackathons: Hackathon[]; pagination?: any } }> {
        const queryParams = new URLSearchParams();

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    queryParams.append(key, value.toString());
                }
            });
        }

        const endpoint = `/hackathons${queryParams.toString() ? `?${queryParams}` : ''}`;
        return apiRequest(endpoint);
    },

    async getScraped(params?: {
        search?: string;
        status?: string;
        location?: string;
        page?: number;
        limit?: number;
    }): Promise<{ status: string; message: string; data: { hackathons: any[]; pagination?: any } }> {
        const queryParams = new URLSearchParams();

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    queryParams.append(key, value.toString());
                }
            });
        }

        const endpoint = `/hackathons/scraped${queryParams.toString() ? `?${queryParams}` : ''}`;
        return apiRequest(endpoint);
    },

    async getAllSources(params?: {
        search?: string;
        source?: 'database' | 'scraped';
        page?: number;
        limit?: number;
    }): Promise<{ status: string; message: string; data: { hackathons: any[]; sources?: any } }> {
        const queryParams = new URLSearchParams();

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    queryParams.append(key, value.toString());
                }
            });
        }

        const endpoint = `/hackathons/all-sources${queryParams.toString() ? `?${queryParams}` : ''}`;
        return apiRequest(endpoint);
    },

    async getById(id: string): Promise<Hackathon> {
        return apiRequest(`/hackathons/${id}`);
    },

    async create(hackathon: Partial<Hackathon>): Promise<Hackathon> {
        return apiRequest('/hackathons', {
            method: 'POST',
            body: JSON.stringify(hackathon),
        });
    },

    async update(id: string, hackathon: Partial<Hackathon>): Promise<Hackathon> {
        return apiRequest(`/hackathons/${id}`, {
            method: 'PUT',
            body: JSON.stringify(hackathon),
        });
    },

    async delete(id: string): Promise<void> {
        return apiRequest(`/hackathons/${id}`, {
            method: 'DELETE',
        });
    },

    async moveToTrash(id: string): Promise<{ status: string; message: string; data: any }> {
        return apiRequest(`/hackathons/${id}/trash`, {
            method: 'PUT',
        });
    },

    async updateStatus(id: string, status: string): Promise<{ status: string; message: string; data: any }> {
        return apiRequest(`/hackathons/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }
};

// Calendar API
export const calendarApi = {
    async addToCalendar(hackathonId: string): Promise<{ success: boolean; message: string; data?: any }> {
        return apiRequest('/calendar', {
            method: 'POST',
            body: JSON.stringify({ hackathonId }),
        });
    },

    async removeFromCalendar(hackathonId: string): Promise<{ success: boolean; message: string }> {
        return apiRequest(`/calendar/${hackathonId}`, {
            method: 'DELETE',
        });
    },

    async getCalendarHackathons(): Promise<{ success: boolean; data: { hackathonIds: string[]; count: number; hackathons?: Hackathon[] } }> {
        return apiRequest('/calendar');
    },

    async isInCalendar(hackathonId: string): Promise<{ success: boolean; data: { isInCalendar: boolean } }> {
        return apiRequest(`/calendar/${hackathonId}`);
    }
};

// Health Check
export const healthApi = {
    async check(): Promise<{ status: string; message: string }> {
        return apiRequest('/health');
    }
};

export { TokenManager };
