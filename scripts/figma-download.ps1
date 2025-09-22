<#
.SYNOPSIS
Download exported images (SVG/PNG) from a Figma file into the repo.

.DESCRIPTION
This script uses the Figma REST API to list frames/components in a file and
download rendered SVG or PNG images for each node into `wiki/design/figma`.

.PARAMETER Token
Your Figma personal access token. Create one at https://www.figma.com/developers/api

.PARAMETER FileKey
The Figma file key (from the file URL: https://www.figma.com/file/<FILE_KEY>/...)

.PARAMETER Format
Output format: `svg` or `png`. Default is `svg`.

.PARAMETER OutputDir
Destination directory relative to the repo root. Defaults to `wiki/design/figma`.

Examples:
    .\figma-download.ps1 -Token $env:FIGMA_TOKEN -FileKey "abcd1234" -Format svg

#>

param(
    [Parameter(Mandatory=$true)] [string]$Token,
    [Parameter(Mandatory=$true)] [string]$FileKey,
    [ValidateSet('svg','png')] [string]$Format = 'svg',
    [string]$OutputDir = ".\wiki\design\figma"
)

function Sanitize-FileName {
    param([string]$name)
    # replace invalid filename chars and trim
    $san = $name -replace '[\\/:*?"<>|]', '-' -replace '\s+', ' ' -replace '^\.|\s+$', ''
    if ([string]::IsNullOrWhiteSpace($san)) { $san = 'unnamed' }
    return $san
}

# Ensure output dir exists
if (-not (Test-Path -Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$headers = @{ 'X-Figma-Token' = $Token }
$fileUrl = "https://api.figma.com/v1/files/$FileKey"
Write-Host "Fetching file metadata from Figma..."
try {
    $doc = Invoke-RestMethod -Uri $fileUrl -Headers $headers -Method Get -ErrorAction Stop
} catch {
    Write-Error "Failed to fetch file metadata. Check token and file key. $_"
    exit 2
}

# Recursively gather node ids for frames/components
$nodes = @()
function Walk-Node {
    param($node)
    if ($null -eq $node) { return }
    if ($node.type -in @('FRAME','COMPONENT','INSTANCE','GROUP','VECTOR')) {
        $nodes += @{ id = $node.id; name = $node.name }
    }
    if ($node.children) {
        foreach ($c in $node.children) { Walk-Node $c }
    }
}

foreach ($page in $doc.document.children) {
    Walk-Node $page
}

if ($nodes.Count -eq 0) {
    Write-Warning "No frames/components found in the file. Exiting."
    exit 0
}

Write-Host "Found $($nodes.Count) candidate nodes. Requesting rendered images as $Format..."

$ids = $nodes | ForEach-Object { $_.id }
$idsParam = [System.Web.HttpUtility]::UrlEncode(($ids -join ','))

$scaleParam = ''
if ($Format -eq 'png') { $scaleParam = '&scale=2' }

$imagesUrl = "https://api.figma.com/v1/images/$FileKey?ids=$idsParam&format=$Format$scaleParam"
try {
    $imagesResp = Invoke-RestMethod -Uri $imagesUrl -Headers $headers -Method Get -ErrorAction Stop
} catch {
    Write-Error "Failed to request images endpoint: $_"
    exit 3
}

if (-not $imagesResp.images) {
    Write-Warning "No image URLs returned. The nodes may not be exportable in the requested format."
}

$count = 0
foreach ($n in $nodes) {
    $id = $n.id
    $name = Sanitize-FileName $n.name
    $url = $imagesResp.images.$id
    if (-not $url) {
        Write-Warning "No image URL for node $id ($name). Skipping."
        continue
    }
    $ext = $Format
    $outPath = Join-Path -Path $OutputDir -ChildPath ("$name-$id.$ext")
    try {
        Write-Host "Downloading $name -> $outPath"
        Invoke-WebRequest -Uri $url -OutFile $outPath -UseBasicParsing -ErrorAction Stop
        $count++
    } catch {
        Write-Warning "Failed to download $url : $_"
    }
}

Write-Host "Done. Downloaded $count images to: $OutputDir"
