

# ZenV Innovations Documentation Portal  
## Technical Architecture & Workflow

---

## 1. **Project Structure Overview**

```
public/
  documentation/
    products.json         # Auto-generated product list
    <product>/
      overview.md         # Product overview (used for description)
      <section>.md        # Documentation sections
      sidebar.json        # Auto-generated sidebar for product
      <subfolder>/
        <subsection>.md   # Nested docs
src/
  components/
    LandingPage.jsx       # Product landing page
    DocumentationPage.jsx # Main docs UI
    DocPage.jsx           # Markdown renderer
    *.css                 # Styles
scripts/
  generateProducts.js     # Node script: builds products.json
  generateSidebar.js      # Node script: builds sidebar.json for each product
```

---

## 2. **Content Management**

- **All documentation is Markdown files** under `public/documentation/<product>/`.
- **Products** are folders (e.g., `flutto`, `rft`).
- **Sections** are Markdown files or subfolders inside each product.
- **Adding docs:** Just add `.md` files or folders—no code changes needed.

---

## 3. **Auto-Generation Scripts**

### a. **Product List (`products.json`)**

- **Script:** generateProducts.js
- **Purpose:**  
  - Scans each product folder in documentation.
  - Reads the first sentence or line from `overview.md` in each product folder.
  - Adds an entry to `products.json` with the product’s name and description.
- **Usage:**  
  - The landing page uses `products.json` to show all products and their descriptions.

### b. **Sidebar Navigation (`sidebar.json`)**

- **Script:** generateSidebar.js
- **Purpose:**  
  - Recursively scans all files and folders inside each product folder.
  - Builds a nested JSON structure representing folders and markdown files.
  - Writes this structure to `sidebar.json` in each product folder.
- **Usage:**  
  - The documentation page sidebar is built dynamically from this file, supporting nested folders and sections.

---

## 4. **Routing & Dynamic Rendering**

### a. **React Router Setup**

- **Landing Page:**  
  - Route: `/`
  - Component: LandingPage.jsx
  - Fetches `products.json` and displays product tiles.

- **Documentation Page:**  
  - Route: `/docs/:productId/*`
  - Component: DocumentationPage.jsx
  - Handles all nested documentation routes, e.g. `/docs/flutto/abc/rihtika/docdoc.md`.

### b. **How Routing Works**

- When a user navigates to `/docs/flutto/abc/rihtika/docdoc.md`:
  - React Router matches `/docs/:productId/*` and loads DocumentationPage.jsx.
  - The component parses the URL to determine the product (`flutto`) and the file path (`abc/rihtika/docdoc.md`).
  - It fetches the corresponding `sidebar.json` for navigation.
  - It loads and renders the markdown file using `DocPage.jsx`.

---

## 5. **Sidebar Rendering**

- **Sidebar JSON** describes the folder/file hierarchy for each product.
- **DocumentationPage.jsx** recursively renders folders and files:
  - Folders can be expanded/collapsed.
  - Files are clickable and load their content.
  - Deeply nested folders are supported (e.g., `abc/rihtika/docdoc.md`).

---

## 6. **Breadcrumbs**

- Breadcrumbs are dynamically built from the current file path.
- They show the hierarchy (e.g., `flutto / abc / rihtika / docdoc`).
- Only the product name is clickable (to overview); folders and files are visual indicators.

---

## 7. **Markdown Rendering**

- **Component:** `DocPage.jsx`
- **Libraries:** `react-markdown`, `remark-gfm`
- **Features:**
  - Renders markdown with tables, code blocks, callouts, etc.
  - Custom CSS for Okta-inspired look.
  - Supports anchor links for headings, API method tags, and ASCII diagrams.

---

## 8. **Styling & Branding**

- **Consistent branding:**  
  - Logo and "ZenV Innovations" at the top left of every page.
  - Gradient effect on logo text for visual appeal.
- **Dark theme:**  
  - CSS variables and classes for dark mode.
- **Responsive design:**  
  - Mobile-friendly sidebar and content layout.

---

## 9. **How Everything Stays Dynamic**

- **Add a new product:**  
  - Create a folder, add `overview.md`, run scripts—product appears on landing page.
- **Add new docs/sections:**  
  - Add markdown files or folders, run scripts—sidebar and navigation update.
- **No manual config:**  
  - Scripts handle all navigation and product info generation.
- **CI/CD:**  
  - On deploy, scripts run automatically to keep navigation up-to-date.

---

## 10. **Contributor Workflow**

1. **Add or edit Markdown files** in `public/documentation/<product>/`.
2. **Run scripts:**
   ```sh
   node scripts/generateProducts.js
   node scripts/generateSidebar.js
   ```
3. **Start the frontend:**
   ```sh
   npm run dev
   ```
4. **Commit and push changes** to the repo.
5. **Open a pull request** for review.
6. **Merge the PR**—CI/CD will automatically build and deploy the updated docs site.

---

## 11. **Deployment**

- **Vercel:**  
  - Connect your repo.
  - Set build command to run scripts before `npm run build`.
  - Add a CNAME record in your DNS for custom domains.
  - Add a `vercel.json` rewrite for deep routes.

---

## 12. **Extensibility**

- **Search:** Add a search bar for docs.
- **Theme toggle:** Enable dark/light mode.
- **404 handling:** Friendly error for missing docs.
- **Analytics:** Track usage if needed.
- **Accessibility:** Test with screen readers and keyboard navigation.

---

## 📚 **Summary**

- **Fully dynamic, scalable documentation portal.**
- **Easy to contribute:** Just add Markdown files.
- **Auto-generated navigation and product info.**
- **Modern, branded, and user-friendly UI.**
- **No manual sidebar or product config needed—everything is automated!**

---

**Let me know if you want a visual diagram, code samples, or contributor onboarding docs!**
