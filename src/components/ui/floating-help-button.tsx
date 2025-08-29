"use client";

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export function FloatingHelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const quickHelp = [
    {
      title: "Prospecting Campaigns",
      description: "Upload leads and start AI calling campaigns",
      action: () => router.push('/help#upload')
    },
    {
      title: "File Upload Help",
      description: "CSV/Excel format requirements",
      action: () => router.push('/help#upload')
    },
    {
      title: "Prompt Customization",
      description: "How to customize AI agent prompts",
      action: () => router.push('/help#prompt')
    },
    {
      title: "View Full Help",
      description: "Complete help documentation",
      action: () => router.push('/help')
    }
  ];

  return (
    <>
      {/* Floating Help Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg h-12 w-12 p-0"
        size="icon"
        variant="default"
      >
        {isOpen ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
      </Button>

      {/* Quick Help Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-40 w-80">
          <Card className="shadow-xl border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Quick Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickHelp.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 text-left"
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                  }}
                >
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/20" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
