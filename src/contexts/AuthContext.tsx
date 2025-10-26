import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, type User } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean; // Changed from isLoading for consistency
    login: (email: string, password: string) => Promise<void>;
    register: (userData: {
        username: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const isAuthenticated = !!user && authApi.isAuthenticated();

    // Check if user is already logged in on app startup
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                if (authApi.isAuthenticated()) {
                    const userData = await authApi.getProfile();
                    setUser(userData);
                }
            } catch (error) {
                console.error('Auth initialization failed:', error);
                authApi.logout(); // Clear invalid token
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (email: string, password: string): Promise<void> => {
        try {
            setIsLoading(true);
            const response = await authApi.login(email, password);

            if (response.user) {
                setUser(response.user);
                return; // Success - no return value needed
            }

            throw new Error('Login failed');
        } catch (error) {
            console.error('Login error:', error);
            throw error; // Re-throw to let component handle the error
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (userData: {
        username: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }): Promise<void> => {
        try {
            setIsLoading(true);
            const response = await authApi.register(userData);

            if (response.user) {
                setUser(response.user);
                return; // Success - no return value needed
            }

            throw new Error('Registration failed');
        } catch (error) {
            console.error('Registration error:', error);
            throw error; // Re-throw to let component handle the error
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        authApi.logout();
        setUser(null);
        toast({
            title: "Logged Out",
            description: "You have been successfully logged out.",
        });
    };

    const refreshUser = async () => {
        try {
            if (authApi.isAuthenticated()) {
                const userData = await authApi.getProfile();
                setUser(userData);
            }
        } catch (error) {
            console.error('Failed to refresh user:', error);
            logout(); // Clear invalid session
        }
    };

    const contextValue: AuthContextType = {
        user,
        isAuthenticated,
        loading: isLoading,
        login,
        register,
        logout,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
