import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { Shield, Mail, Lock, User } from 'lucide-react';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/20 backdrop-blur-sm">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">AfterLife</h1>
          </div>
          <p className="text-slate-300">
            Secure your digital legacy for future generations
          </p>
        </div>

        <Card className="bg-slate-800/60 border-slate-700/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-white text-xl">
              Welcome to AfterLife
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                <TabsTrigger value="signin" className="text-slate-300 data-[state=active]:text-white">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-slate-300 data-[state=active]:text-white">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                   <div className="space-y-2">
                     <Label className="text-slate-200">Email</Label>
                     <EnhancedInput
                       type="email"
                       name="email"
                       value={formData.email}
                       onChange={handleInputChange}
                       className="bg-slate-700/50 border-slate-600 text-white"
                       placeholder="Enter your email"
                       leftIcon={<Mail className="w-4 h-4" />}
                       error={errors.email}
                       success={formData.email && validateEmail(formData.email) && !errors.email}
                       required
                     />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-slate-200">Password</Label>
                     <EnhancedInput
                       type="password"
                       name="password"
                       value={formData.password}
                       onChange={handleInputChange}
                       className="bg-slate-700/50 border-slate-600 text-white"
                       placeholder="Enter your password"
                       leftIcon={<Lock className="w-4 h-4" />}
                       showPasswordToggle
                       error={errors.password}
                       success={formData.password && validatePassword(formData.password) && !errors.password}
                       required
                     />
                   </div>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold"
                  >
                    {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label className="text-slate-200">First Name</Label>
                       <EnhancedInput
                         type="text"
                         name="firstName"
                         value={formData.firstName}
                         onChange={handleInputChange}
                         className="bg-slate-700/50 border-slate-600 text-white"
                         placeholder="First name"
                         leftIcon={<User className="w-4 h-4" />}
                         error={errors.firstName}
                         success={formData.firstName.trim() && !errors.firstName}
                         required
                       />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-slate-200">Last Name</Label>
                       <EnhancedInput
                         type="text"
                         name="lastName"
                         value={formData.lastName}
                         onChange={handleInputChange}
                         className="bg-slate-700/50 border-slate-600 text-white"
                         placeholder="Last name"
                         error={errors.lastName}
                         success={formData.lastName.trim() && !errors.lastName}
                         required
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label className="text-slate-200">Email</Label>
                     <EnhancedInput
                       type="email"
                       name="email"
                       value={formData.email}
                       onChange={handleInputChange}
                       className="bg-slate-700/50 border-slate-600 text-white"
                       placeholder="Enter your email"
                       leftIcon={<Mail className="w-4 h-4" />}
                       error={errors.email}
                       success={formData.email && validateEmail(formData.email) && !errors.email}
                       required
                     />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-slate-200">Password</Label>
                     <EnhancedInput
                       type="password"
                       name="password"
                       value={formData.password}
                       onChange={handleInputChange}
                       className="bg-slate-700/50 border-slate-600 text-white"
                       placeholder="Choose a strong password"
                       leftIcon={<Lock className="w-4 h-4" />}
                       showPasswordToggle
                       error={errors.password}
                       success={formData.password && validatePassword(formData.password) && !errors.password}
                       required
                       minLength={6}
                     />
                   </div>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold"
                  >
                    {loading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;