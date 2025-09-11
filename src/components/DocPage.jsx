import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const DocPage = ({ productId, file }) => {
  const [content, setContent] = useState("");
  useEffect(() => {
    fetch(`/documentation/${productId}/${file}`)
      .then(res => res.text())
      .then(setContent);
  }, [productId, file]);
  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
};
export default DocPage;