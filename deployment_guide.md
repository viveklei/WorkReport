# FOOLPROOF Deployment Guide: LEI Report Portal (Clean Start)

Follow these steps exactly to resolve the 503 errors and ensure a successful deployment.

---

## 🛡️ SAFE UPDATE: How to update without losing data

To update the application without losing your `database.sqlite` file, follow these steps in your cPanel File Manager:

1.  **Backup first**: Right-click `server/database.sqlite` and select **Download**.
2.  **The "Selective" Upload**:
    - When uploading a new `package.zip` or individual files, **do not** delete the `database.sqlite` file.
    - If you are replacing the `server` folder, copy `database.sqlite` to a temporary folder (like `tmp`) first, then replace the `server` folder, and finally move the database file back into `server/`.
3.  **Permissions**: Ensure that both the `server/` folder and `server/database.sqlite` have **0644** or **0755** permissions so the Node.js app can read/write to it.

---

## 🚀 Phase 1: Backend Deployment (reportdata.leip.co.in)

1.  **Upload ONLY these items** to your `reportdata` folder:
    - `server/` (the entire folder)
    - `app.js`
    - `package.json`
    - `package-lock.json`
    - **❌ DO NOT UPLOAD:** `node_modules`, `src/`, `public/`, `dist/`, or root `.env` files.
2.  **Configure Node.js App:**
    - Go to **Setup Node.js App** in cPanel.
    - If you have an existing app for `reportdata`, **Edit** it.
    - Ensure **Application startup file** is set to `app.js`.
    - Ensure **Node.js version** is **18.x** or higher.
3.  **Install Dependencies:**
    - Click the **"Run NPM Install"** button. Wait for it to finish.
4.  **Restart:**
    - Click the **"Restart"** button.
5.  **Verify:**
    - Visit `https://reportdata.leip.co.in/api/health`. You should see `{"status":"ok", ...}`.

---

## 🎨 Phase 2: Frontend Deployment (report.leip.co.in)

1.  **Zip the Build:**
    - Open your local project folder. 
    - Go inside the `dist` folder (created by the build command).
    - Select **all files and folders inside `dist`** and zip them (e.g., `frontend_build.zip`).
2.  **Upload & Extract:**
    - Upload `frontend_build.zip` to the `report` subdomain folder.
    - Extract it in the root of that folder.
3.  **Verify .htaccess:**
    - Ensure there is a `.htaccess` file in the folder with the following content (redirects all requests to `index.html`):
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

---

## ✅ Final Verification
1.  Visit `https://report.leip.co.in`.
2.  You should see the login screen.
3.  Check the browser console (F12) to ensure there are no "Failed to fetch" errors.

---

**Happy Deploying!**  
*If you hit any issues, check the `stderr.log` file in the `reportdata` folder.*
