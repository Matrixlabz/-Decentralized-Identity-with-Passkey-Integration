# Git Setup and Push Guide

## Prerequisites
- Git installed on your system
- GitHub account with access to the repository
- Repository URL: https://github.com/Matrixlabz/-Decentralized-Identity-with-Passkey-Integration

## Step-by-Step Instructions

### 1. Initialize Git Repository
```bash
cd C:\Users\Hp\CascadeProjects\decentralized-identity-passkey
git init
```

### 2. Add Remote Repository
```bash
git remote add origin https://github.com/Matrixlabz/-Decentralized-Identity-with-Passkey-Integration.git
```

### 3. Configure Git User (if not already configured)
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 4. Create .gitignore (if not exists)
The project already has a comprehensive .gitignore file that excludes:
- node_modules/
- .env files
- build/dist directories
- logs/
- OS-specific files
- IDE files

### 5. Add All Files to Git
```bash
git add .
```

### 6. Create Initial Commit
```bash
git commit -m "Initial commit: Complete decentralized identity platform scaffold

- Frontend React app with modern UI (TailwindCSS, shadcn/ui)
- Backend Node.js server with Stellar integration
- Smart contracts for identity management on Stellar
- Passkey authentication with Secp256r1 support
- Selective disclosure system
- Comprehensive documentation
- Setup and deployment scripts

Features:
- Biometric authentication using WebAuthn API
- Self-sovereign identity with user control
- Selective disclosure for privacy
- Stellar blockchain integration
- Modern responsive UI
- Comprehensive API documentation
- Security best practices"
```

### 7. Push to Main Branch
```bash
git branch -M main
git push -u origin main
```

## Alternative: If Repository Already Exists

If the repository already has content, you may need to:

### Option A: Force Push (will overwrite existing content)
```bash
git push -u origin main --force
```

### Option B: Merge with Existing Content
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

## Troubleshooting

### Authentication Issues
If you encounter authentication errors, you may need to:

1. **Use GitHub CLI** (recommended):
   ```bash
   gh auth login
   ```

2. **Use Personal Access Token**:
   - Create a PAT in GitHub Settings > Developer settings > Personal access tokens
   - Use it as your password when prompted

3. **Configure SSH**:
   ```bash
   git remote set-url origin git@github.com:Matrixlabz/-Decentralized-Identity-with-Passkey-Integration.git
   ```

### Large Files
If you have large files, consider using Git LFS:
```bash
git lfs install
git lfs track "*.wasm"
git lfs track "*.bin"
git add .gitattributes
```

## Verification

After pushing, verify by:

1. **Check the repository** at https://github.com/Matrixlabz/-Decentralized-Identity-with-Passkey-Integration
2. **Verify all files are present** in the repository
3. **Check the commit message** and file structure
4. **Test the setup** by cloning the repository locally:
   ```bash
   git clone https://github.com/Matrixlabz/-Decentralized-Identity-with-Passkey-Integration.git
   cd -Decentralized-Identity-with-Passkey-Integration
   npm run setup
   ```

## Next Steps After Push

1. **Create README.md** if not already present
2. **Add GitHub Issues** for bug tracking and feature requests
3. **Set up GitHub Actions** for CI/CD
4. **Create releases** for version management
5. **Add collaborators** if working with a team

## Project Structure Summary

Your repository will contain:
```
decentralized-identity-passkey/
README.md
package.json
.gitignore
frontend/          # React application
backend/           # Node.js API server
smart-contracts/   # Stellar smart contracts
shared/            # Shared types and utilities
docs/              # Documentation
scripts/           # Setup and deployment scripts
```

## Security Notes

- Ensure no sensitive credentials are committed (check .env files are excluded)
- Review the .gitignore file to confirm all sensitive files are excluded
- Consider using GitHub's secret scanning for additional security
- Enable branch protection rules for the main branch

## Support

If you encounter any issues:
1. Check Git configuration
2. Verify repository permissions
3. Review GitHub authentication methods
4. Check network connectivity
5. Review Git error messages for specific issues
