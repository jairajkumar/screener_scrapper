# GitHub Container Registry Setup Guide

This guide helps you set up GitHub Container Registry (GHCR) for distributing your Stock Analysis Tool Docker image.

## 🔐 Setup GitHub Container Registry

### Step 1: Create GitHub Personal Access Token

1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name like "Docker Registry"
4. Select scopes:
   - `write:packages` - Push packages
   - `read:packages` - Pull packages
   - `delete:packages` - Delete packages (optional)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)

### Step 2: Login to GitHub Container Registry

```bash
# Login using your token
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Replace:
- `YOUR_GITHUB_TOKEN` with the token you copied
- `YOUR_GITHUB_USERNAME` with your GitHub username

### Step 3: Build and Push Image

```bash
# Build and push to GitHub Container Registry
./build-and-push.sh YOUR_GITHUB_USERNAME
```

This will create: `ghcr.io/YOUR_GITHUB_USERNAME/stock-analysis:latest`

## 🚀 Run on Any Platform

### Windows, Mac, or Linux

```bash
# Pull and run the image
./pull-and-run.sh YOUR_GITHUB_USERNAME start

# Or run in background
./pull-and-run.sh YOUR_GITHUB_USERNAME background
```

### Manual Commands

```bash
# Pull the image
docker pull ghcr.io/YOUR_GITHUB_USERNAME/stock-analysis:latest

# Run the image
docker run -p 3000:3000 ghcr.io/YOUR_GITHUB_USERNAME/stock-analysis:latest

# Run with environment variables
docker run -p 3000:3000 --env-file .env ghcr.io/YOUR_GITHUB_USERNAME/stock-analysis:latest
```

## 📋 Workflow Examples

### For Developers (Linux/Mac)

```bash
# 1. Build and push (do this once)
./build-and-push.sh johndoe

# 2. Test locally
./pull-and-run.sh johndoe start
```

### For Users (Windows/Mac/Linux)

```bash
# 1. Just pull and run
./pull-and-run.sh johndoe start

# 2. Or run in background
./pull-and-run.sh johndoe background
```

## 🔧 Environment Variables

Create a `.env` file in the `nodejs-app` directory:

```bash
# Required for full functionality
SCREENER_EMAIL=your_email@example.com
SCREENER_PASSWORD=your_password_here

# Optional for AI insights
GITHUB_API_KEY=your_gemini_api_key_here
```

## 🌐 Image URLs

Your image will be available at:
- **Registry**: `ghcr.io/YOUR_GITHUB_USERNAME/stock-analysis`
- **Web URL**: `https://ghcr.io/YOUR_GITHUB_USERNAME/stock-analysis`

## 🔄 Update Image

To update the image:

```bash
# 1. Build and push new version
./build-and-push.sh YOUR_GITHUB_USERNAME

# 2. On other machines, pull the update
./pull-and-run.sh YOUR_GITHUB_USERNAME update
```

## 🛠️ Troubleshooting

### Login Issues
```bash
# Check if logged in
docker info | grep Username

# Re-login if needed
docker logout ghcr.io
echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### Permission Issues
- Make sure your token has `write:packages` scope
- Check if the repository is public or you have access

### Network Issues
- Check your internet connection
- Try using a VPN if GitHub is blocked in your region

## 📦 Benefits

- ✅ **Cross-platform**: Works on Windows, Mac, Linux
- ✅ **Version control**: Images are versioned and tracked
- ✅ **Easy sharing**: Just share your GitHub username
- ✅ **Automatic updates**: Pull latest version anytime
- ✅ **Free hosting**: GitHub provides free container registry
- ✅ **Security**: Private images supported 