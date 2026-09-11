# LinkedIn CEO Scraper System

## Prerequisites
1. **XAMPP** installed locally (providing Apache and MySQL).
2. **Google Chrome** browser.

## Step 1: Database Setup
1. Start **XAMPP Control Panel**.
2. Start the **Apache** and **MySQL** modules.
3. Open [http://localhost/phpmyadmin/](http://localhost/phpmyadmin/).
4. You should already have the database named `linkedin_leads` and a table named `executives`.
   *(If not, create the database and run the SQL table creation query provided in the initial prompt).*

## Step 2: Project Placement
1. Ensure the `linkedin-ceo` folder is placed inside `C:\xampp\htdocs\`.
2. The path to this project should be: `C:\xampp\htdocs\linkedin-ceo\`.
3. Verify the PHP backend is running by opening [http://localhost/linkedin-ceo/backend/get_executives.php](http://localhost/linkedin-ceo/backend/get_executives.php) in your browser. You should see a JSON response.

## Step 3: Chrome Extension Installation
1. Open Google Chrome.
2. Go to the Extensions page by typing `chrome://extensions/` in the URL bar.
3. In the top right corner, enable **Developer mode**.
4. Click the **Load unpacked** button in the top left.
5. Select the `extension` folder located at `C:\xampp\htdocs\linkedin-ceo\extension\`.
6. The "LinkedIn CEO Scraper" extension will now appear in your toolbar.

## Step 4: Using the Scraper
1. Open [LinkedIn](https://www.linkedin.com) and perform a search (e.g., search for people with "CEO" in their title), or visit a specific connection's profile page.
2. Click the LinkedIn CEO Scraper extension icon in your Chrome toolbar.
3. Click **Scan Current Page**.
   - It will identify publicly visible profiles whose titles contain CEO, Founder, Owner, etc.
   - Wait for it to report how many profiles it found.
4. Click **Save Profiles**.
   - The extension will send the extracted data to your local PHP backend.
   - It will report how many were successfully saved, and if there were any duplicates or errors.

## Step 5: Viewing the Data
1. Open the Admin Dashboard by navigating to:
   [http://localhost/linkedin-ceo/dashboard/index.html](http://localhost/linkedin-ceo/dashboard/index.html)
   *(Or click the "Open Admin Dashboard" link in the extension popup).*
2. The dashboard allows you to:
   - View the total number of profiles, companies, CEOs, and Founders.
   - Choose Grok, Gemini, or a local/OpenAI-compatible API and describe your sales niche.
   - Generate a personalised draft for each lead, then use **Open message** to open that lead's LinkedIn profile in a new tab with the draft inserted. Review and send each message yourself.

## AI message setup

1. Open the dashboard and choose your provider. Gemini uses its official OpenAI-compatible endpoint; for Ollama, LM Studio, vLLM, OpenAI, or similar, choose **Custom / local compatible API** and provide that provider's full `/chat/completions` URL, model, and API key if required. A base local address such as `http://192.168.29.22` is also accepted and becomes `/v1/chat/completions` automatically.
2. Click **Save settings**. The local backend creates the required `app_settings` table and `message_draft` column automatically.
3. Use **Generate message** beside a lead. Then click **Open message** to draft it in LinkedIn. Reload the unpacked extension once after this upgrade so the dashboard bridge is enabled.
   - Search by name.
   - Filter by specific Job Title or Company.
   - Delete individual records.
   - Export all saved leads to a CSV file.
