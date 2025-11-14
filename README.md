# Futura Intelligence LLP Github Pages Static Site Template

This template helps you set up a static site using GitHub Pages.

## Setup Instructions

1. Update `CNAME` to point to your domain.

2. In `.github/workflows/build-deploy-site.yaml` workflow, update:
    ```yaml
    - name: Build static site
      echo "domain" > ./static-content/CNAME
    ```
    Replace `domain` with your actual domain name.

3. Configure deployment trigger in `build-deploy-site.yml`:
    ```yaml
    on:
      push:
         branches: ["branch-name"]
    ```
    Replace `branch-name` with your target branch.

4. Update `package.json` with your project details.