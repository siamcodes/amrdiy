import React, { useState } from "react";
import parse, { domToReact } from "html-react-parser";
import { CheckOutlined, CopyOutlined } from "@ant-design/icons";

const nodeText = (node) => {
  if (!node) return "";
  if (node.type === "text") return node.data || "";
  if (node.children) return node.children.map(nodeText).join("");
  return "";
};

const CodeBlock = ({ node }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(nodeText(node));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="code-block">
      <button type="button" className="code-copy-btn" onClick={copy} title={copied ? "คัดลอกแล้ว" : "คัดลอก"} aria-label="คัดลอก">
        {copied ? <CheckOutlined /> : <CopyOutlined />}
      </button>
      <pre>{domToReact(node.children)}</pre>
    </div>
  );
};

// shared by blog/course lesson content so <pre> code blocks get a copy button
export const renderRichContent = (html, replace) => parse(html || "", {
  replace: (node) => {
    if (node.type === "tag" && node.name === "pre") return <CodeBlock node={node} />;
    return replace?.(node);
  },
});
