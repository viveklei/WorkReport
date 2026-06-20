# Deployment Guide: Namecheap Subdomain (reports.leip.co.in)

Since you are using a subdomain (`reports.leip.co.in`), the app will be hosted at the **root** of that subdomain's folder.

## 1. Build the Application
Before uploading, you must generate the production files.
1. Open your terminal in the project folder.
2. Run the command:
   ```bash
   npm run build
   ```
3. This will create a `dist` folder.

## 2. Prepare Namecheap (cPanel)
1. Log in to your **Namecheap cPanel**.
2. Go to **Subdomains**.
3. Create the subdomain `reports` for the domain `leip.co.in`.
4. Note the **Document Root** folder (usually something like `public_html/reports` or just `reports.leip.co.in`).

## 3. Upload Files
1. Go to **File Manager** and navigate to the **Document Root** folder for your subdomain.
2. Zip the contents of your local `dist` folder (do NOT zip the `dist` folder itself, just the files and folders inside it).
3. Upload the `dist.zip` to your subdomain's folder in cPanel.
4. Extract the zip file there.

## 4. Handling React Router (Important)
Since React is a Single Page Application (SPA), you need to tell Namecheap how to handle direct links:
1. Create a file named `.htaccess` inside your subdomain's folder in cPanel.
2. Add this code:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

## 5. Done!
Your app should now be live at [reports.leip.co.in](https://reports.leip.co.in).

> [!NOTE]
> We have reset the `base` in `vite.config.js` to `/` because the app is now served from the top level of the subdomain.
