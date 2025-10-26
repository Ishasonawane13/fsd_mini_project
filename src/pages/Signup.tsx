import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SignupForm {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
}

interface PasswordStrength {
    score: number;
    feedback: string[];
    color: string;
}

export const Signup = () => {
    const [formData, setFormData] = useState<SignupForm>({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { register } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (error) setError(''); // Clear error when user starts typing
    };

    const calculatePasswordStrength = (password: string): PasswordStrength => {
        let score = 0;
        const feedback: string[] = [];

        if (password.length === 0) {
            return { score: 0, feedback: ['Enter a password'], color: 'bg-gray-200' };
        }

        if (password.length >= 8) {
            score += 1;
        } else {
            feedback.push('At least 8 characters');
        }

        if (/[a-z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('Include lowercase letters');
        }

        if (/[A-Z]/.test(password)) {
            score += 1;
        } else {
            feedback.push('Include uppercase letters');
        }

        if (/\d/.test(password)) {
            score += 1;
        } else {
            feedback.push('Include numbers');
        }

        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            score += 1;
        } else {
            feedback.push('Include special characters');
        }

        const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
        const color = colors[Math.min(score - 1, 4)] || 'bg-gray-200';

        return { score, feedback, color };
    };

    const passwordStrength = calculatePasswordStrength(formData.password);

    const validateForm = (): boolean => {
        if (!formData.firstName.trim()) {
            setError('First name is required');
            return false;
        }

        if (!formData.lastName.trim()) {
            setError('Last name is required');
            return false;
        }

        if (!formData.username.trim()) {
            setError('Username is required');
            return false;
        }

        if (formData.username.length < 3) {
            setError('Username must be at least 3 characters long');
            return false;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            setError('Username can only contain letters, numbers, and underscores');
            return false;
        }

        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }

        if (!formData.email.includes('@')) {
            setError('Please enter a valid email address');
            return false;
        }

        if (!formData.password) {
            setError('Password is required');
            return false;
        }

        if (passwordStrength.score < 3) {
            setError('Password is too weak. Please make it stronger.');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        if (!formData.acceptTerms) {
            setError('You must accept the terms and conditions');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setLoading(true);

        try {
            await register({
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                username: formData.username.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password
            });

            toast({
                title: "Account Created!",
                description: "Welcome to HackPlanner! Your account has been created successfully.",
            });

            // Redirect to dashboard after successful registration
            navigate('/', { replace: true });

        } catch (err: any) {
            console.error('Registration error:', err);

            // Handle different error types
            if (err.message?.includes('already exists')) {
                setError('An account with this email or username already exists.');
            } else if (err.message?.includes('Network')) {
                setError('Network error. Please check your connection and try again.');
            } else if (err.message?.includes('429')) {
                setError('Too many registration attempts. Please try again later.');
            } else {
                setError(err.message || 'Registration failed. Please try again.');
            }

            toast({
                title: "Registration Failed",
                description: error || "Please check your information and try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4 py-8">
            <div className="w-full max-w-lg">
                {/* Logo/Brand Section */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-primary rounded-lg p-3">
                            <UserPlus className="h-8 w-8 text-primary-foreground" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Join HackPlanner</h1>
                    <p className="text-gray-600 mt-2">Start organizing your hackathon journey</p>
                </div>

                {/* Signup Form */}
                <Card className="shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
                        <CardDescription className="text-center">
                            Enter your information to get started
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name Fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        placeholder="John"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        disabled={loading}
                                        autoComplete="given-name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        placeholder="Doe"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        disabled={loading}
                                        autoComplete="family-name"
                                    />
                                </div>
                            </div>

                            {/* Username Field */}
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        id="username"
                                        name="username"
                                        type="text"
                                        placeholder="johndoe"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="pl-10"
                                        disabled={loading}
                                        autoComplete="username"
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Only letters, numbers, and underscores. At least 3 characters.
                                </p>
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="pl-10"
                                        disabled={loading}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Create a strong password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="pl-10 pr-10"
                                        disabled={loading}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        disabled={loading}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {formData.password && (
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                                                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-600">
                                                {passwordStrength.score < 3 ? 'Weak' : passwordStrength.score < 5 ? 'Good' : 'Strong'}
                                            </span>
                                        </div>
                                        {passwordStrength.feedback.length > 0 && (
                                            <div className="text-xs text-gray-600">
                                                {passwordStrength.feedback.map((item, index) => (
                                                    <div key={index} className="flex items-center space-x-1">
                                                        <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                                        <span>{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Repeat your password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="pl-10 pr-10"
                                        disabled={loading}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        disabled={loading}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {formData.confirmPassword && (
                                    <div className="flex items-center space-x-2 text-xs">
                                        {formData.password === formData.confirmPassword ? (
                                            <><Check className="h-3 w-3 text-green-600" /><span className="text-green-600">Passwords match</span></>
                                        ) : (
                                            <span className="text-red-600">Passwords do not match</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Terms and Conditions */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="acceptTerms"
                                    name="acceptTerms"
                                    checked={formData.acceptTerms}
                                    onCheckedChange={(checked) =>
                                        setFormData(prev => ({ ...prev, acceptTerms: !!checked }))
                                    }
                                    disabled={loading}
                                />
                                <label htmlFor="acceptTerms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    I agree to the{' '}
                                    <Link to="/terms" className="text-blue-600 hover:underline">
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link to="/privacy" className="text-blue-600 hover:underline">
                                        Privacy Policy
                                    </Link>
                                </label>
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Create Account
                                    </>
                                )}
                            </Button>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Already have an account?
                                    </span>
                                </div>
                            </div>

                            {/* Sign In Link */}
                            <div className="text-center">
                                <Link
                                    to="/login"
                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                >
                                    Sign in to your account
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Signup;