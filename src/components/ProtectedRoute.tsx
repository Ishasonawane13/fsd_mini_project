import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
    requireAuth?: boolean; // If false, redirect authenticated users away (for login/signup pages)
    redirectTo?: string; // Where to redirect if access is denied
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requireAuth = true,
    redirectTo
}) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (requireAuth) {
        // Protected route - require authentication
        if (!isAuthenticated) {
            // Redirect to login page, saving the attempted location
            return <Navigate to="/login" state={{ from: location }} replace />;
        }
    } else {
        // Public route (login/signup) - redirect if already authenticated
        if (isAuthenticated) {
            // Check if there's a redirect destination from state
            const from = location.state?.from?.pathname || redirectTo || '/';
            return <Navigate to={from} replace />;
        }
    }

    // Render the protected content
    return <>{children}</>;
};

export default ProtectedRoute;