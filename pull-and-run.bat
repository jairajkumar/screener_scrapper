@echo off
REM Pull and Run Stock Analysis Tool from GitHub Container Registry
REM This script works on Windows

echo 🚀 Stock Analysis Tool - Pull and Run
echo =====================================

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    echo.
    echo Installation guide: https://docs.docker.com/desktop/install/windows/
    pause
    exit /b 1
)

REM Get GitHub username from command line or prompt
if "%1"=="" (
    set /p GITHUB_USERNAME="Enter your GitHub username: "
) else (
    set GITHUB_USERNAME=%1
)

set IMAGE_NAME=ghcr.io/%GITHUB_USERNAME%/stock-analysis
set TAG=latest

echo 🔧 Configuration:
echo   GitHub Username: %GITHUB_USERNAME%
echo   Image: %IMAGE_NAME%:%TAG%
echo.

REM Check if image is already pulled
docker image inspect %IMAGE_NAME%:%TAG% >nul 2>&1
if errorlevel 1 (
    echo 📥 Pulling image from GitHub Container Registry...
    docker pull %IMAGE_NAME%:%TAG%
    
    if errorlevel 1 (
        echo ❌ Failed to pull image!
        echo.
        echo Possible issues:
        echo   1. Image doesn't exist: https://ghcr.io/%GITHUB_USERNAME%/stock-analysis
        echo   2. Image is private and you need to login
        echo   3. Network connectivity issues
        echo.
        echo To login to GitHub Container Registry:
        echo   echo %%GITHUB_TOKEN%% ^| docker login ghcr.io -u %GITHUB_USERNAME% --password-stdin
        pause
        exit /b 1
    )
    
    echo ✅ Image pulled successfully!
) else (
    echo ✅ Image already available locally!
)

REM Check for .env file
if exist "nodejs-app\.env" (
    set ENV_FILE=--env-file nodejs-app\.env
) else (
    echo ⚠️  Warning: .env file not found!
    echo    Some features may not work without proper credentials.
    echo    Create .env file in nodejs-app directory with your credentials.
    echo.
    set /p CONTINUE="Continue without .env file? (y/N): "
    if /i not "%CONTINUE%"=="y" (
        pause
        exit /b 1
    )
    set ENV_FILE=
)

REM Parse command line arguments
if "%2"=="" (
    goto :start
) else if /i "%2"=="start" (
    goto :start
) else if /i "%2"=="background" (
    goto :background
) else if /i "%2"=="bg" (
    goto :background
) else if /i "%2"=="stop" (
    goto :stop
) else if /i "%2"=="logs" (
    goto :logs
) else if /i "%2"=="status" (
    goto :status
) else if /i "%2"=="restart" (
    goto :restart
) else if /i "%2"=="update" (
    goto :update
) else (
    goto :help
)

:start
echo 🚀 Starting Stock Analysis Tool...
docker run -p 3000:3000 %ENV_FILE% %IMAGE_NAME%:%TAG%
goto :end

:background
echo 🚀 Starting Stock Analysis Tool in background...
docker run -d -p 3000:3000 %ENV_FILE% --name stock-analysis %IMAGE_NAME%:%TAG%
echo ✅ Container started in background!
echo 🌐 Access at: http://localhost:3000
echo 📋 View logs: %0 %GITHUB_USERNAME% logs
echo 🛑 Stop: %0 %GITHUB_USERNAME% stop
goto :end

:stop
echo 🛑 Stopping Stock Analysis Tool...
docker stop stock-analysis 2>nul
docker rm stock-analysis 2>nul
echo ✅ Stopped!
goto :end

:logs
echo 📋 Showing logs...
docker logs -f stock-analysis
goto :end

:status
echo 📊 Container status:
docker ps -a --filter name=stock-analysis
goto :end

:restart
echo 🔄 Restarting Stock Analysis Tool...
call %0 %GITHUB_USERNAME% stop
call %0 %GITHUB_USERNAME% background
goto :end

:update
echo 🔄 Updating image...
docker pull %IMAGE_NAME%:%TAG%
echo ✅ Image updated!
goto :end

:help
echo Usage: %0 [github-username] [command]
echo.
echo Commands:
echo   start     - Start the application (foreground)
echo   background- Start the application (background)
echo   stop      - Stop the application
echo   logs      - Show application logs
echo   status    - Show container status
echo   restart   - Restart the application
echo   update    - Update the image from GitHub
echo.
echo Examples:
echo   %0 johndoe start
echo   %0 johndoe background
echo   %0 johndoe logs
echo.
echo 🌐 Access the application at: http://localhost:3000
echo 📦 Image: https://ghcr.io/%GITHUB_USERNAME%/stock-analysis

:end
pause 