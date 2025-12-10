import { BookOpenIcon } from '@heroicons/react/24/outline';

export default async function KnowledgePage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
        <p className="text-gray-500 mt-1">
          Manage training data and context for your AI agents
        </p>
      </div>

      <div className="flex justify-center">
        <div className="max-w-lg w-full flex flex-col items-center justify-center py-10 px-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <BookOpenIcon className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Knowledge Base Coming Soon
          </h3>
          <p className="text-gray-500 text-center">
            Upload documents, FAQs, and training materials to enhance your agent's responses.
          </p>
        </div>
      </div>
    </div>
  );
}
