$sourceRoot = "C:\Users\Jacqu\OneDrive\Projects\Laurine_Kurs_Verkaufsseite\course_content"
$altSourceRoot = "C:\Users\Jacqu\OneDrive\Projects\Laurine_Kurs_Verkaufsseite\assets\pdfs"
$targetRoot = "C:\Users\Jacqu\OneDrive\Projects\extracted_french_mastery\public\30jours"

Write-Host "Starting PDF Restoration..."

for ($i = 1; $i -le 30; $i++) {
    $dayNum = $i.ToString("00")
    $dayFolder = "day$dayNum"
    $targetDir = "$targetRoot\$dayFolder\pdfs"
    
    if (!(Test-Path -Path $targetDir)) {
        New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    }

    # Potential filenames
    $guideName = "${dayFolder}_guide.pdf"
    
    # Check Source 1 (course_content)
    $source1 = "$sourceRoot\$dayFolder\pdfs\$guideName"
    
    if (Test-Path -Path $source1) {
        Copy-Item -Path $source1 -Destination "$targetDir\$guideName" -Force
        Write-Host "✅ Restored Day $i from course_content"
    }
    else {
        # Check Source 2 (assets/pdfs) - File naming might be slightly different
        # In assets they seem to be like day06_day06_guide.pdf or day06_guide.pdf
        
        $source2 = "$altSourceRoot\${dayFolder}_${guideName}"
        $source3 = "$altSourceRoot\$guideName"

        if (Test-Path -Path $source2) {
            Copy-Item -Path $source2 -Destination "$targetDir\$guideName" -Force
            Write-Host "✅ Restored Day $i from assets (format 1)"
        }
        elseif (Test-Path -Path $source3) {
            Copy-Item -Path $source3 -Destination "$targetDir\$guideName" -Force
            Write-Host "✅ Restored Day $i from assets (format 2)"
        }
        else {
            Write-Host "⚠️  Could not find original PDF for Day $i. Keeping generated version."
        }
    }

    # Also check for incidental files like commune_checklist.pdf
    if ($i -eq 1) {
        $extra = "$sourceRoot\day01\pdfs\commune_checklist.pdf"
        if (Test-Path $extra) { Copy-Item $extra "$targetDir\commune_checklist.pdf" -Force; Write-Host "   + Restored Commune Checklist" }
    }
    if ($i -eq 2) {
        $extra = "$sourceRoot\day02\pdfs\banking_comparison.pdf"
        if (Test-Path $extra) { Copy-Item $extra "$targetDir\banking_comparison.pdf" -Force; Write-Host "   + Restored Banking Comparison" }
    }
    if ($i -eq 3) {
        $extra = "$sourceRoot\day03\pdfs\healthcare_quickref.pdf"
        if (Test-Path $extra) { Copy-Item $extra "$targetDir\healthcare_quickref.pdf" -Force; Write-Host "   + Restored Healthcare Ref" }
    }
}

Write-Host "Restoration Complete."
