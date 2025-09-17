# Figma Download Script

This folder contains `figma-download.ps1`, a PowerShell helper to download exported images from a Figma file into the repository.

Usage

1. Create a Figma personal access token at https://www.figma.com/developers/api and store it in the `FIGMA_TOKEN` environment variable or pass it on the command line.

2. Find your Figma file key from the URL:

   `https://www.figma.com/file/<FILE_KEY>/<file-name>`

3. From the repo root run (PowerShell):

```powershell
# download SVGs
.\scripts\figma-download.ps1 -Token $env:FIGMA_TOKEN -FileKey "<FILE_KEY>" -Format svg

# or download PNGs
.\scripts\figma-download.ps1 -Token $env:FIGMA_TOKEN -FileKey "<FILE_KEY>" -Format png
```

Output

The downloaded files are placed in `wiki/design/figma` with filenames like `Name-<nodeId>.svg`.

Notes & troubleshooting

- The script may show PowerShell linter warnings about function names (unapproved verbs) in some editors; they are benign and only about naming conventions.
- The script relies on Figma's images API — some nodes may not export if they're not set up for export in the Figma file.
- If you need the entire file as a single image, you can use the file's `images` endpoint for page-level exports.

Security

Do not commit your personal Figma token to source control. Use an environment variable when possible.
