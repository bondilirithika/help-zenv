import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { products, fetchProductSections, fetchDocContent } from '../data/ProductData';
import DOMPurify from 'dompurify';
import './DocumentationPage.css';

// Import marked correctly
import { marked } from 'marked';

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
  
  const product = products.find(p => p.id === productId);
  
  // Configure marked.js correctly to handle parsing properly
  useEffect(() => {
    // Create a fresh renderer to avoid token parsing issues
    const renderer = new marked.Renderer();
    
    // Set options
    marked.setOptions({
      renderer: renderer,
      gfm: true,
      breaks: false,
      pedantic: false,
      sanitize: false,
      smartLists: true,
      smartypants: true
    });
  }, []);

  // Load sections for the product
  useEffect(() => {
    if (!product) return;
    
    const loadSections = async () => {
      try {
        const productSections = await fetchProductSections(productId);
        setSections(productSections);
        
        if (productSections.length > 0) {
          const pathParts = window.location.pathname.split('/');
          
          if (pathParts.length >= 5) {
            // Handle subsection URL
            const urlSectionId = pathParts[3];
            const urlSubsectionId = pathParts[4];
            
            const section = productSections.find(s => s.id === urlSectionId);
            if (section) {
              setActiveSection(urlSectionId);
              setActiveSubsection(urlSubsectionId);
              setExpandedSections(prev => ({...prev, [urlSectionId]: true}));
              
              const subsectionExists = section.subsections && 
                section.subsections.some(ss => ss.id === urlSubsectionId);
                
              if (subsectionExists) {
                loadSubsectionContent(urlSectionId, urlSubsectionId);
              } else {
                loadSectionContent(urlSectionId);
              }
            } else {
              // Fallback to first section
              handleFirstSection(productSections);
            }
          } else if (pathParts.length >= 4) {
            // Handle section URL
            const urlSectionId = pathParts[3];
            
            const sectionExists = productSections.some(s => s.id === urlSectionId);
            if (sectionExists) {
              setActiveSection(urlSectionId);
              setActiveSubsection('');
              setExpandedSections(prev => ({...prev, [urlSectionId]: true}));
              loadSectionContent(urlSectionId);
            } else {
              handleFirstSection(productSections);
            }
          } else {
            // Default URL
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
      setActiveSubsection('');
      setExpandedSections(prev => ({...prev, [firstSection.id]: true}));
      navigate(`/docs/${productId}/${firstSection.id}`, { replace: true });
      loadSectionContent(firstSection.id);
    };
    
    loadSections();
  }, [product, productId, navigate]);

  // Copy functionality
  useEffect(() => {
    if (!loading) {
      // Add copy button functionality
      const copyButtons = document.querySelectorAll('.copy-button');
      copyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const code = e.target.parentElement.nextElementSibling.textContent;
          navigator.clipboard.writeText(code);
          
          const originalText = e.target.textContent;
          e.target.textContent = 'Copied!';
          setTimeout(() => {
            e.target.textContent = originalText;
          }, 2000);
        });
      });
    }
  }, [loading, contentHtml]);

  // KEY FIX: This function now properly processes markdown
  const loadSectionContent = async (sectionId) => {
    if (!sectionId) return;
    
    setLoading(true);
    try {
      // Get the raw markdown content
      const markdownContent = await fetchDocContent(productId, sectionId);
      
      // Remove JSON object notation from content
      const cleanedContent = markdownContent.replace(/\{"type".*?\}\n?/g, '');
      
      // Convert the cleaned markdown to HTML
      const htmlContent = marked.parse(cleanedContent);
      
      // Sanitize for safety
      const sanitizedHtml = DOMPurify.sanitize(htmlContent);
      
      setContentHtml(sanitizedHtml);
    } catch (error) {
      console.error('Error loading content:', error);
      setContentHtml('<p>Error loading documentation content.</p>');
    } finally {
      setLoading(false);
    }
  };

  // KEY FIX: Similarly update subsection content loading
  const loadSubsectionContent = async (sectionId, subsectionId) => {
    if (!sectionId || !subsectionId) return;
    
    setLoading(true);
    try {
      // Find the section
      const section = sections.find(s => s.id === sectionId);
      if (!section) {
        throw new Error(`Section ${sectionId} not found`);
      }
      
      // Find the subsection
      const subsection = section.subsections?.find(ss => ss.id === subsectionId);
      if (!subsection) {
        throw new Error(`Subsection ${subsectionId} not found in section ${sectionId}`);
      }
      
      // Load the content
      const filePath = subsection.file.replace('.md', '');
      const markdownContent = await fetchDocContent(productId, filePath);
      
      // Remove JSON object notation from content
      const cleanedContent = markdownContent.replace(/\{"type".*?\}\n?/g, '');
      
      // Convert the cleaned markdown to HTML
      const htmlContent = marked.parse(cleanedContent);
      
      // Sanitize for safety
      const sanitizedHtml = DOMPurify.sanitize(htmlContent);
      
      setContentHtml(sanitizedHtml);
    } catch (error) {
      console.error('Error loading subsection content:', error);
      setContentHtml(`<p>Error loading subsection content: ${error.message}</p>`);
    } finally {
      setLoading(false);
    }
  };

  // Keep your existing event handlers and UI rendering
  const handleSectionClick = (sectionId) => {
    if (sectionId === activeSection && !activeSubsection) {
      toggleSectionExpansion(sectionId);
    } else {
      setActiveSection(sectionId);
      setActiveSubsection('');
      setMobileSidebarOpen(false);
      setExpandedSections(prev => ({...prev, [sectionId]: true}));
      navigate(`/docs/${productId}/${sectionId}`);
      loadSectionContent(sectionId);
    }
  };
  
  const handleSubsectionClick = (sectionId, subsectionId) => {
    setActiveSection(sectionId);
    setActiveSubsection(subsectionId);
    setMobileSidebarOpen(false);
    navigate(`/docs/${productId}/${sectionId}/${subsectionId}`);
    loadSubsectionContent(sectionId, subsectionId);
  };
  
  const toggleSectionExpansion = (sectionId) => {
    setExpandedSections(prev => ({...prev, [sectionId]: !prev[sectionId]}));
  };
  
  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };
  
  const getCurrentSectionTitle = () => {
    const section = sections.find(s => s.id === activeSection);
    return section ? section.title : '';
  };
  
  const getCurrentSubsectionTitle = () => {
    const section = sections.find(s => s.id === activeSection);
    if (!section || !section.subsections) return '';
    const subsection = section.subsections.find(s => s.id === activeSubsection);
    return subsection ? subsection.title : '';
  };

  // Not found page
  if (!product) {
    return (
      <div className="not-found">
        <h2>Product not found</h2>
        <p>The documentation you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="back-link">Return to Documentation</Link>
      </div>
    );
  }

  // UI rendering
  return (
    <div className="doc-page dark-theme">
      <header className="doc-header">
        <div className="header-content">
          <Link to="/" className="logo-link">
            <img src="/vite.svg" alt="ZenV Innovations Logo" className="logo" />
            <span className="logo-text">ZenV Innovations</span>
          </Link>
          
          <div className="doc-title">
            <span className="doc-title-text">{product.name} Documentation</span>
          </div>
          
          <button className="mobile-menu-btn" onClick={toggleMobileSidebar} aria-label="Toggle navigation">
            <span className="menu-icon"></span>
          </button>
        </div>
      </header>
      
      <div className="doc-container">
        <aside className={`doc-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <h2 className="product-title">{product.name}</h2>
            <button className="close-sidebar" onClick={() => setMobileSidebarOpen(false)} aria-label="Close navigation">
              &times;
            </button>
          </div>
          
          <nav className="doc-nav">
            <ul className="section-list">
              {sections.map(section => (
                <li key={section.id} className="section-item">
                  <div className="section-header">
                    <button 
                      className={activeSection === section.id && !activeSubsection ? 'active' : ''}
                      onClick={() => handleSectionClick(section.id)}
                    >
                      {section.title}
                    </button>
                    
                    {section.subsections && section.subsections.length > 0 && (
                      <span 
                        className={`section-toggle ${expandedSections[section.id] ? 'expanded' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSectionExpansion(section.id);
                        }}
                        aria-label={expandedSections[section.id] ? "Collapse section" : "Expand section"}
                      >
                        {expandedSections[section.id] ? '▼' : '▶'}
                      </span>
                    )}
                  </div>
                  
                  {expandedSections[section.id] && section.subsections && section.subsections.length > 0 && (
                    <ul className="subsection-list">
                      {section.subsections.map(subsection => (
                        <li key={subsection.id} className="subsection-item">
                          <button 
                            className={activeSection === section.id && activeSubsection === subsection.id ? 'subsection-link active' : 'subsection-link'}
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
          </nav>
          
          <div className="sidebar-footer">
            <Link to="/" className="back-link">
              Back to Documentation
            </Link>
          </div>
        </aside>
        
        <main className="doc-content" ref={contentRef}>
          {/* Breadcrumbs */}
          <div className="doc-breadcrumbs">
            <Link to="/">Home</Link>
            <span className="separator">/</span>
            <Link to={`/docs/${productId}`}>{product.name}</Link>
            {activeSection && (
              <>
                <span className="separator">/</span>
                {!activeSubsection ? (
                  <span className="current">{getCurrentSectionTitle()}</span>
                ) : (
                  <Link to={`/docs/${productId}/${activeSection}`}>{getCurrentSectionTitle()}</Link>
                )}
              </>
            )}
            {activeSubsection && (
              <>
                <span className="separator">/</span>
                <span className="current">{getCurrentSubsectionTitle()}</span>
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