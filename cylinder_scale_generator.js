// Cylinder Scale Generator - JavaScript PDF Generator
// All logic for generating PDFs directly in the browser

let csvData = [];

function toggleInputMethod() {
    const method = document.querySelector('input[name="input_method"]:checked').value;
    
    if (method === 'textarea') {
        document.getElementById('textarea_input').style.display = 'block';
        document.getElementById('file_input').style.display = 'none';
    } else {
        document.getElementById('textarea_input').style.display = 'none';
        document.getElementById('file_input').style.display = 'block';
    }
}

function closePreview() {
    document.getElementById('preview-section').style.display = 'none';
}

function generatePreview() {
    try {
        showStatus('Generating preview...', false);
        
        // Get CSV data from the appropriate source
        const inputMethod = document.querySelector('input[name="input_method"]:checked').value;
        if (inputMethod === 'textarea') {
            const textareaContent = document.getElementById('csv_textarea').value;
            if (textareaContent.trim()) {
                parseCSV(textareaContent);
            } else {
                csvData = [];
            }
        }
        
        const params = getAllParameters();
        
        console.log('Preview params check:', {
            num_clicks: params.num_clicks,
            zero_reference_click: params.zero_reference_click,
            usable_scale_start_click: params.usable_scale_start_click
        });
        
        // Calculate dimensions (same as PDF generation)
        const effectiveDiameter = params.cylinder_diameter_inches + params.tape_thickness_inches;
        const scaleLength = Math.PI * effectiveDiameter;
        
        const clickMultiplier = params.click_height_multiplier_percent / 100;
        const clickLengthAdjusted = params.click_length_inches * clickMultiplier;
        const mediumClickExtraAdjusted = params.medium_click_extra_length_inches * clickMultiplier;
        const longClickExtraAdjusted = params.long_click_extra_length_inches * clickMultiplier;
        
        const maxClickLength = clickLengthAdjusted + Math.max(mediumClickExtraAdjusted, longClickExtraAdjusted);
        
        const extendedNumClicks = params.num_clicks + params.long_click_interval;
        const extendedScaleLength = scaleLength * (extendedNumClicks / params.num_clicks);
        
        let figWidth, figHeight;
        if (params.enable_trim_marks) {
            const trimExtension = params.trim_mark_gap_inches + params.trim_mark_length_inches;
            figWidth = extendedScaleLength + (2 * trimExtension);
            figHeight = params.max_label_height_inches + (2 * trimExtension);
        } else {
            figWidth = extendedScaleLength;
            figHeight = params.max_label_height_inches;
        }
        
        // Canvas setup - scale to fit in preview area (max 1000px wide)
        const maxPreviewWidth = 1000;
        const scale = Math.min(maxPreviewWidth / figWidth, 100); // pixels per inch, max 100 DPI
        
        const canvas = document.getElementById('preview-canvas');
        canvas.width = figWidth * scale;
        canvas.height = figHeight * scale;
        
        const ctx = canvas.getContext('2d');
        
        // Helper function to convert inches to pixels
        function inchToPx(inches) {
            return inches * scale;
        }
        
        // Set colors
        const fgColor = params.dark_mode ? '#FFFFFF' : '#000000';
        const bgColor = params.dark_mode ? '#000000' : '#FFFFFF';
        
        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calculate offset for trim marks
        const xOffset = params.enable_trim_marks ? params.trim_mark_gap_inches + params.trim_mark_length_inches : 0;
        const yOffset = params.enable_trim_marks ? params.trim_mark_gap_inches + params.trim_mark_length_inches : 0;
        
        const scaleBaselineY = yOffset + params.max_label_height_inches;
        
        // Draw scale line
        ctx.strokeStyle = fgColor;
        ctx.lineWidth = inchToPx(params.scale_line_width_inches);
        ctx.beginPath();
        ctx.moveTo(inchToPx(xOffset), inchToPx(scaleBaselineY));
        ctx.lineTo(inchToPx(xOffset + extendedScaleLength), inchToPx(scaleBaselineY));
        ctx.stroke();
        
        // Calculate click spacing
        const baseClickSpacing = scaleLength / params.num_clicks;
        const clickSpacing = extendedScaleLength / extendedNumClicks;
        
        // Draw clicks and numbers
        let totalLongClicks = 0;
        for (let i = 0; i < extendedNumClicks; i++) {
            const clickNumber = i + 1;
            if (clickNumber >= params.long_click_start && (clickNumber - params.long_click_start) % params.long_click_interval === 0) {
                totalLongClicks++;
            }
        }
        
        const maxNumber = totalLongClicks - 2;
        let longClickIndex = 0;
        
        ctx.lineCap = 'butt';
        
        for (let i = 0; i < extendedNumClicks; i++) {
            const xPos = xOffset + (i * clickSpacing);
            const clickNumber = i + 1;
            let currentClickLength, currentClickWidth;
            
            if (clickNumber >= params.long_click_start && (clickNumber - params.long_click_start) % params.long_click_interval === 0) {
                currentClickLength = clickLengthAdjusted;
                currentClickWidth = params.long_click_width_inches;
                
                let displayNumber;
                if (params.reverse_numbering) {
                    if (longClickIndex === 0 || longClickIndex === totalLongClicks - 1) {
                        displayNumber = 0;
                    } else {
                        displayNumber = longClickIndex;
                    }
                } else {
                    if (longClickIndex === 0 || longClickIndex === totalLongClicks - 1) {
                        displayNumber = 0;
                    } else {
                        displayNumber = maxNumber - (longClickIndex - 1);
                    }
                }
                
                const labelBottom = scaleBaselineY - clickLengthAdjusted - longClickExtraAdjusted;
                const autoFontSize = Math.min(clickSpacing * 72 * 0.8, 12);
                const fontSize = params.font_size_override_percent > 0 
                    ? autoFontSize * (params.font_size_override_percent / 100)
                    : autoFontSize;
                
                ctx.fillStyle = fgColor;
                ctx.font = `bold ${inchToPx(fontSize / 72)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(displayNumber.toString(), inchToPx(xPos), inchToPx(labelBottom));
                
                longClickIndex++;
            } else if (clickNumber >= params.medium_click_start && (clickNumber - params.medium_click_start) % params.medium_click_interval === 0) {
                currentClickLength = clickLengthAdjusted + mediumClickExtraAdjusted;
                currentClickWidth = params.medium_click_width_inches;
            } else {
                currentClickLength = clickLengthAdjusted;
                currentClickWidth = params.click_width_inches;
            }
            
            ctx.strokeStyle = fgColor;
            ctx.lineWidth = inchToPx(currentClickWidth);
            ctx.beginPath();
            ctx.moveTo(inchToPx(xPos), inchToPx(scaleBaselineY));
            ctx.lineTo(inchToPx(xPos), inchToPx(scaleBaselineY - currentClickLength));
            ctx.stroke();
        }
        
        // Draw plotted numbers (simplified version for preview)
        if (params.enable_plotted_numbers && csvData.length > 0) {
            console.log('Drawing plotted numbers, csvData length:', csvData.length);
            const plottedNumbersData = [];
            
            for (let data of csvData) {
                let absoluteClick;
                if (data.direction === 'U') {
                    absoluteClick = (params.zero_reference_click + params.usable_scale_start_click) + data.offset;
                } else {
                    absoluteClick = (params.zero_reference_click + params.usable_scale_start_click) - data.offset;
                }
                
                if (params.round_click_positions) {
                    absoluteClick = Math.round(absoluteClick);
                }
                
                const rowNum = Math.floor(absoluteClick / params.num_clicks);
                let clickInRow = absoluteClick % params.num_clicks;
                
                if (clickInRow < params.usable_scale_start_click) {
                    clickInRow += params.usable_scale_start_click;
                }
                
                plottedNumbersData.push({
                    number: data.number,
                    row: rowNum,
                    clickInRow: clickInRow,
                    toggleIndicator: data.toggleIndicator
                });
            }
            
            // Group and process (same logic as PDF)
            const numbersByRowAndClick = {};
            for (let data of plottedNumbersData) {
                const key = `${data.row}-${Math.round(data.clickInRow * 100) / 100}`;
                if (!numbersByRowAndClick[key]) {
                    numbersByRowAndClick[key] = [];
                }
                numbersByRowAndClick[key].push(data);
            }
            
            for (let key in numbersByRowAndClick) {
                const numbers = numbersByRowAndClick[key];
                numbers.forEach((data, idx) => {
                    data.stackIndex = idx;
                });
            }
            
            const rowGaps = [
                params.plotted_row0_height_inches,
                params.plotted_row1_height_inches,
                params.plotted_row2_height_inches,
                params.plotted_row3_height_inches,
                params.plotted_row4_height_inches
            ];
            
            const rowHeights = [];
            let cumulative = 0;
            for (let i = 0; i < rowGaps.length; i++) {
                cumulative += rowGaps[i];
                rowHeights.push(cumulative);
            }
            
            const rowColors = ['#0000FF', '#FF0000', '#008000', '#800080', '#FFA500'];
            
            const autoFontSizePlotted = Math.min(clickSpacing * 72 * 0.8, 12);
            const baseFontSize = params.plotted_font_size_percent > 0 
                ? autoFontSizePlotted * (params.plotted_font_size_percent / 100)
                : autoFontSizePlotted;
            
            for (let data of plottedNumbersData) {
                const numberStr = data.number % 1 === 0 
                    ? Math.floor(data.number).toString()
                    : data.number.toFixed(1);
                
                console.log('Drawing plotted number:', numberStr, 'at row', data.row, 'click', data.clickInRow);
                
                const xPos = xOffset + (data.clickInRow * baseClickSpacing);
                
                let baseY;
                if (data.row < rowHeights.length) {
                    baseY = scaleBaselineY - maxClickLength - rowHeights[data.row];
                } else {
                    baseY = scaleBaselineY - maxClickLength - rowHeights[rowHeights.length - 1] - 
                           (data.row - rowHeights.length + 1) * 0.125;
                }
                
                const yPos = baseY - (data.stackIndex * params.plotted_stacked_spacing_inches);
                
                let color;
                if (params.dark_mode) {
                    color = fgColor;
                } else if (data.row < rowColors.length) {
                    color = rowColors[data.row];
                } else {
                    color = fgColor;
                }
                
                ctx.fillStyle = color;
                ctx.font = `bold ${inchToPx(baseFontSize / 72)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(numberStr, inchToPx(xPos), inchToPx(yPos));
                
                if (data.toggleIndicator) {
                    const dashTop = yPos + params.indicator_dash_gap_inches;
                    const dashBottom = dashTop + params.indicator_dash_length_inches;
                    ctx.strokeStyle = fgColor;
                    ctx.lineWidth = inchToPx(params.indicator_dash_width / 72);
                    ctx.beginPath();
                    ctx.moveTo(inchToPx(xPos), inchToPx(dashTop));
                    ctx.lineTo(inchToPx(xPos), inchToPx(dashBottom));
                    ctx.stroke();
                }
            }
        }
        
        // Draw title
        if (params.enable_title) {
            const titleY = yOffset + params.title_to_trim_gap_inches;
            const titleX = xOffset + (extendedScaleLength / 2);
            ctx.fillStyle = fgColor;
            ctx.font = `bold ${inchToPx(params.title_font_size / 72)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(params.title_text, inchToPx(titleX), inchToPx(titleY));
        }
        
        // Draw trim marks
        if (params.enable_trim_marks) {
            const labelLeft = xOffset;
            const labelRight = xOffset + extendedScaleLength;
            const labelBottom = yOffset;
            const labelTop = yOffset + params.max_label_height_inches;
            
            ctx.strokeStyle = fgColor;
            ctx.lineWidth = params.trim_mark_width;
            
            // Draw all 8 trim mark lines
            ctx.beginPath();
            // Bottom-left horizontal
            ctx.moveTo(inchToPx(labelLeft - params.trim_mark_gap_inches), inchToPx(labelBottom));
            ctx.lineTo(inchToPx(labelLeft - params.trim_mark_gap_inches - params.trim_mark_length_inches), inchToPx(labelBottom));
            // Bottom-left vertical
            ctx.moveTo(inchToPx(labelLeft), inchToPx(labelBottom - params.trim_mark_gap_inches));
            ctx.lineTo(inchToPx(labelLeft), inchToPx(labelBottom - params.trim_mark_gap_inches - params.trim_mark_length_inches));
            // Bottom-right horizontal
            ctx.moveTo(inchToPx(labelRight + params.trim_mark_gap_inches), inchToPx(labelBottom));
            ctx.lineTo(inchToPx(labelRight + params.trim_mark_gap_inches + params.trim_mark_length_inches), inchToPx(labelBottom));
            // Bottom-right vertical
            ctx.moveTo(inchToPx(labelRight), inchToPx(labelBottom - params.trim_mark_gap_inches));
            ctx.lineTo(inchToPx(labelRight), inchToPx(labelBottom - params.trim_mark_gap_inches - params.trim_mark_length_inches));
            // Top-left horizontal
            ctx.moveTo(inchToPx(labelLeft - params.trim_mark_gap_inches), inchToPx(labelTop));
            ctx.lineTo(inchToPx(labelLeft - params.trim_mark_gap_inches - params.trim_mark_length_inches), inchToPx(labelTop));
            // Top-left vertical
            ctx.moveTo(inchToPx(labelLeft), inchToPx(labelTop + params.trim_mark_gap_inches));
            ctx.lineTo(inchToPx(labelLeft), inchToPx(labelTop + params.trim_mark_gap_inches + params.trim_mark_length_inches));
            // Top-right horizontal
            ctx.moveTo(inchToPx(labelRight + params.trim_mark_gap_inches), inchToPx(labelTop));
            ctx.lineTo(inchToPx(labelRight + params.trim_mark_gap_inches + params.trim_mark_length_inches), inchToPx(labelTop));
            // Top-right vertical
            ctx.moveTo(inchToPx(labelRight), inchToPx(labelTop + params.trim_mark_gap_inches));
            ctx.lineTo(inchToPx(labelRight), inchToPx(labelTop + params.trim_mark_gap_inches + params.trim_mark_length_inches));
            ctx.stroke();
        }
        
        // Show preview section
        document.getElementById('preview-section').style.display = 'block';
        document.getElementById('preview-section').scrollIntoView({ behavior: 'smooth' });
        
        showStatus('Preview generated! Scroll down to see it.', false);
        
    } catch (error) {
        console.error('Error generating preview:', error);
        showStatus('Error generating preview: ' + error.message, true);
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('csv_filename').value = file.name;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            parseCSV(content);
            
            // Show preview
            const previewContainer = document.getElementById('csv_preview_container');
            const lines = content.split('\n').slice(0, 10);
            previewContainer.innerHTML = `
                <div class="csv-preview">
                    <strong>CSV Preview (first 10 lines):</strong><br>
                    ${lines.map(l => l.replace(/</g, '&lt;').replace(/>/g, '&gt;')).join('<br>')}
                    ${content.split('\n').length > 10 ? '<br>...' : ''}
                </div>
            `;
        };
        reader.readAsText(file);
    }
}

function parseCSV(content) {
    csvData = [];
    const lines = content.split('\n');
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Split by tab or whitespace
        const parts = line.split(/\s+/);
        if (parts.length < 2) continue;
        
        let numberStr = parts[0];
        let toggleIndicator = false;
        
        if (numberStr.endsWith('-')) {
            toggleIndicator = true;
            numberStr = numberStr.slice(0, -1);
        }
        
        const number = parseFloat(numberStr);
        const positionStr = parts[1];
        const direction = positionStr[0];
        const offset = parseFloat(positionStr.substring(1));
        
        csvData.push({
            number: number,
            direction: direction,
            offset: offset,
            toggleIndicator: toggleIndicator
        });
    }
}

function getAllParameters() {
    const params = {};
    
    document.querySelectorAll('input[type="number"], input[type="text"], input[type="checkbox"]').forEach(input => {
        const id = input.id;
        if (id && id !== 'csv_file_input' && id !== 'csv_filename') {
            if (input.type === 'checkbox') {
                params[id] = input.checked;
            } else if (input.type === 'number') {
                params[id] = parseFloat(input.value);
            } else {
                params[id] = input.value;
            }
        }
    });
    
    return params;
}

function generatePDF() {
    try {
        showStatus('Generating PDF...', false);
        
        // Get CSV data from the appropriate source
        const inputMethod = document.querySelector('input[name="input_method"]:checked').value;
        if (inputMethod === 'textarea') {
            const textareaContent = document.getElementById('csv_textarea').value;
            if (textareaContent.trim()) {
                parseCSV(textareaContent);
            } else {
                csvData = []; // Clear if textarea is empty
            }
        }
        // If file method, csvData is already populated from handleFileUpload
        
        const params = getAllParameters();
        const { jsPDF } = window.jspdf;
        
        // Calculate dimensions
        const effectiveDiameter = params.cylinder_diameter_inches + params.tape_thickness_inches;
        const scaleLength = Math.PI * effectiveDiameter;
        
        const clickMultiplier = params.click_height_multiplier_percent / 100;
        const clickLengthAdjusted = params.click_length_inches * clickMultiplier;
        const mediumClickExtraAdjusted = params.medium_click_extra_length_inches * clickMultiplier;
        const longClickExtraAdjusted = params.long_click_extra_length_inches * clickMultiplier;
        
        const maxClickLength = clickLengthAdjusted + Math.max(mediumClickExtraAdjusted, longClickExtraAdjusted);
        
        const extendedNumClicks = params.num_clicks + params.long_click_interval;
        const extendedScaleLength = scaleLength * (extendedNumClicks / params.num_clicks);
        
        // Calculate figure dimensions
        let figWidth, figHeight;
        if (params.enable_trim_marks) {
            const trimExtension = params.trim_mark_gap_inches + params.trim_mark_length_inches;
            figWidth = extendedScaleLength + (2 * trimExtension);
            figHeight = params.max_label_height_inches + (2 * trimExtension);
        } else {
            figWidth = extendedScaleLength;
            figHeight = params.max_label_height_inches;
        }
        
        // Create PDF
        const pdf = new jsPDF({
            orientation: figWidth > figHeight ? 'landscape' : 'portrait',
            unit: 'in',
            format: [figWidth, figHeight]
        });
        
        // Set colors
        const fgColor = params.dark_mode ? [255, 255, 255] : [0, 0, 0];
        const bgColor = params.dark_mode ? [0, 0, 0] : [255, 255, 255];
        
        // Background
        pdf.setFillColor(...bgColor);
        pdf.rect(0, 0, figWidth, figHeight, 'F');
        
        // Calculate offset for trim marks
        const xOffset = params.enable_trim_marks ? params.trim_mark_gap_inches + params.trim_mark_length_inches : 0;
        const yOffset = params.enable_trim_marks ? params.trim_mark_gap_inches + params.trim_mark_length_inches : 0;
        
        // In PDF coordinates, Y=0 is at TOP, so we need to position scale at the bottom
        // Scale baseline position (at bottom of content area)
        const scaleBaselineY = yOffset + params.max_label_height_inches;
        
        // Draw scale line at the baseline (bottom)
        pdf.setDrawColor(...fgColor);
        pdf.setLineWidth(params.scale_line_width_inches);
        pdf.line(xOffset, scaleBaselineY, xOffset + extendedScaleLength, scaleBaselineY);
        
        // Calculate click spacing
        const baseClickSpacing = scaleLength / params.num_clicks;
        const clickSpacing = extendedScaleLength / extendedNumClicks;
        
        // Draw clicks and numbers
        let totalLongClicks = 0;
        for (let i = 0; i < extendedNumClicks; i++) {
            const clickNumber = i + 1;
            if (clickNumber >= params.long_click_start && (clickNumber - params.long_click_start) % params.long_click_interval === 0) {
                totalLongClicks++;
            }
        }
        
        const maxNumber = totalLongClicks - 2;
        let longClickIndex = 0;
        
        for (let i = 0; i < extendedNumClicks; i++) {
            const xPos = xOffset + (i * clickSpacing);
            const clickNumber = i + 1;
            let currentClickLength, currentClickWidth;
            
            // Check if long click
            if (clickNumber >= params.long_click_start && (clickNumber - params.long_click_start) % params.long_click_interval === 0) {
                currentClickLength = clickLengthAdjusted;
                currentClickWidth = params.long_click_width_inches;
                
                // Determine number
                let displayNumber;
                if (params.reverse_numbering) {
                    if (longClickIndex === 0 || longClickIndex === totalLongClicks - 1) {
                        displayNumber = 0;
                    } else {
                        displayNumber = longClickIndex;
                    }
                } else {
                    if (longClickIndex === 0 || longClickIndex === totalLongClicks - 1) {
                        displayNumber = 0;
                    } else {
                        displayNumber = maxNumber - (longClickIndex - 1);
                    }
                }
                
                // Draw number above the click
                const labelBottom = scaleBaselineY - clickLengthAdjusted - longClickExtraAdjusted;
                const autoFontSize = Math.min(clickSpacing * 72 * 0.8, 12);
                const fontSize = params.font_size_override_percent > 0 
                    ? autoFontSize * (params.font_size_override_percent / 100)
                    : autoFontSize;
                
                pdf.setFontSize(fontSize);
                pdf.setTextColor(...fgColor);
                pdf.setFont('helvetica', 'bold');
                // Note: jsPDF baseline is 'bottom' by default for numbers above baseline
                pdf.text(displayNumber.toString(), xPos, labelBottom, { align: 'center' });
                
                longClickIndex++;
            } 
            // Check if medium click
            else if (clickNumber >= params.medium_click_start && (clickNumber - params.medium_click_start) % params.medium_click_interval === 0) {
                currentClickLength = clickLengthAdjusted + mediumClickExtraAdjusted;
                currentClickWidth = params.medium_click_width_inches;
            } 
            // Regular click
            else {
                currentClickLength = clickLengthAdjusted;
                currentClickWidth = params.click_width_inches;
            }
            
            // Draw click extending upward from baseline
            pdf.setLineWidth(currentClickWidth);
            pdf.line(xPos, scaleBaselineY, xPos, scaleBaselineY - currentClickLength);
        }
        
        // Draw plotted numbers
        if (params.enable_plotted_numbers && csvData.length > 0) {
            const plottedNumbersData = [];
            
            // Process CSV data
            for (let data of csvData) {
                let absoluteClick;
                if (data.direction === 'U') {
                    absoluteClick = (params.zero_reference_click + params.usable_scale_start_click) + data.offset;
                } else {
                    absoluteClick = (params.zero_reference_click + params.usable_scale_start_click) - data.offset;
                }
                
                if (params.round_click_positions) {
                    absoluteClick = Math.round(absoluteClick);
                }
                
                const rowNum = Math.floor(absoluteClick / params.num_clicks);
                let clickInRow = absoluteClick % params.num_clicks;
                
                if (clickInRow < params.usable_scale_start_click) {
                    clickInRow += params.usable_scale_start_click;
                }
                
                plottedNumbersData.push({
                    number: data.number,
                    absoluteClick: absoluteClick,
                    row: rowNum,
                    clickInRow: clickInRow,
                    toggleIndicator: data.toggleIndicator
                });
            }
            
            // Group by row and click for stacking
            const numbersByRowAndClick = {};
            for (let data of plottedNumbersData) {
                const key = `${data.row}-${Math.round(data.clickInRow * 100) / 100}`;
                if (!numbersByRowAndClick[key]) {
                    numbersByRowAndClick[key] = [];
                }
                numbersByRowAndClick[key].push(data);
            }
            
            // Assign stack indices
            for (let key in numbersByRowAndClick) {
                const numbers = numbersByRowAndClick[key];
                numbers.forEach((data, idx) => {
                    data.stackIndex = idx;
                });
            }
            
            // Group by row for crowding detection
            const numbersByRow = {};
            for (let data of plottedNumbersData) {
                if (!numbersByRow[data.row]) {
                    numbersByRow[data.row] = [];
                }
                numbersByRow[data.row].push(data);
            }
            
            // Sort by click position
            for (let row in numbersByRow) {
                numbersByRow[row].sort((a, b) => a.clickInRow - b.clickInRow);
            }
            
            // Detect crowding and set font sizes
            const autoFontSizePlotted = Math.min(clickSpacing * 72 * 0.8, 12);
            const baseFontSize = params.plotted_font_size_percent > 0 
                ? autoFontSizePlotted * (params.plotted_font_size_percent / 100)
                : autoFontSizePlotted;
            
            for (let data of plottedNumbersData) {
                const rowData = numbersByRow[data.row];
                let isCrowded = false;
                
                for (let other of rowData) {
                    if (other !== data) {
                        const distance = Math.abs(data.clickInRow - other.clickInRow);
                        if (distance > 0.01 && distance < params.plotted_crowding_threshold_clicks) {
                            isCrowded = true;
                            break;
                        }
                    }
                }
                
                data.fontSize = isCrowded 
                    ? baseFontSize * (params.plotted_crowding_font_reduction_percent / 100)
                    : baseFontSize;
            }
            
            // Define row gaps and convert to cumulative heights
            // Row gaps define spacing between rows, we convert to absolute heights from baseline
            const rowGaps = [
                params.plotted_row0_height_inches,  // Gap from scale to row 0
                params.plotted_row1_height_inches,  // Gap from row 0 to row 1
                params.plotted_row2_height_inches,  // Gap from row 1 to row 2
                params.plotted_row3_height_inches,  // Gap from row 2 to row 3
                params.plotted_row4_height_inches   // Gap from row 3 to row 4
            ];
            
            // Calculate cumulative heights from gaps
            const rowHeights = [];
            let cumulative = 0;
            for (let i = 0; i < rowGaps.length; i++) {
                cumulative += rowGaps[i];
                rowHeights.push(cumulative);
            }
            
            const rowColors = [
                [0, 0, 255],      // blue
                [255, 0, 0],      // red
                [0, 128, 0],      // green
                [128, 0, 128],    // purple
                [255, 165, 0]     // orange
            ];
            
            // Draw numbers
            for (let data of plottedNumbersData) {
                const numberStr = data.number % 1 === 0 
                    ? Math.floor(data.number).toString()
                    : data.number.toFixed(1);
                
                const xPos = xOffset + (data.clickInRow * baseClickSpacing);
                
                // Calculate Y position - subtract from baseline to go upward
                let baseY;
                if (data.row < rowHeights.length) {
                    baseY = scaleBaselineY - maxClickLength - rowHeights[data.row];
                } else {
                    baseY = scaleBaselineY - maxClickLength - rowHeights[rowHeights.length - 1] - 
                           (data.row - rowHeights.length + 1) * 0.125;
                }
                
                const yPos = baseY - (data.stackIndex * params.plotted_stacked_spacing_inches);
                
                // Color
                let color;
                if (params.dark_mode) {
                    color = fgColor;
                } else if (data.row < rowColors.length) {
                    color = rowColors[data.row];
                } else {
                    color = fgColor;
                }
                
                console.log('Attempting to draw text:', numberStr, 'at x:', xPos, 'y:', yPos, 'fontSize:', data.fontSize);
                
                pdf.setFontSize(data.fontSize);
                pdf.setTextColor(...color);
                pdf.setFont('helvetica', 'bold');
                pdf.text(numberStr, xPos, yPos, { align: 'center' });
                
                // Draw indicator dash if toggled (extends down from number toward scale)
                if (data.toggleIndicator) {
                    const dashTop = yPos + params.indicator_dash_gap_inches;
                    const dashBottom = dashTop + params.indicator_dash_length_inches;
                    pdf.setDrawColor(...fgColor);
                    pdf.setLineWidth(params.indicator_dash_width / 72);
                    pdf.line(xPos, dashTop, xPos, dashBottom);
                }
            }
        }
        
        // Draw title at the top
        if (params.enable_title) {
            const titleY = yOffset + params.title_to_trim_gap_inches;
            const titleX = xOffset + (extendedScaleLength / 2);
            pdf.setFontSize(params.title_font_size);
            pdf.setTextColor(...fgColor);
            pdf.setFont('helvetica', 'bold');
            pdf.text(params.title_text, titleX, titleY, { align: 'center' });
        }
        
        // Draw trim marks
        if (params.enable_trim_marks) {
            const labelLeft = xOffset;
            const labelRight = xOffset + extendedScaleLength;
            const labelBottom = yOffset;
            const labelTop = yOffset + params.max_label_height_inches;
            
            pdf.setDrawColor(...fgColor);
            pdf.setLineWidth(params.trim_mark_width / 72);
            
            // Bottom-left
            pdf.line(labelLeft - params.trim_mark_gap_inches, labelBottom, 
                    labelLeft - params.trim_mark_gap_inches - params.trim_mark_length_inches, labelBottom);
            pdf.line(labelLeft, labelBottom - params.trim_mark_gap_inches, 
                    labelLeft, labelBottom - params.trim_mark_gap_inches - params.trim_mark_length_inches);
            
            // Bottom-right
            pdf.line(labelRight + params.trim_mark_gap_inches, labelBottom, 
                    labelRight + params.trim_mark_gap_inches + params.trim_mark_length_inches, labelBottom);
            pdf.line(labelRight, labelBottom - params.trim_mark_gap_inches, 
                    labelRight, labelBottom - params.trim_mark_gap_inches - params.trim_mark_length_inches);
            
            // Top-left
            pdf.line(labelLeft - params.trim_mark_gap_inches, labelTop, 
                    labelLeft - params.trim_mark_gap_inches - params.trim_mark_length_inches, labelTop);
            pdf.line(labelLeft, labelTop + params.trim_mark_gap_inches, 
                    labelLeft, labelTop + params.trim_mark_gap_inches + params.trim_mark_length_inches);
            
            // Top-right
            pdf.line(labelRight + params.trim_mark_gap_inches, labelTop, 
                    labelRight + params.trim_mark_gap_inches + params.trim_mark_length_inches, labelTop);
            pdf.line(labelRight, labelTop + params.trim_mark_gap_inches, 
                    labelRight, labelTop + params.trim_mark_gap_inches + params.trim_mark_length_inches);
        }
        
        // Save PDF
        const filename = params.pdf_filename.endsWith('.pdf') 
            ? params.pdf_filename 
            : params.pdf_filename + '.pdf';
        
        pdf.save(filename);
        
        showStatus('PDF generated successfully! Print at 100% scale for accurate dimensions.', false);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        showStatus('Error generating PDF: ' + error.message, true);
    }
}

function saveSettings() {
    try {
        const params = getAllParameters();
        const json = JSON.stringify(params, null, 2);
        downloadFile('cylinder_scale_settings.json', json);
        showStatus('Settings saved!', false);
    } catch (error) {
        showStatus('Error saving settings: ' + error.message, true);
    }
}

function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function loadSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const params = JSON.parse(event.target.result);
                
                Object.keys(params).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) {
                        if (element.type === 'checkbox') {
                            element.checked = params[key];
                        } else {
                            element.value = params[key];
                        }
                    }
                });
                
                showStatus('Settings loaded successfully!', false);
            } catch (error) {
                showStatus('Error loading settings: ' + error.message, true);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function resetToDefaults() {
    if (confirm('Reset all settings to default values?')) {
        location.reload();
    }
}

function showStatus(message, isError) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = 'status show' + (isError ? ' error' : '');
    
    setTimeout(() => {
        status.classList.remove('show');
    }, 5000);
}

// Auto-save settings to localStorage
window.addEventListener('load', function() {
    const saved = localStorage.getItem('cylinder_scale_settings');
    if (saved) {
        try {
            const params = JSON.parse(saved);
            Object.keys(params).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = params[key];
                    } else {
                        element.value = params[key];
                    }
                }
            });
        } catch (e) {
            console.error('Error loading saved settings:', e);
        }
    }
});

window.addEventListener('beforeunload', function() {
    const params = getAllParameters();
    localStorage.setItem('cylinder_scale_settings', JSON.stringify(params));
});