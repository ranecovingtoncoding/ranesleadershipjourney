# Rane’s Private Leadership Library

This is a private, editable website for your Trailblazers strategic leadership plan. It includes:

- A passwordless email sign-in gate
- A magical library entrance and animated opening-book experience
- Six shelves for the strategic leadership principles
- A leadership reading alcove
- A private Librarian Desk for editing text, adding books, deleting entries, and uploading visual assets
- A private image bucket for your library-exterior photo, real paper texture, shelf texture, and book-cover photos

## What you need

1. A GitHub account
2. A Supabase account
3. A Vercel account

All three accounts can use the same email address.

## 1. Create the private database

1. Go to Supabase and create a new project.
2. In Supabase, open SQL Editor and create a new query.
3. Open the file named schema.sql inside the supabase folder in this project.
4. Replace YOUR-PRIVATE-EMAIL@example.com with the exact email address you want to use to access the library. Keep it lowercase.
5. Paste the complete file into Supabase and click Run.
6. Open Authentication, then URL Configuration.
7. Add http://localhost:5173 as a redirect URL.
8. After deploying to Vercel, add your Vercel URL there too.

Supabase creates the private database, authentication rules, and a private library-assets image bucket. The site security rules allow only the email you added to read or edit its data.

## 2. Put this project on GitHub

1. Create a new private GitHub repository named ranes-leadership-library.
2. Upload this project's files to the repository, or run these commands from the project folder:

    git init
    git add .
    git commit -m "Create private leadership library"
    git branch -M main
    git remote add origin YOUR_GITHUB_REPOSITORY_URL
    git push -u origin main

Keep the repository private. The website has its own sign-in protection, but a private repository keeps the source and configuration private too.

## 3. Host it on Vercel

1. Go to Vercel and choose Add New, then Project.
2. Import the GitHub repository.
3. When asked for a framework preset, choose Other. There is no build command needed.
4. Before deploying, open Environment Variables and add:

| Name | Value |
|---|---|
| SUPABASE_URL | Your Supabase Project URL |
| SUPABASE_ANON_KEY | Your Supabase publishable or anon key |
| OWNER_EMAIL | The same lowercase email used in schema.sql |

You can find the Supabase URL and publishable key in Project Settings, then API Keys.

5. Click Deploy.
6. Copy the Vercel URL and add it to Supabase Authentication's redirect URL list.

The Supabase publishable or anon key is intentionally used in the browser. It is safe to expose only because the row-level security policies in schema.sql prevent anyone except your email from reading or changing the data.

## 4. Open and edit your library

1. Visit your Vercel URL.
2. Click the door.
3. Check your email and click the secure sign-in link.
4. Open Librarian Desk in the top-right corner.
5. Click Add starter collection once to load your reflections and reading list.
6. Use the editor to change wording, add books, delete books, or upload:
   - an exterior-library photo
   - a paper-page texture
   - a wood-shelf texture
   - a real cover image for any individual book

The reference-assets folder already includes the four visual references you uploaded. The best first upload is dark-library-door.png as the outside-library background. Use enchanted-tree-library.png later as an alternate visual or Reading Alcove art, and use illustrated-book-spines.png as a book-cover design reference.

## Local preview

To run the library on your computer before publishing:

1. Install the Vercel CLI and sign in.
2. From the project folder, run:

    vercel dev

3. Add the same three variables to a local .env file, then visit the local URL Vercel provides.

For normal use, add the three variables in Vercel. The small server route at api/config.js securely provides the browser with only the public Supabase URL, publishable key, and owner-email setting. The site never receives a service-role key.

## Important privacy note

The project intentionally does not use a master secret or service-role key in the browser. Never put a Supabase service-role key into this project.
