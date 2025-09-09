// This ProductData.js file maps product information to documentation structure

export const products = [
  {
    id: 'flutto',
    name: 'Flutto',
    tagline: 'AI-First Project Management Platform',
    description: 'Agile planning and collaboration enhanced with AI agents.',
    color: '#22C6D4'
  },
  {
    id: 'rft',
    name: 'RFT',
    tagline: 'Real-Time RFID & NFC Analytics',
    description: 'Comprehensive platform for asset monitoring and access control.',
    color: '#FFD000'
  },
  {
    id: 'rftrack',
    name: 'RFTrack',
    tagline: 'Smart Identification & Access Management',
    description: 'Compact, intelligent smart card for secure access, identity, and asset tracking across industries.',
    color: '#B1D007'
  },
  {
    id: 'zenvwifi',
    name: 'ZenV WiFi6 GPON ONT',
    tagline: 'Next-Gen Optical Network Terminal',
    description: 'High-performance gateway for ultra-fast fiber broadband and enterprise connectivity.',
    color: '#22C6D4'
  },
  {
    id: 'zenvlms',
    name: 'ZenV LMS',
    tagline: 'Customizable Learning Management System',
    description: 'A scalable, user-friendly, and fully customizable LMS designed for enterprises, universities, and training providers.',
    color: '#FFD000'
  },
  {
    id: 'incube',
    name: 'Incube',
    tagline: 'AI-Driven Internship & Project Management Platform',
    description: 'Seamless collaboration for students, mentors, and industries.',
    color: '#B1D007'
  }
];

// Get the documentation sections directly from the file system
export const fetchProductSections = async (productId) => {
  try {
    // This would fetch the section metadata from a json file
    const response = await fetch(`/documentation/${productId}/sections.json`);
    
    if (!response.ok) {
      console.error(`Failed to fetch sections for ${productId}: ${response.status}`);
      return [];
    }
    
    const sections = await response.json();
    return sections;
  } catch (error) {
    console.error(`Error loading sections for ${productId}:`, error);
    return [];
  }
};

// Fetch the content of a specific documentation file
export const fetchDocContent = async (productId, docPath) => {
  try {
    // Handle both direct files and paths with or without .md extension
    const filePath = docPath.endsWith('.md') 
      ? docPath 
      : `${docPath}.md`;
    
    const response = await fetch(`/documentation/${productId}/${filePath}`);
    
    if (!response.ok) {
      console.error(`Failed to fetch documentation for ${productId}/${filePath}: ${response.status}`);
      return `# Error Loading Documentation\n\nThe requested documentation could not be found.`;
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Error loading documentation for ${productId}/${docPath}:`, error);
    return `# Error Loading Documentation\n\nAn error occurred while loading the documentation.`;
  }
};