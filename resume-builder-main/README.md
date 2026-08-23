# AI Resume Builder — Complete Setup Guide

This guide is written for someone who has never run a web app before.
Follow every step in order and you will have the app running.

---

## What This App Does

- Generates professional resumes using AI
- Writes cover letters tailored to job descriptions
- Scores resumes against ATS (Applicant Tracking Systems)
- Writes LinkedIn About sections
- Exports to PDF, HTML, and plain text
- Has dark mode and light mode

---

## What You Need Before Starting

- A computer running Windows, Mac, or Linux
- An internet connection
- An Anthropic API key (instructions below)
- About 10 minutes

---

## PART 1 — Install the Required Software

### Step 1: Install Node.js

Node.js is the engine that runs this app. You only install it once.

1. Open your web browser and go to: https://nodejs.org
2. Click the big green button that says "LTS" (Long Term Support)
3. Download and run the installer
4. Click Next through all the steps and finish the install

To confirm it worked:
- On Windows: press the Windows key, type "cmd", open Command Prompt
- On Mac: press Cmd+Space, type "terminal", open Terminal
- Type this and press Enter:

```
node --version
```

You should see something like: v20.11.0
If you see a version number, Node.js is installed correctly.

---

## PART 2 — Set Up the App

### Step 2: Unzip the project

Find the file called resume-builder.zip on your computer.
Right-click it and choose "Extract All" (Windows) or double-click (Mac).
You will get a folder called resume-builder.

### Step 3: Open the project in Terminal

On Windows:
1. Open the resume-builder folder
2. Click on the address bar at the top of the folder window
3. Type "cmd" and press Enter — this opens Command Prompt inside that folder

On Mac:
1. Open Terminal (Cmd+Space, type terminal)
2. Type: cd (with a space after it, do not press Enter yet)
3. Drag the resume-builder folder into the Terminal window
4. Now press Enter

You should now see the folder path in your terminal. Type this to confirm you are in the right place:

```
dir
```
(Windows) or
```
ls
```
(Mac)

You should see files like: package.json, next.config.js, README.md, src/

If you see these files, you are in the right place.

### Step 4: Install the app's dependencies

In the terminal, type this and press Enter:

```
npm install
```

This downloads everything the app needs. It will take 1 to 3 minutes.
You will see a lot of text scrolling — that is normal.
Wait until you see your cursor again (the blinking line).

---

## PART 3 — Get Your API Key

The app uses Claude AI to generate resumes. You need an API key for this.

If you have Claude Pro (claude.ai subscription), you still need a separate API key.
The API key is different from your claude.ai login.

### Step 5: Get the API key

1. Go to: https://console.anthropic.com
2. Sign in with your Anthropic account (or create a free one)
3. In the left sidebar, click "API Keys"
4. Click "Create Key"
5. Give it a name like "resume-builder"
6. Click Create
7. Copy the key that appears — it starts with sk-ant-

IMPORTANT: This key is shown only once. Copy it now and save it somewhere safe.

### Step 6: Add credits to your account

The API charges a tiny amount per use (about $0.02 per resume).
You need to add at least $5 to get started.

1. In the Anthropic Console, click "Plans & Billing" in the left sidebar
2. Click "Add credits"
3. Add $5 or more using a credit card
4. $5 will give you roughly 200-250 resume generations

---

## PART 4 — Configure and Run the App

### Step 7: Add your API key to the app

In the resume-builder folder, find a file called: .env.local

Note: On Windows, files starting with a dot might be hidden.
To show hidden files on Windows: open File Explorer, click View, check "Hidden items"
On Mac: press Cmd+Shift+. to show hidden files

Open .env.local with any text editor (Notepad on Windows, TextEdit on Mac).
You will see this line:

```
ANTHROPIC_API_KEY=your_api_key_here
```

Replace "your_api_key_here" with your actual key. Example:

```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx
```

Save the file.

IMPORTANT: Do not share this file with anyone. Do not put it on GitHub. It is already protected by .gitignore.

### Step 8: Start the app

In your terminal (make sure you are still in the resume-builder folder), type:

```
npm run dev
```

You will see some text appear. Wait until you see:

```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

or something similar mentioning port 3000.

### Step 9: Open the app

Open your web browser and go to:

```
http://localhost:3000
```

The app will load. You can now use it!

To stop the app later: go back to the terminal and press Ctrl+C

---

## PART 5 — How to Use the App

1. Fill in the Basics tab: your name, job title, email, phone, location
2. Fill in Experience: add your work history
3. Fill in Education: add your degrees
4. Fill in Skills: comma-separated list of skills
5. Click "Generate resume with AI"
6. Wait 5-10 seconds — your resume appears on the right
7. Use the Export button to download as PDF or HTML

Other features:
- Cover Letter tab: enter a job description and company name, then generate a tailored cover letter
- ATS Score tab: paste a job description to get a score and improvement tips
- LinkedIn tab: generate a professional LinkedIn About section
- Dark/Light mode: toggle in the top right corner

---

## PART 6 — Editing the App's Design (UI)

Want to change colors, text, layout? Here is where to look:

### Main files you will edit:

| File | What it controls |
|---|---|
| src/app/page.tsx | The whole layout, tabs, buttons, left/right panels |
| src/components/ResumePreview.tsx | How the resume looks in the preview |
| src/components/CoverLetterPanel.tsx | The cover letter section |
| src/components/ATSScorePanel.tsx | The ATS score section |
| src/components/LinkedInPanel.tsx | The LinkedIn section |
| src/app/globals.css | Global styles |

### Common changes:

CHANGE THE GREEN COLOR:
Search for "#1D9E75" or "teal-500" in any file and replace with your preferred color.
For Tailwind colors see: https://tailwindcss.com/docs/customizing-colors

CHANGE THE HEADER TEXT:
Open src/app/page.tsx and find this line:
```
AI Resume Builder
```
Change it to whatever you want.

CHANGE BUTTON TEXT:
Search for the button text you want to change in page.tsx and edit it.

ADD OR REMOVE TABS:
In page.tsx, find the LEFT_TABS array:
```javascript
const LEFT_TABS = ['Basics', 'Experience', 'Education', 'Skills'];
```
Add or remove items as needed.

### Recommended free code editor: VS Code
Download from: https://code.visualstudio.com
Open the resume-builder folder in VS Code to edit all files comfortably.

---

## PART 7 — Putting the App Online (Hosting)

### Option A: Vercel (Recommended — Free)

Vercel is a free hosting platform made specifically for Next.js apps.

1. Create a free account at: https://vercel.com
2. Install the Vercel tool by typing in terminal:
```
npm install -g vercel
```
3. In your resume-builder folder, type:
```
vercel
```
4. Follow the prompts:
   - Link to existing project? No
   - What is your project name? resume-builder (or any name)
   - In which directory is your code? ./ (just press Enter)
   - Override settings? No
5. When it asks about environment variables, add:
   - Name: ANTHROPIC_API_KEY
   - Value: your sk-ant-... key
6. It will give you a URL like: https://resume-builder-abc.vercel.app
7. That URL is your live app — share it with anyone!

For future updates, just run "vercel" again from the folder.

### Option B: Vercel website (no terminal needed)

1. Put your resume-builder folder on GitHub (https://github.com)
2. Go to https://vercel.com and sign in
3. Click "Add New Project"
4. Import your GitHub repository
5. Under "Environment Variables", add ANTHROPIC_API_KEY with your key
6. Click Deploy

---

## Troubleshooting

PROBLEM: npm install says "could not find package.json"
SOLUTION: You are in the wrong folder. Make sure you are inside the resume-builder folder, not outside it. Run "dir" (Windows) or "ls" (Mac) and confirm you see package.json.

PROBLEM: The page at localhost:3000 says "Something went wrong"
SOLUTION: Check your .env.local file. Make sure the API key is correct with no spaces around the = sign.

PROBLEM: "Your credit balance is too low"
SOLUTION: Go to https://console.anthropic.com, click Plans & Billing, and add credits.

PROBLEM: The app compiles but looks broken / blank
SOLUTION: Try opening a different browser. Also try clearing your browser cache (Ctrl+Shift+R).

PROBLEM: Port 3000 is already in use
SOLUTION: Another app is using port 3000. Run: npm run dev -- -p 3001 and open http://localhost:3001

PROBLEM: Changes to files are not showing
SOLUTION: The app updates automatically when you save files. If not, stop the server (Ctrl+C) and run npm run dev again.

---

## Summary Cheat Sheet

Start the app:
```
cd resume-builder
npm run dev
```
Then open: http://localhost:3000

Stop the app: Ctrl+C in the terminal

Deploy to internet:
```
vercel
```

Update a deployed app:
```
vercel
```

---

Built with Next.js 14, TypeScript, Tailwind CSS, and Anthropic Claude API.
