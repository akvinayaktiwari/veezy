import { EnvelopeIcon } from '@heroicons/react/24/outline';

export default async function EmailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Email Campaigns</h1>
        <p className="text-gray-500 mt-1">
          Create and manage automated email sequences for lead nurturing
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <EnvelopeIcon className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Email Campaigns Coming Soon
        </h3>
        <p className="text-gray-500 text-center max-w-md">
          Design automated email workflows and track engagement metrics.
        </p>
      </div>
    </div>
  );
}
