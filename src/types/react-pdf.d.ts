declare module 'react-pdf' {
  import { ComponentType } from 'react';

  export interface DocumentProps {
    file: string | File | ArrayBuffer | Uint8Array;
    onLoadSuccess?: (pdf: any) => void;
    onLoadError?: (error: Error) => void;
    loading?: React.ReactNode;
    error?: React.ReactNode;
    children?: React.ReactNode;
  }

  export interface PageProps {
    pageNumber: number;
    width?: number;
    height?: number;
    scale?: number;
    rotate?: number;
    renderTextLayer?: boolean;
    renderAnnotationLayer?: boolean;
    onLoadSuccess?: (page: any) => void;
    onLoadError?: (error: Error) => void;
    loading?: React.ReactNode;
    error?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }

  export const Document: ComponentType<DocumentProps>;
  export const Page: ComponentType<PageProps>;
  
  export const pdfjs: {
    version: string;
    GlobalWorkerOptions: {
      workerSrc: string;
    };
  };
}
