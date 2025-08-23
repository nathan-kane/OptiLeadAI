import type React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="bg-gradient-to-r from-blue-100 to-green-100 px-6 py-3 rounded-2xl inline-block mb-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">{title}</h1>
          </div>
          {description && <p className="text-slate-600 mt-2">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
