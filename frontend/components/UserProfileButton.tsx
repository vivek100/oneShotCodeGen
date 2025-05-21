"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { UserIcon, LogOut, LogIn } from "lucide-react";
import { LoginModal } from "./auth/LoginModal";

interface UserProfileButtonProps {
  iconOnly?: boolean;
}

export function UserProfileButton({ iconOnly = false }: UserProfileButtonProps) {
  const { user, signOut, isCloudMode } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // If not in cloud mode, don't render anything
  if (!isCloudMode) {
    return null;
  }

  // When user is not logged in, show sign-in button
  if (!user) {
    return (
      <>
        <Button 
          variant="ghost" 
          size={iconOnly ? "icon" : "sm"}
          className={iconOnly ? "h-8 w-8 p-0" : "flex items-center gap-2"}
          onClick={() => setIsLoginModalOpen(true)}
        >
          <LogIn className="h-4 w-4" />
          {!iconOnly && <span>Sign In</span>}
        </Button>
        
        <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setIsLoginModalOpen(false)}
          redirectAfterLogin={false}
        />
      </>
    );
  }

  const initials = user.email 
    ? user.email.substring(0, 2).toUpperCase()
    : "NA";
    
  const avatarUrl = user.user_metadata?.avatar_url || null;
  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email || "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={name} />
            {/* Show user icon if no avatar is available */}
            <AvatarFallback>
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 