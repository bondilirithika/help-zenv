Here’s a detailed explanation of **how your documentation system works**, including the scripts, folder structure, and what technologies are used:

---

## 🟢 **How the System Works**

### 1. **Folder Structure & Content**

- All documentation is stored in documentation.
- Each product (like `flutto`, `rft`) has its own folder.
- Inside each product folder:
  - Markdown files (`overview.md`, `getting-started.md`, etc.) hold the actual documentation.
  - Subfolders (like `abc/`) can contain more markdown files for nested sections.
  - `sidebar.json` is an auto-generated file describing the sidebar navigation for that product.

---

### 2. **Scripts: Auto-Generating Navigation & Product Info**

#### **a. `generateProducts.js`**

- **Purpose:** Creates `products.json` listing all products for the landing page.
- **How:**  
  - Scans each product folder in documentation.
  - Reads the first sentence or line from `overview.md` in each product folder.
  - Adds an entry to `products.json` with the product’s name and description.
- **Result:**  
  - The landing page uses `products.json` to show all products and their descriptions.

#### **b. `generateSidebar.js`**

- **Purpose:** Creates `sidebar.json` for each product, describing its sidebar navigation.
- **How:**  
  - Recursively scans all files and folders inside each product folder.
  - Builds a nested JSON structure representing folders and markdown files.
  - Writes this structure to `sidebar.json` in each product folder.
- **Result:**  
  - The documentation page sidebar is built dynamically from this file, supporting nested folders and sections.

---

### 3. **Frontend: How It Uses the Data**

#### **Landing Page (LandingPage.jsx)**

- Fetches `products.json` and displays each product as a tile.
- Tiles use periodic accent colors for visual appeal.
- Clicking a tile navigates to the product’s documentation.

#### **Documentation Page (DocumentationPage.jsx)**

- Fetches the relevant `sidebar.json` for the selected product.
- Renders the sidebar navigation dynamically, supporting folders and files.
- Clicking a file loads its markdown content in the main area.
- Breadcrumbs show the current location in the docs hierarchy.
- The ZenV Innovations logo and name are shown at the top for branding.

#### **Markdown Rendering (`DocPage.jsx`)**

- Uses `react-markdown` and `remark-gfm` to render markdown files with support for tables, code blocks, etc.
- Custom CSS styles make the docs look professional and readable.

---

### 4. **How It’s Dynamic**

- **Add a new product:** Create a new folder and add an `overview.md`. Run the scripts—everything updates automatically.
- **Add new docs/sections:** Add markdown files or folders. Run the scripts—sidebar and navigation update.
- **No manual config:** The scripts handle all navigation and product info generation.

---

### 5. **Technologies Used**

- **React (Vite):** For the frontend UI.
- **Node.js:** For running the scripts.
- **Markdown:** For writing documentation.
- **JSON:** For sidebar and product metadata.
- **CSS:** For styling (Okta-inspired, dark theme).
- **React Router:** For navigation.
- **react-markdown, remark-gfm:** For rendering markdown.

---

## 🟣 **Summary**

- **Scripts** (`generateProducts.js`, `generateSidebar.js`) scan your docs and auto-generate all navigation and product info.
- **Frontend** fetches these JSON files and renders everything dynamically.
- **Adding docs** is as simple as dropping markdown files in the right folder and running the scripts.
- **No manual sidebar or product config needed**—it’s all automated!

Let me know if you want a visual diagram or more details on any part!-