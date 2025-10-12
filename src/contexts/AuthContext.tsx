import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, type User } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    register: (userData: {
        username: string;
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }) => Promise<boolean>;
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

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            setIsLoading(true);
            const response = await authApi.login(email, password);

            if (response.user) {
                setUser(response.user);
                toast({
                    title: "Login Successful",
                    description: `Welcome back, ${response.user.firstName}!`,
                });
                return true;
            }

            throw new Error('Login failed');
        } catch (error) {
            console.error('Login error:', error);
            toast({
                title: "Login Failed",
                description: error instanceof Error ? error.message : "Invalid credentials",
                variant: "destructive",
            });
            return false;
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
    }): Promise<boolean> => {
        try {
            setIsLoading(true);
            const response = await authApi.register(userData);

            if (response.user) {
                setUser(response.user);
                toast({
                    title: "Registration Successful",
                    description: `Welcome to Hackathon Hub, ${response.user.firstName}!`,
                });
                return true;
            }

            throw new Error('Registration failed');
        } catch (error) {
            console.error('Registration error:', error);
            toast({
                title: "Registration Failed",
                description: error instanceof Error ? error.message : "Please try again",
                variant: "destructive",
            });
            return false;
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
        isLoading,
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
