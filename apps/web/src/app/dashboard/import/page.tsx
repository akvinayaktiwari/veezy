import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default async function ImportPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Import Leads</h1>
        <p className="text-gray-500 mt-1">
          Upload and import leads from CSV, Excel, or integrate with your CRM
        </p>
      </div>

      <div className="flex justify-center">
        <div className="max-w-lg w-full flex flex-col items-center justify-center py-10 px-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <ArrowDownTrayIcon className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Import Features Coming Soon
          </h3>
          <p className="text-gray-500 text-center">
            Bulk import leads from various sources and sync with popular CRM platforms.
          </p>
        </div>
      </div>
    </div>
  );
}
