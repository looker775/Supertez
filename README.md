# Supertez - Ride Hailing App

## Setup Instructions

### 1. Supabase Setup
1. Go to [https://supabase.com](https://supabase.com) and create a free project.
2. Go to the **SQL Editor** in the left sidebar.
3. Open supabase_schema.sql from this project, copy the content, and paste it into the SQL Editor. Click **Run**.
4. Go to **Settings > API**. Copy the **Project URL** and **anon public key**.

### 2. Local Configuration
1. Create a file named .env in this folder.
2. Add the following lines:
   `
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   `

### 3. Run Locally
`ash
npm run dev
`

### 4. Deploy to Netlify
1. Run 
pm run build. This will create a dist folder.
2. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop).
3. Drag and drop the dist folder onto the page.
4. Once uploaded, go to **Site Settings > Environment Variables** on Netlify.
5. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY with your values.

## Features
- **Roles:** Client, Driver, Admin/Owner.
- **Pricing:** Fixed City Price vs Per KM (set in Admin dashboard).
- **Localization:** English & Russian (auto-detected).
- **Maps:** Interactive map for pickup/dropoff.
