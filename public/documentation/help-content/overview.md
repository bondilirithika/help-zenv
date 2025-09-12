A dynamic, auto-generated documentation site built with React and Vite.
 It is designed to make managing product documentation easy, scalable, and visually appealing. All documentation content is written in Markdown and organized by product folders. Navigation and product metadata are automatically generated using Node.js scripts, so adding new docs or products requires no manual configuration.

## Key Features

- **Dynamic Product Listing:** Products are detected from the folder structure and listed automatically on the landing page.
- **Auto-Generated Sidebar:** Each product’s sidebar navigation is built from the folder and file structure, supporting unlimited nesting.
- **Markdown-Based Content:** All documentation is written in Markdown for simplicity and portability.
- **Modern UI:** Okta-inspired dark theme, responsive design, and branded header with animated gradient logo.
- **Easy Contribution:** Add or edit Markdown files, run the scripts, and your changes are instantly reflected.
- **CI/CD Ready:** Scripts can be run automatically in your build pipeline for seamless deployment.

## How It Works

- **Content Management:**  
  Place Markdown files in `public/documentation/<product>/`. Each product folder must have an `overview.md` file.
- **Auto-Generation:**  
  - `generateProducts.js` scans product folders and creates `products.json` for the landing page.
  - `generateSidebar.js` scans each product folder and creates `sidebar.json` for sidebar navigation.
- **Frontend:**  
  - The landing page displays all products with descriptions from their `overview.md`.
  - The documentation page renders the sidebar and content dynamically based on the current route.
  - Breadcrumbs and sidebar navigation reflect the folder structure.
- **Deployment:**  
  Easily deployable to Vercel or similar platforms, with support for custom domains and SPA routing.

## Getting Started

1. Add or edit Markdown files in the appropriate product folder.
2. Run the scripts:
   ```
   node scripts/generateProducts.js
   node scripts/generateSidebar.js
   ```
3. Start the frontend:
   ```
   npm run dev
   ```
4. Deploy using your preferred platform (e.g., Vercel).

## Contributing

- Add new products by creating a folder and an `overview.md`.
- Add new documentation sections as Markdown files or subfolders.
- Run the scripts to update navigation and product info.
- Commit and push your changes.

## Technologies Used

- React (Vite)
- Node.js (for scripts)
- Markdown
- CSS (custom, Okta-inspired)
- React Router
- react-markdown, remark-gfm

---

For more details, see the full technical documentation or explore the codebase!
