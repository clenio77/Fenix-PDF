'use client';

import { useEffect, useRef } from 'react';

interface TextAlignmentHelperProps {
  textElement: HTMLElement;
  onAlignmentChange: (alignment: 'left' | 'center' | 'right' | 'justify') => void;
}

export default function TextAlignmentHelper({ textElement, onAlignmentChange }: TextAlignmentHelperProps) {
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    if (!textElement) return;

    // Observar mudanças no elemento de texto
    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target as HTMLElement;
          const computedStyle = window.getComputedStyle(target);
          
          // Detectar alinhamento baseado no estilo computado
          const textAlign = computedStyle.textAlign;
          let alignment: 'left' | 'center' | 'right' | 'justify' = 'left';
          
          switch (textAlign) {
            case 'center':
              alignment = 'center';
              break;
            case 'right':
              alignment = 'right';
              break;
            case 'justify':
              alignment = 'justify';
              break;
            default:
              alignment = 'left';
          }
          
          onAlignmentChange(alignment);
        }
      });
    });

    observerRef.current.observe(textElement, {
      attributes: true,
      attributeFilter: ['style']
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [textElement, onAlignmentChange]);

  return null;
}

/**
 * Função utilitária para detectar alinhamento de texto em elementos PDF
 */
export function detectTextAlignment(element: HTMLElement): 'left' | 'center' | 'right' | 'justify' {
  const computedStyle = window.getComputedStyle(element);
  const textAlign = computedStyle.textAlign;
  
  switch (textAlign) {
    case 'center':
      return 'center';
    case 'right':
      return 'right';
    case 'justify':
      return 'justify';
    default:
      return 'left';
  }
}

/**
 * Função para preservar margens e espaçamento original
 */
export function preserveOriginalSpacing(
  originalElement: HTMLElement,
  targetElement: HTMLElement
): void {
  const computedStyle = window.getComputedStyle(originalElement);
  
  // Preservar margens
  targetElement.style.marginLeft = computedStyle.marginLeft;
  targetElement.style.marginRight = computedStyle.marginRight;
  targetElement.style.marginTop = computedStyle.marginTop;
  targetElement.style.marginBottom = computedStyle.marginBottom;
  
  // Preservar padding
  targetElement.style.paddingLeft = computedStyle.paddingLeft;
  targetElement.style.paddingRight = computedStyle.paddingRight;
  targetElement.style.paddingTop = computedStyle.paddingTop;
  targetElement.style.paddingBottom = computedStyle.paddingBottom;
  
  // Preservar espaçamento de linha
  targetElement.style.lineHeight = computedStyle.lineHeight;
  
  // Preservar espaçamento entre palavras e caracteres
  targetElement.style.wordSpacing = computedStyle.wordSpacing;
  targetElement.style.letterSpacing = computedStyle.letterSpacing;
  
  // Preservar alinhamento
  targetElement.style.textAlign = computedStyle.textAlign;
  
  // Preservar indentação
  targetElement.style.textIndent = computedStyle.textIndent;
}