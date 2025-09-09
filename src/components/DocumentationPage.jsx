import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { products, fetchProductSections, fetchDocContent } from '../data/ProductData';
import DOMPurify from 'dompurify';
import './DocumentationPage.css';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css'; // GitHub-style dark theme

const DocumentationPage = () => {
  const { productId, sectionId, subsectionId } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('');
  const [activeSubsection, setActiveSubsection] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sections, setSections] = useState([]);
  const [contentHtml, setContentHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const contentRef = useRef(null);
  
  // Get the product data
  const product = products.find(p => p.id === productId);

  // Configure marked with highlight.js for proper code block rendering
  useEffect(() => {
    const renderer = new marked.Renderer();
    
    // Fix heading renderer to properly handle token objects from newer marked versions
    renderer.heading = function(text, level) {
      // For handling token objects in newer versions of marked
      let inlineText;
      
      if (typeof text === 'string') {
        inlineText = text;
      } else if (this.parser && this.parser.parseInline) {
        // Use parser to properly render token objects to HTML
        inlineText = this.parser.parseInline(text);
      } else if (text && typeof text.text === 'string') {
        // Fallback if parser not available but token has text property
        inlineText = text.text;
      } else {
        // Ultimate fallback
        inlineText = String(text || '');
      }
      
      // Create a safe slug for the ID by stripping HTML tags and non-word chars
      const slug = String(inlineText)
        .replace(/<[^>]+>/g, '')  // Remove HTML tags
        .toLowerCase()
        .replace(/[^\w]+/g, '-')
        .replace(/^-+|-+$/g, ''); // Trim hyphens from start and end
      
      return `
        <h${level} id="${slug}">
          <a href="#${slug}" class="anchor">
            <span class="header-link"></span>
          </a>
          ${inlineText}
        </h${level}>
      `;
    };
    
    // Improved code block renderer with copy button
    renderer.code = function(code, language) {
      // Extract raw content if code is a token object
      const safeCode = typeof code === 'string' ? code : (code?.raw || code?.text || String(code || ''));
      
      // Clean the code by removing any stray backticks that might have been included
      const cleanCode = safeCode
        .replace(/^```\w*\s*\n|```$/g, '') // Remove backtick fences if they somehow got included
        .trim();
      
      // Normalize language names
      let lang = '';
      if (language) {
        // Map common aliases to standard languages
        const langMap = {
          'pgsql': 'sql',
          'postgresql': 'sql',
          'autohotkey': 'json',
          'js': 'javascript',
          'ts': 'typescript'
        };
        
        lang = langMap[language.toLowerCase()] || language;
      }
      
      // Auto-detect language if not specified
      if (!lang && cleanCode) {
        if (cleanCode.match(/^\s*CREATE\s+TABLE\s+/i)) {
          lang = 'sql';
        } else if (cleanCode.match(/^\s*{\s*"[^"]+"\s*:/)) {
          lang = 'json';
        }
      }
      
      // Special handling for ASCII diagrams
      if (language === 'ascii' || cleanCode.match(/[│┌┐└┘├┤┬┴┼─┳┻╋]/)) {
        // Use a pre tag with monospace font for ASCII diagrams
        return `
          <div class="code-block diagram-block">
            <div class="code-header">
              <span class="code-language">diagram</span>
              <button class="copy-button">
                <span class="copy-icon">📋</span>
                <span class="copy-text">Copy</span>
              </button>
            </div>
            <pre class="ascii-diagram"><code>${cleanCode}</code></pre>
          </div>
        `;
      }
      
      // Highlight the code
      let highlightedCode;
      
      try {
        if (lang && hljs.getLanguage(lang)) {
          highlightedCode = hljs.highlight(cleanCode, { language: lang }).value;
        } else {
          const auto = hljs.highlightAuto(cleanCode);
          lang = auto.language || ''; // Use detected language or empty string
          highlightedCode = auto.value;
        }
      } catch (e) {
        // Fallback to escaped HTML if highlighting fails
        highlightedCode = cleanCode
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }
      
      // Return properly structured code block HTML
      return `
        <div class="code-block">
          <div class="code-header">
            ${lang ? `<span class="code-language">${lang}</span>` : ''}
            <button class="copy-button">
              <span class="copy-icon">📋</span>
              <span class="copy-text">Copy</span>
            </button>
          </div>
          <pre><code class="hljs ${lang ? `language-${lang}` : ''}">${highlightedCode}</code></pre>
        </div>
      `;
    };
    
    // Fix inline code handling for token objects
    renderer.codespan = function(code) {
      let text;
      
      if (typeof code === 'string') {
        text = code;
      } else if (code && code.raw) {
        text = code.raw;
      } else {
        text = String(code || '');
      }
      
      return `<code>${text}</code>`;
    };
    
    // Configure marked options with the updated renderer
    marked.setOptions({
      renderer: renderer,
      gfm: true,
      breaks: false,
      pedantic: false,
      sanitize: false,
      smartLists: true,
      smartypants: true,
      xhtml: false,
      headerIds: true
    });
  }, []);

  // Function to preprocess markdown content
  function preprocessMarkdown(markdown) {
    if (!markdown) return '';
    
    // Ensure we're working with a string
    let text = String(markdown || '');
    
    // Remove [object Object] artifacts
    text = text.replace(/\[object Object\]/g, '');
    
    // Clean up nested code blocks first
    text = text.replace(/```(\w+)\s*\n```(\w+)\s*\n([\s\S]*?)```\s*\n```/g, '```$2\n$3\n```');
    
    // Next, fix code blocks with language labels like "pgsql" or "autohotkey" to proper languages
    text = text.replace(/```pgsql\s*\n/g, '```sql\n');
    text = text.replace(/```autohotkey\s*\n/g, '```json\n');
    
    // Detect ASCII diagrams and properly format them
    // Look for box-drawing characters (┌─┐│└┘) that indicate diagrams
    text = text.replace(/(?:^|\n)((?:[│┌┐└┘├┤┬┴┼─┳┻╋]+[^\n]*\n){3,})(?:\n|$)/g, (match, diagram) => {
      if (!diagram.includes('```')) {
        return '\n```ascii\n' + diagram + '```\n';
      }
      return match;
    });
    
    // Now safely extract all code blocks to protect them from further processing
    const codeBlocks = [];
    text = text.replace(/```(\w*)\s*\n([\s\S]*?)```/g, (match, lang, code) => {
      codeBlocks.push(`\`\`\`${lang || ''}\n${code}\n\`\`\``);
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });
    
    // Process remaining text that doesn't contain code blocks
    // Format SQL CREATE TABLE statements
    text = text.replace(/(CREATE\s+TABLE\s+\w+\s*\([^;]+;)/g, '```sql\n$1\n```');
    
    // Format JSON objects
    text = text.replace(/(\{[\s\S]*?"[^"]+"\s*:[\s\S]*?\})/g, (match) => {
      if (match.includes('"') && match.includes('}')) {
        try {
          // Validate it's proper JSON
          const cleaned = match.replace(/,\s*}/g, '}');
          JSON.parse(cleaned);
          return '```json\n' + match + '\n```';
        } catch (e) {
          return match;
        }
      }
      return match;
    });
    
    // Format headings for API documentation sections
    text = text.replace(/(?:^|\n)#+\s*Purpose:\s*(.*?)(?:\n|$)/g, '\n\n## Purpose: $1\n\n');
    text = text.replace(/(?:^|\n)#+\s*Response(?:\s*Structure)?:\s*(.*?)(?:\n|$)/g, '\n\n## Response: $1\n\n');
    text = text.replace(/(?:^|\n)Purpose:\s*(.*?)(?:\n|$)/g, '\n\n## Purpose: $1\n\n');
    text = text.replace(/(?:^|\n)Response(?:\s*Structure)?:\s*(.*?)(?:\n|$)/g, '\n\n## Response: $1\n\n');
    
    // Format key-value pairs as lists
    text = text.replace(/^([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.+)$/gm, '- **$1:** $2');
    
    // Finally, restore code blocks
    text = text.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => {
      return codeBlocks[parseInt(index)] || '';
    });
    
    return text.trim();
  }

  // Load sections for the product
  useEffect(() => {
    if (!product) return;
    
    const loadSections = async () => {
      try {
        const productSections = await fetchProductSections(productId);
        setSections(productSections);
        
        if (productSections.length > 0) {
          // Handle URL-based navigation
          if (sectionId) {
            const section = productSections.find(s => s.id === sectionId);
            if (section) {
              setActiveSection(sectionId);
              setExpandedSections(prev => ({...prev, [sectionId]: true}));
              
              if (subsectionId) {
                const subsectionExists = section.subsections && 
                  section.subsections.some(ss => ss.id === subsectionId);
                  
                if (subsectionExists) {
                  setActiveSubsection(subsectionId);
                  loadSubsectionContent(sectionId, subsectionId);
                } else {
                  loadSectionContent(sectionId);
                }
              } else {
                loadSectionContent(sectionId);
              }
            } else {
              // Fallback to first section if specified section doesn't exist
              handleFirstSection(productSections);
            }
          } else {
            // If no section in URL, use the first one
            handleFirstSection(productSections);
          }
        }
      } catch (error) {
        console.error('Error loading sections:', error);
        setContentHtml('<p>Error loading documentation structure.</p>');
        setLoading(false);
      }
    };
    
    // Helper function to set first section as active
    const handleFirstSection = (sections) => {
      const firstSection = sections[0];
      setActiveSection(firstSection.id);
      setExpandedSections(prev => ({...prev, [firstSection.id]: true}));
      navigate(`/docs/${productId}/${firstSection.id}`, { replace: true });
      loadSectionContent(firstSection.id);
    };
    
    loadSections();
  }, [product, productId, navigate, sectionId, subsectionId]);

  // Load section content
  const loadSectionContent = async (sectionId) => {
    if (!sectionId) return;
    
    setLoading(true);
    try {
      // Get markdown content
      const markdownContent = await fetchDocContent(productId, sectionId);
      
      // Preprocess to fix formatting issues
      const cleanedContent = preprocessMarkdown(markdownContent);
      
      // Convert to HTML
      const htmlContent = marked.parse(cleanedContent);
      
      // Sanitize but allow our code block structure
      const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
          'p', 'br', 'hr', 'span', 'div',
          'strong', 'em', 'b', 'i', 'del', 'code',
          'ul', 'ol', 'li', 'a', 'img',
          'pre', 'blockquote', 'button'
        ],
        ALLOWED_ATTR: [
          'href', 'src', 'alt', 'title', 'id', 'class', 'target'
        ]
      });
      
      setContentHtml(sanitizedHtml);
    } catch (error) {
      console.error('Error loading documentation:', error);
      setContentHtml('<p>Error loading content.</p>');
    } finally {
      setLoading(false);
    }
  };

  // Load subsection content
  const loadSubsectionContent = async (sectionId, subsectionId) => {
    if (!sectionId || !subsectionId) return;
    
    setLoading(true);
    try {
      const section = sections.find(s => s.id === sectionId);
      if (!section) {
        throw new Error(`Section ${sectionId} not found`);
      }
      
      const subsection = section.subsections?.find(ss => ss.id === subsectionId);
      if (!subsection) {
        throw new Error(`Subsection ${subsectionId} not found in section ${sectionId}`);
      }
      
      const filePath = subsection.file ? subsection.file.replace('.md', '') : subsectionId;
      const markdownContent = await fetchDocContent(productId, filePath);
      
      // Use the same preprocessing and rendering pipeline as for sections
      const cleanedContent = preprocessMarkdown(markdownContent);
      const htmlContent = marked.parse(cleanedContent);
      
      const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
          'p', 'br', 'hr', 'span', 'div',
          'strong', 'em', 'b', 'i', 'del', 'code',
          'ul', 'ol', 'li', 'a', 'img',
          'pre', 'blockquote', 'button'
        ],
        ALLOWED_ATTR: [
          'href', 'src', 'alt', 'title', 'id', 'class', 'target'
        ]
      });
      
      setContentHtml(sanitizedHtml);
    } catch (error) {
      console.error('Error loading subsection content:', error);
      setContentHtml(`<p>Error loading subsection content: ${error.message}</p>`);
    } finally {
      setLoading(false);
    }
  };

  // Handle interactive elements after content loads
  useEffect(() => {
    if (loading || !contentRef.current) return;
    
    // Set up copy button functionality
    const copyButtons = contentRef.current.querySelectorAll('.copy-button');
    
    const handleCopy = (e) => {
      const button = e.currentTarget;
      const codeBlock = button.closest('.code-block');
      if (!codeBlock) return;
      
      const codeElement = codeBlock.querySelector('pre code');
      if (!codeElement) return;
      
      navigator.clipboard.writeText(codeElement.textContent).then(() => {
        const copyText = button.querySelector('.copy-text');
        if (copyText) {
          const originalText = copyText.textContent;
          copyText.textContent = 'Copied!';
          setTimeout(() => {
            copyText.textContent = originalText;
          }, 2000);
        }
      });
    };
    
    copyButtons.forEach(button => {
      button.addEventListener('click', handleCopy);
    });
    
    return () => {
      copyButtons.forEach(button => {
        button.removeEventListener('click', handleCopy);
      });
    };
  }, [loading, contentHtml]);

  // Toggle section expansion
  const toggleSectionExpansion = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Handle section click
  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    setActiveSubsection('');
    setMobileSidebarOpen(false);
    setExpandedSections(prev => ({...prev, [sectionId]: true}));
    navigate(`/docs/${productId}/${sectionId}`);
    loadSectionContent(sectionId);
  };

  // Handle subsection click
  const handleSubsectionClick = (sectionId, subsectionId) => {
    setActiveSection(sectionId);
    setActiveSubsection(subsectionId);
    setMobileSidebarOpen(false);
    navigate(`/docs/${productId}/${sectionId}/${subsectionId}`);
    loadSubsectionContent(sectionId, subsectionId);
  };

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(prev => !prev);
  };

  // Render the component
  return (
    <div className="doc-page dark-theme">
      <header className="doc-header">
        <div className="header-content">
          <Link to="/" className="logo-link">
            <img src="/vite.svg" alt="Logo" className="logo" />
            <span className="logo-text">Documentation</span>
          </Link>
          <div className="doc-title">
            <span className="doc-title-text">{product ? product.name : ''}</span>
          </div>
          <button className="mobile-menu-btn" onClick={toggleMobileSidebar}>
            <span className="menu-icon"></span>
          </button>
        </div>
      </header>

      <div className="doc-container">
        <aside className={`doc-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <h2 className="product-title">{product ? product.name : ''}</h2>
            <button className="close-sidebar" onClick={toggleMobileSidebar}>&times;</button>
          </div>
          
          <ul className="section-list">
            {sections.map(section => (
              <li key={section.id} className="section-item">
                <div className="section-header">
                  <button
                    className={activeSection === section.id ? 'active' : ''}
                    onClick={() => handleSectionClick(section.id)}
                  >
                    {section.title}
                  </button>
                  
                  {section.subsections && section.subsections.length > 0 && (
                    <div
                      className="section-toggle"
                      onClick={() => toggleSectionExpansion(section.id)}
                    >
                      {expandedSections[section.id] ? '▼' : '▶'}
                    </div>
                  )}
                </div>
                
                {section.subsections && section.subsections.length > 0 && expandedSections[section.id] && (
                  <ul className="subsection-list">
                    {section.subsections.map(subsection => (
                      <li key={subsection.id} className="subsection-item">
                        <button
                          className={`subsection-link ${activeSubsection === subsection.id ? 'active' : ''}`}
                          onClick={() => handleSubsectionClick(section.id, subsection.id)}
                        >
                          {subsection.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          
          <div className="sidebar-footer">
            <Link to="/" className="back-link">Back to Products</Link>
          </div>
        </aside>
        
        <main className="doc-content">
          <div className="doc-breadcrumbs">
            <Link to="/">Home</Link>
            <span className="separator">/</span>
            <Link to="/">Documentation</Link>
            <span className="separator">/</span>
            {product && <Link to={`/docs/${productId}`}>{product.name}</Link>}
            {activeSection && (
              <>
                <span className="separator">/</span>
                <span className="current">{sections.find(s => s.id === activeSection)?.title}</span>
              </>
            )}
            {activeSubsection && (
              <>
                <span className="separator">/</span>
                <span className="current">
                  {sections.find(s => s.id === activeSection)?.subsections?.find(ss => ss.id === activeSubsection)?.title}
                </span>
              </>
            )}
          </div>
          
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <span className="loading-text">Loading documentation...</span>
            </div>
          ) : (
            <div
              ref={contentRef}
              className="markdown-content"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default DocumentationPage;