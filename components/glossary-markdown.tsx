"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { GlossaryHover } from "./glossary-hover";

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  derivation?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
}

interface GlossaryMarkdownProps {
  content: string;
  enableGlossary?: boolean;
}

export function GlossaryMarkdown({
  content,
  enableGlossary = true,
}: GlossaryMarkdownProps) {
  const [glossaryMap, setGlossaryMap] = useState<Record<string, GlossaryTerm>>(
    {}
  );
  const [processedContent, setProcessedContent] = useState(content);

  useEffect(() => {
    if (!enableGlossary) {
      setProcessedContent(content);
      return;
    }

    // Extract potential glossary terms (words in double brackets like [[photosynthesis]])
    const termMatches = content.match(/\[\[([^\]]+)\]\]/g);

    if (!termMatches || termMatches.length === 0) {
      setProcessedContent(content);
      return;
    }

    // Extract unique terms
    const terms = Array.from(
      new Set(termMatches.map((match) => match.slice(2, -2).trim()))
    );

    // Fetch glossary definitions
    fetch(`/api/glossary?terms=${terms.map((t) => t.toLowerCase()).join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        setGlossaryMap(data);

        // Replace [[term]] with a marker for processing
        let processed = content;
        terms.forEach((term) => {
          const termData = data[term.toLowerCase()];
          if (termData) {
            // Replace [[term]] with a unique marker that we'll process later
            processed = processed.replace(
              new RegExp(`\\[\\[${term}\\]\\]`, "g"),
              `<GLOSSARY>${term}</GLOSSARY>`
            );
          } else {
            // If term not found, just show the term without brackets
            processed = processed.replace(
              new RegExp(`\\[\\[${term}\\]\\]`, "g"),
              term
            );
          }
        });

        setProcessedContent(processed);
      })
      .catch((error) => {
        console.error("Failed to fetch glossary terms:", error);
        // Fallback: remove brackets but keep terms
        setProcessedContent(content.replace(/\[\[([^\]]+)\]\]/g, "$1"));
      });
  }, [content, enableGlossary]);

  // Custom component to render glossary terms
  const components = {
    // Process text nodes to handle our custom GLOSSARY tags
    p: ({ children, ...props }: any) => {
      return (
        <p {...props}>
          {processChildren(children, glossaryMap)}
        </p>
      );
    },
    li: ({ children, ...props }: any) => {
      return (
        <li {...props}>
          {processChildren(children, glossaryMap)}
        </li>
      );
    },
    td: ({ children, ...props }: any) => {
      return (
        <td {...props}>
          {processChildren(children, glossaryMap)}
        </td>
      );
    },
    th: ({ children, ...props }: any) => {
      return (
        <th {...props}>
          {processChildren(children, glossaryMap)}
        </th>
      );
    },
  };

  return (
    <ReactMarkdown components={components as any}>
      {processedContent}
    </ReactMarkdown>
  );
}

// Helper function to process children and wrap glossary terms
function processChildren(children: any, glossaryMap: Record<string, GlossaryTerm>) {
  if (typeof children === "string") {
    return processTextNode(children, glossaryMap);
  }

  if (Array.isArray(children)) {
    return children.map((child, idx) => {
      if (typeof child === "string") {
        return <span key={idx}>{processTextNode(child, glossaryMap)}</span>;
      }
      return child;
    });
  }

  return children;
}

// Process a text node to find and wrap glossary terms
function processTextNode(text: string, glossaryMap: Record<string, GlossaryTerm>) {
  const parts = text.split(/(<GLOSSARY>.*?<\/GLOSSARY>)/g);

  return parts.map((part, idx) => {
    const match = part.match(/<GLOSSARY>(.*?)<\/GLOSSARY>/);
    if (match) {
      const term = match[1];
      const termData = glossaryMap[term.toLowerCase()];

      if (termData) {
        return (
          <GlossaryHover
            key={idx}
            term={termData.term}
            definition={termData.definition}
            derivation={termData.derivation || undefined}
            mediaUrl={termData.mediaUrl || undefined}
            mediaType={termData.mediaType as "image" | "video" | undefined}
          >
            {term}
          </GlossaryHover>
        );
      }
    }
    return part;
  });
}
