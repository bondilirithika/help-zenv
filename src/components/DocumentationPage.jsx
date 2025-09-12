import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import DocPage from './DocPage';
import './DocumentationPage.css';

const DocumentationPage = () => {
  const { productId, sectionId } = useParams();
  const location = useLocation();
  const [sidebar, setSidebar] = useState([]);
  const [activeFile, setActiveFile] = useState(sectionId || 'overview.md');
  const [expandedFolders, setExpandedFolders] = useState({});

  useEffect(() => {
    fetch(`/documentation/${productId}/sidebar.json`)
      .then(res => res.json())
      .then(setSidebar);
  }, [productId]);

  useEffect(() => {
    // Extract the full path from the current location
    const pathSegments = location.pathname.split(`/docs/${productId}/`);
    if (pathSegments.length > 1) {
      // This will be the full path including folders (abc/def.md)
      setActiveFile(pathSegments[1]);
    } else {
      setActiveFile('overview.md');
    }
  }, [location.pathname, productId]);

  // Toggle folder open/close
  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  // Recursive sidebar renderer with improved styling
  const renderSidebar = (items, parentPath = '', depth = 0) => (
    <ul className={depth === 0 ? "section-list" : "subsection-list"}>
      {items.map(item => {
        if (item.type === 'folder') {
          const folderPath = parentPath ? `${parentPath}/${item.name}` : item.name;
          const isOpen = expandedFolders[folderPath];
          return (
            <li key={folderPath} className="section-item">
              {/* MODIFIED: Folder headers should ONLY toggle expansion, not navigate */}
              <div
                className="section-header"
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: depth === 0 ? 600 : 500,
                  fontSize: depth === 0 ? '16px' : '15px',
                  color: depth === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                  paddingLeft: depth * 12
                }}
                onClick={(e) => {
                  e.preventDefault(); // Prevent navigation
                  toggleFolder(folderPath);
                }}
              >
                <span className="section-toggle" style={{ marginRight: 8 }}>
                  {isOpen ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" style={{ verticalAlign: 'middle' }}>
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" style={{ verticalAlign: 'middle' }}>
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  )}
                </span>
                {item.name}
              </div>
              {isOpen && renderSidebar(item.children, folderPath, depth + 1)}
            </li>
          );
        }
        
        // File links remain the same
        const fullPath = parentPath ? `${parentPath}/${item.file}` : item.file;
        const isActive = location.pathname.endsWith(`/${fullPath}`);
        return (
          <li key={fullPath} className="subsection-item">
            <Link
              to={`/docs/${productId}/${fullPath}`}
              className={`subsection-link${isActive ? ' active' : ''}`}
              style={{
                fontWeight: depth === 0 ? 600 : 400,
                fontSize: depth === 0 ? '16px' : '14px',
                color: isActive ? 'var(--highlight-color)' : 'var(--text-secondary)',
                paddingLeft: depth * 16 + 20
              }}
            >
              {item.name.replace(/-/g, ' ')}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  // Updated buildBreadcrumbs function - DON'T make folders clickable
  const buildBreadcrumbs = () => {
    const crumbs = [];
    if (!productId) return crumbs;

    // Add product as first crumb - always clickable to product overview
    crumbs.push({
      label: decodeURIComponent(productId.replace(/-/g, ' ')),
      to: `/docs/${productId}/overview.md`
    });

    if (activeFile && activeFile !== 'overview.md') {
      // Split the file path into parts (folders/file)
      const parts = activeFile.split('/');

      // For each folder in the path, add a non-clickable breadcrumb
      for (let i = 0; i < parts.length - 1; i++) {
        crumbs.push({
          label: decodeURIComponent(parts[i].replace(/-/g, ' ')),
          to: null // No link for folders
        });
      }

      // Last part is the file name (without .md)
      crumbs.push({
        label: decodeURIComponent(parts[parts.length - 1].replace('.md', '').replace(/-/g, ' ')),
        to: null // Current page - not clickable
      });
    }

    return crumbs;
  };

  return (
    <div className="doc-page dark-theme">
      {/* Add header bar just like LandingPage */}
      <header className="doc-header">
        <div className="header-content">
          <Link to="/" className="logo-link">
            <img src="/logo.png" alt="ZenV Innovations Logo" className="logo" />
            <span className="logo-text">ZenV Innovations</span>
          </Link>
        </div>
      </header>
      <div className="doc-container">
        <aside className="doc-sidebar">
          <div className="sidebar-header">
            <h2 className="product-title">{productId}</h2>
          </div>
          {renderSidebar(sidebar)}
          <div className="sidebar-footer">
            <Link to="/" className="back-link">Back to Products</Link>
          </div>
        </aside>
        <main className="doc-content">
          {/* Breadcrumbs */}
          <nav className="doc-breadcrumbs">
            {buildBreadcrumbs().map((crumb, idx, arr) => (
              <span key={idx}>
                {crumb.to ? (
                  <Link to={crumb.to}>{crumb.label}</Link>
                ) : (
                  <span className="current">{crumb.label}</span>
                )}
                {idx < arr.length - 1 && <span className="separator">/</span>}
              </span>
            ))}
          </nav>
          <DocPage productId={productId} file={activeFile} />
        </main>
      </div>
    </div>
  );
};

export default DocumentationPage;