@echo off
echo 🚀 Starting Team TaskFlow Development Server...
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo ⚠️  Node modules not found. Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Start the development server
echo 🔄 Starting Vite development server...
echo.
echo 📍 Server will be available at: http://localhost:5173/
echo.

call npm run dev

:: If npm run dev fails, try alternative approaches
if errorlevel 1 (
    echo.
    echo ⚠️  npm run dev failed. Trying alternative...
    echo.
    
    :: Try with npx vite directly
    call npx vite
    
    if errorlevel 1 (
        echo.
        echo ❌ Failed to start development server
        echo.
        echo 🔧 Troubleshooting suggestions:
        echo    1. Run: npm install
        echo    2. Delete node_modules and package-lock.json, then npm install
        echo    3. Check if port 5173 is already in use
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ✅ Development server started successfully!
echo 📂 Open http://localhost:5173/ in your browser
pause