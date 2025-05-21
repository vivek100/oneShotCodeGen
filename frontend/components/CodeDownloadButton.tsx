"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Code } from "lucide-react";
import { generateCode } from "@/api/api";
import { useAuth } from "@/contexts/AuthContext";
import { LoginModal } from "@/components/auth/LoginModal";

interface CodeDownloadButtonProps {
  projectId: string;
  appConfig: any;
  icon?: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function CodeDownloadButton({
  projectId,
  appConfig,
  icon = <Download className="h-4 w-4 mr-2" />,
  variant = "default",
  size = "default",
  className,
}: CodeDownloadButtonProps) {
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, isCloudMode } = useAuth();

  const handleDownloadCode = async () => {
    // In cloud mode, check authentication
    if (isCloudMode && !user) {
      setShowLoginModal(true);
      return;
    }

    if (!projectId) return;
    
    try {
      setIsGeneratingCode(true);
      const response = await generateCode(projectId);
      
      if (!response.ok) {
        throw new Error('Failed to generate code');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${appConfig.app.name.replace(/\s+/g, "-").toLowerCase()}-code.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading code:', error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  return (
    <>
      <Button 
        onClick={handleDownloadCode} 
        disabled={isGeneratingCode}
        variant={variant}
        size={size}
        className={className}
      >
        {icon}
        {isGeneratingCode ? "Generating..." : "Download Code"}
      </Button>

      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Please sign in to download your application code."
      />
    </>
  );
} 