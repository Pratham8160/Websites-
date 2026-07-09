PATIDAR CRICKET LEAGUE (PCL) - WEBSITE DELIVERY PACKAGE
======================================================

This folder contains the production-ready website code files for the client.

FOLDER STRUCTURE:
-----------------
- index.html         : The final optimized production website.
- server.js          : The Node.js web server. Requires no npm package installs!
- js/
  - firebase-config.js: Firebase database configuration file.
- images/            : Folder containing website logos and asset files.
- developer_source/  : Folder containing the clean developer source code
                       (index_client.html & compiler) for future edits.

HOW TO RUN THE WEBSITE LOCALLY:
------------------------------
1. Open terminal/cmd in this directory.
2. Run the command:
   node server.js
3. Open http://localhost:3000 in your browser.

HOW TO DEVELOP / BUILD CHANGES:
------------------------------
If you want to make edits to the website:
1. Open the "developer_source" folder.
2. Edit "index_client.html".
3. Compile the changes by running:
   node merge_code.js
4. This will compile a new "index.html" in the parent folder.
