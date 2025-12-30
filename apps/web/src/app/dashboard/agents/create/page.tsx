'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAgent } from '@/contexts/agent-context';

export default function CreateAgentPage() {
  const router = useRouter();
  const { refreshAgents, selectAgent } = useAgent();
  
  const [formData, setFormData] = useState({
    name: '',
    knowledge: '',
    linkExpiryHours: 24,
  });
  
  const [errors, setErrors] = useState<{
    name?: string;
    knowledge?: string;
    linkExpiryHours?: string;
  }>({});
  
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Agent name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    // Validate knowledge
    if (!formData.knowledge.trim()) {
      newErrors.knowledge = 'Knowledge base is required';
    } else if (formData.knowledge.length < 10) {
      newErrors.knowledge = 'Knowledge base must be at least 10 characters';
    }

    // Validate link expiry hours
    if (formData.linkExpiryHours < 1 || formData.linkExpiryHours > 168) {
      newErrors.linkExpiryHours = 'Must be between 1 and 168 hours';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/agents/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create agent');
      }

      // Refresh agents list
      await refreshAgents();
      
      // Auto-select the new agent
      selectAgent(data.id);

      toast.success('Agent created successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Create agent error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create agent');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Dashboard
      </Button>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create AI Agent</h1>
        <p className="text-muted-foreground">
          Set up your AI sales agent with knowledge base
        </p>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Details</CardTitle>
          <CardDescription>
            Configure your AI agent's name, knowledge, and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Agent Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Agent Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Enterprise Sales Agent"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                maxLength={100}
                disabled={isLoading}
                className={errors.name ? 'border-destructive' : ''}
              />
              <p className="text-sm text-muted-foreground">
                A descriptive name for your AI agent
              </p>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Knowledge Base */}
            <div className="space-y-2">
              <Label htmlFor="knowledge">
                Knowledge Base <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="knowledge"
                rows={12}
                placeholder={`Enter information your AI agent should know during calls. Include:
- Product details and features
- Pricing information
- Common FAQs
- Company information
- Meeting guidelines`}
                value={formData.knowledge}
                onChange={(e) => {
                  setFormData({ ...formData, knowledge: e.target.value });
                  if (errors.knowledge) setErrors({ ...errors, knowledge: undefined });
                }}
                disabled={isLoading}
                className={errors.knowledge ? 'border-destructive' : ''}
              />
              <p className="text-sm text-muted-foreground">
                Plain text for MVP. File uploads and multimedia coming soon.
              </p>
              {errors.knowledge && (
                <p className="text-sm text-destructive">{errors.knowledge}</p>
              )}
            </div>

            {/* Link Expiry Hours */}
            <div className="space-y-2">
              <Label htmlFor="linkExpiryHours">Meeting Link Expiry (hours)</Label>
              <Input
                id="linkExpiryHours"
                type="number"
                min={1}
                max={168}
                value={formData.linkExpiryHours}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    linkExpiryHours: parseInt(e.target.value) || 24,
                  });
                  if (errors.linkExpiryHours)
                    setErrors({ ...errors, linkExpiryHours: undefined });
                }}
                disabled={isLoading}
                className={errors.linkExpiryHours ? 'border-destructive' : ''}
              />
              <p className="text-sm text-muted-foreground">
                How long after scheduled time should meeting links remain valid (1-168 hours)
              </p>
              {errors.linkExpiryHours && (
                <p className="text-sm text-destructive">{errors.linkExpiryHours}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Agent'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
