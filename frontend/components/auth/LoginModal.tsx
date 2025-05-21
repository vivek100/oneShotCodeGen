"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Github, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  redirectAfterLogin?: boolean;
  message?: string;
};

export function LoginModal({ isOpen, onClose, redirectAfterLogin = false, message }: LoginModalProps) {
  const { signIn, signInWithEmail, signUpWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const handleLogin = async (provider: 'github' | 'google') => {
    try {
      setIsLoading(true);
      setAuthError(null);
      await signIn(provider);
      // No need to close modal here as auth state change will trigger a redirect
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('Failed to sign in with provider. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!email || !password) {
      setAuthError('Email and password are required');
      return;
    }
    
    setIsLoading(true);
    try {
      const { error, success } = await signInWithEmail(email, password);
      if (error) {
        setAuthError(error.message);
      } else if (success) {
        onClose(); // Close the modal on successful login
      }
    } catch (error) {
      console.error('Email login error:', error);
      setAuthError('Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!email || !password) {
      setAuthError('Email and password are required');
      return;
    }
    
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    try {
      const { error, success } = await signUpWithEmail(email, password);
      if (error) {
        setAuthError(error.message);
      } else if (success) {
        onClose(); // Close the modal on successful signup
      }
    } catch (error) {
      console.error('Signup error:', error);
      setAuthError('Failed to sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{activeTab === 'login' ? 'Sign in' : 'Create an account'}</DialogTitle>
        </DialogHeader>
        
        {message && (
          <p className="text-sm text-muted-foreground mb-4">{message}</p>
        )}
        
        <div className="flex flex-col gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => handleLogin('github')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-[#24292e] text-white hover:bg-[#2c3038] hover:text-white"
          >
            <Github className="h-4 w-4" />
            Continue with GitHub
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleLogin('google')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 bg-[#4285F4] text-white hover:bg-[#3367D6] hover:text-white"
          >
            <Mail className="h-4 w-4" />
            Continue with Google
          </Button>
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or use email</span>
          </div>
        </div>
        
        <Tabs defaultValue="login" value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
              {authError && (
                <p className="text-sm font-medium text-destructive">{authError}</p>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                Sign In with Email
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input 
                  id="signup-email" 
                  type="email" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input 
                  id="signup-password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
              </div>
              
              {authError && (
                <p className="text-sm font-medium text-destructive">{authError}</p>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
