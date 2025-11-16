
# Cylinder Scale Generator

A web-based tool for creating precise measurement scales that wrap around cylindrical objects.

[**Cylinder-Scale-Generator**](https://lilchirpings.github.io/Cylinder-Scale-Generator/)

## Features

- **Precise Scale Generation** - Creates PDF scales with accurate measurements for cylinders of any diameter
- **Multi-Revolution Support** - Handles scales that wrap multiple times with continuous numbering
- **Data Plotting** - Plot measurement points from CSV data with directional indicators (Up/Down)
- **Customizable Appearance** - Dark/light modes, adjustable fonts, click marks, and labels
- **Print-Ready Output** - Generates PDFs with trim marks for accurate cutting

## Quick Start

1. Open `index.html` in a web browser
2. Enter your cylinder diameter and number of clicks/divisions
3. Adjust click marks and labels as needed
4. Add measurement data (optional)
5. Click "Generate PDF" to create your scale

## Input Format

### Basic Parameters
- **Cylinder Diameter** - The diameter of your cylinder in inches
- **Number of Clicks** - How many divisions around the circumference
- **Tape Thickness** - Compensation for material thickness

### Data Format
Enter measurement data as:
```
15.0    U6.8
30.0    D9.8
45.0-   D3.9
```
- First number: Click position
- Letter (U/D): Direction (Up/Down)
- Second number: Offset value
- Dash (-): Toggle indicator marker

## Tabs

- **Basic** - Core dimensions and scale parameters
- **clicks** - click mark lengths and intervals
- **Labels** - Number labels and formatting
- **Plotted Data** - CSV data input and plotting options
- **Appearance** - Visual styling and output options

## Output

The tool generates a PDF file that can be printed at 100% scale, cut along the trim marks, and wrapped around your cylinder for precise measurements.

## Requirements

- Modern web browser with JavaScript enabled
- No installation needed - runs entirely in the browser

## Files

- `index.html` - Main interface
- `cylinder_scale_generator.js` - Core logic and PDF generation
- Uses jsPDF library for PDF creation (loaded from CDN)
