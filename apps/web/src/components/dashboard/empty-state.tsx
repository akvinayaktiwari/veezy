import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex justify-center">
      <Card className="max-w-lg w-full">
        <CardContent className="flex flex-col items-center justify-center py-10 px-6">
          <div className="text-gray-400 mb-4">{icon}</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            {description}
          </p>
          {action && action.href && (
            <Button asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          )}
          {action && action.onClick && !action.href && (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
