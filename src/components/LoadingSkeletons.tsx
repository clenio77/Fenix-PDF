'use client';

export const PDFSkeleton = () => (
  <div className="animate-pulse bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
    <div className="p-8">
      <div className="space-y-4">
        <div className="h-6 bg-white/20 rounded w-3/4"></div>
        <div className="h-4 bg-white/20 rounded w-1/2"></div>
        <div className="h-4 bg-white/20 rounded w-2/3"></div>
      </div>
    </div>
  </div>
);

export const PageThumbnailSkeleton = () => (
  <div className="animate-pulse bg-white/10 rounded-xl border border-white/20 p-2">
    <div className="aspect-[3/4] bg-white/20 rounded-lg flex items-center justify-center">
      <div className="w-8 h-8 bg-white/30 rounded"></div>
    </div>
  </div>
);

export const ToolboxSkeleton = () => (
  <div className="space-y-4">
    <div className="flex flex-wrap gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 w-32 h-12">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-white/30 rounded"></div>
            <div className="h-4 bg-white/30 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const FileListSkeleton = () => (
  <div className="space-y-4">
    <div className="h-6 bg-white/20 rounded w-24 animate-pulse"></div>
    {[1, 2].map((docIndex) => (
      <div key={docIndex} className="border border-white/20 rounded-lg p-2 animate-pulse">
        <div className="h-5 bg-white/20 rounded w-32 mb-2"></div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((pageIndex) => (
            <PageThumbnailSkeleton key={pageIndex} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const UploadAreaSkeleton = () => (
  <div className="animate-pulse border-2 border-dashed border-white/30 rounded-3xl p-8 text-center bg-white/5 backdrop-blur-md">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 bg-white/20 rounded-xl mb-3"></div>
      <div className="h-6 bg-white/20 rounded w-32 mb-2"></div>
      <div className="h-4 bg-white/20 rounded w-48 mb-3"></div>
      <div className="h-6 bg-white/20 rounded w-24"></div>
    </div>
  </div>
);

export const NotificationSkeleton = () => (
  <div className="animate-pulse bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
    <div className="flex items-center space-x-3">
      <div className="w-5 h-5 bg-white/30 rounded-full"></div>
      <div className="h-4 bg-white/20 rounded w-32"></div>
    </div>
  </div>
);
