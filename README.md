## How to Run the Nicotine Monitoring System

Follow these steps exactly to run the project on your own computer.

### 1. Prerequisites
Make sure you have these installed:
- **Python 3.x** – download from https://www.python.org/downloads/ (check “Add Python to PATH” on Windows).
- **VS Code** (recommended editor) – download from https://code.visualstudio.com/.

### 2. Folder Structure
Ensure your folders look **exactly** like this. The `.venv` directory already ships with the download—keep it in place.

```
project-folder/
│
├── .idea/
├── .venv/
│
├── css/
│   └── style.css
│
├── html/
│   ├── daily_log.html
│   ├── dashboard.html
│   ├── insights.html
│   ├── login.html
│   └── progress.html
│
├── js/
│   ├── frontend_connector.js
│   ├── progress.js
│   └── (other *.js files)
│
├── server/
│   ├── app.py
│   ├── structures.py
│   ├── requirements.txt
│   └── symptom_data.json
│
└── SETUP.md
```

### 3. Setting Up the Backend (Do this once)
> Note: a `.venv` folder already exists in the download. You can activate it immediately. If it ever gets deleted or corrupt, just recreate it with Step 3.3.

1. Open the project folder in VS Code.
2. Open a terminal (`Ctrl + `` ` or `Terminal > New Terminal`); you should begin in the project root.
3. (Optional) Recreate the virtual environment:
   ```
   python -m venv .venv
   ```
4. Activate the environment:
   - **Windows**
     ```
     .\.venv\Scripts\activate
     ```
   - **macOS / Linux**
     ```
     source .venv/bin/activate
     ```
   You should see `(.venv)` at the start of your command line.
5. Move into the backend folder:
   ```
   cd server
   ```
6. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

### 4. Running the App (Do this every time)
1. Make sure the terminal is still inside the `server` folder and `(.venv)` is active.
2. Start the backend:
   ```
   python app.py
   ```
3. Wait for the message `Running on http://127.0.0.1:5000`.
4. Open your browser (Chrome/Edge) and visit `http://localhost:5000`.

### 5. Troubleshooting
- **“Module not found”**: The virtual environment isn’t active or `pip install -r requirements.txt` wasn’t run. Repeat Step 3.
- **“python is not recognized”**: Python isn’t installed or not added to PATH. Reinstall Python and enable the PATH option.
- **Changes not showing?**: Hard-refresh the browser with `Ctrl + Shift + R` to clear cache.
