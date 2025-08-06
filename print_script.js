document.addEventListener('DOMContentLoaded', function() {
    // A helper function to safely render a section
    const renderSection = (sectionId, data, renderFn) => {
        const sectionElement = document.getElementById(sectionId);
        // Check if data is meaningful (not null, not undefined, not an empty string)
        if (data && data.trim() !== '') {
            if (renderFn) {
                renderFn(data); // Use a custom function for complex rendering
            } else {
                // Default rendering for simple text content
                sectionElement.querySelector('p, span').textContent = data;
            }
        } else {
            // If data is not meaningful, hide the entire section
            sectionElement.style.display = 'none';
        }
    };

    // Retrieve the report data from localStorage
    const reportDataJSON = localStorage.getItem('cctaReportData');
    if (!reportDataJSON) {
        const errorHTML = `
            <div class="error-container">
                <h1>Error: Report Data Not Found</h1>
                <p>This print preview page is temporary and cannot be reloaded or accessed directly.</p>
                <p>Please return to the main form to generate the report again.</p>
                <button onclick="window.close()">Close This Tab</button>
            </div>
        `;
        document.body.innerHTML = errorHTML;
        return;
    }

    const reportData = JSON.parse(reportDataJSON);

    // --- Populate the report ---

    // Report Indicator
    const indicatorContainer = document.querySelector('.indicator-container');
    const indicator = document.getElementById('report-indicator');
    if (reportData.risk_level === 'critical') {
        indicator.className = 'indicator-critical';
        indicator.textContent = 'Critical / Nguy cơ cao';
    } else if (reportData.risk_level === 'warning') {
        indicator.className = 'indicator-warning';
        indicator.textContent = 'Warning / Thận trọng';
    } else {
        indicator.className = 'indicator-normal';
        indicator.textContent = 'Normal / Bình Thường';
    }

    renderSection('section-indication', reportData.clinical_indication, data => {
        document.getElementById('print-indication').textContent = data;
    });

    // --- LOGIC CẬP NHẬT CHO MỤC TECHNIQUE VÀ MEDICATIONS ---
    renderSection('section-technique', reportData.technique_hr, data => {
        document.getElementById('print-technique').textContent = `Prospective ECG-gated coronary CTA was performed. Heart rate at the time of acquisition was approximately ${data} bpm.`;
    
        // Logic to render medications
        const meds = reportData.medications;
        const medList = [];
        if (meds.betaloc) medList.push("Betaloc");
        if (meds.nitro) medList.push("Nitroglycerine");
        if (meds.other) medList.push(meds.other);

        if (medList.length > 0) {
            const medElement = document.getElementById('print-medications');
            medElement.textContent = `Medications administered: ${medList.join(', ')}.`;
        }
    });
    // --- KẾT THÚC CẬP NHẬT ---

    renderSection('section-quality', reportData.technical_quality, data => {
        document.getElementById('print-quality').textContent = data;
    });

    // Section: Calcium Score (always shown, but content is filled)
    document.getElementById('print-score-lad').textContent = reportData.calcium_scores.lad;
    document.getElementById('print-score-lcx').textContent = reportData.calcium_scores.lcx;
    document.getElementById('print-score-rca').textContent = reportData.calcium_scores.rca;
    document.getElementById('print-score-lm').textContent = reportData.calcium_scores.lm;
    document.getElementById('print-score-total').textContent = reportData.calcium_scores.total;
    document.getElementById('print-score-interpretation').textContent = reportData.calcium_scores.interpretation;

    // Section: Coronary Arteries (custom logic for FINDINGS)
    const arteriesContainer = document.getElementById('print-arteries-section');
    arteriesContainer.innerHTML = ''; // Clear placeholder
    
    // Dominance first
    if (reportData.dominance) {
        const dominanceBlock = document.createElement('div');
        dominanceBlock.className = 'artery-block';
        dominanceBlock.innerHTML = `<p><span class="artery-block-title">Dominance:</span> ${reportData.dominance}</p>`;
        arteriesContainer.appendChild(dominanceBlock);
    }

    // Then other arteries
    reportData.arteries.forEach(artery => {
        // Only render if there is some data for this artery
        if (artery.size || artery.diameter || artery.anatomy || (artery.lesions && artery.lesions.length > 0)) {
            const arteryBlock = document.createElement('div');
            arteryBlock.className = 'artery-block';
            
            let anatomyHTML = `<p><span class="artery-block-title">${artery.name}:</span>`;
            if (artery.size) anatomyHTML += ` A ${artery.size} vessel`;
            if (artery.diameter) anatomyHTML += ` with proximal diameter of ${artery.diameter} mm.`;
            if (artery.anatomy) anatomyHTML += ` ${artery.anatomy}`;
            anatomyHTML += `</p>`;
            
            if (artery.lesions && artery.lesions.length > 0) {
                let lesionHTML = '<ul class="lesion-list">';
                artery.lesions.forEach(lesion => {
                    lesionHTML += `<li>${lesion}</li>`;
                });
                lesionHTML += '</ul>';
                anatomyHTML += lesionHTML;
            }

            arteryBlock.innerHTML = anatomyHTML;
            arteriesContainer.appendChild(arteryBlock);
        }
    });

    renderSection('subsection-collateral', reportData.collateral_circulation, data => {
        document.getElementById('print-collateral').textContent = data;
    });

    // Section: Cardiac Function (check if any sub-field has data)
    const cf = reportData.cardiac_function;
    if (cf.lvef_value || cf.lvef_desc || (cf.wall_motion && cf.wall_motion !== "No regional wall motion abnormalities.")) {
        let cardiacText = '';
        if (cf.lvef_value) cardiacText += `Estimated LVEF is ${cf.lvef_value}%. `;
        if (cf.lvef_desc) cardiacText += `${cf.lvef_desc}. `;
        if (cf.wall_motion && cf.wall_motion !== "No regional wall motion abnormalities.") cardiacText += `<br>${cf.wall_motion}`;
        document.getElementById('print-cardiac-function').innerHTML = cardiacText;
    } else {
        document.getElementById('subsection-cardiac').style.display = 'none';
    }
    
    // Section: Other Structures (hide if default text)
    const UNREMARKABLE_TEXT = "The pericardium and visualized extracardiac structures are unremarkable.";
    if (reportData.other_structures && reportData.other_structures.trim() !== UNREMARKABLE_TEXT && reportData.other_structures.trim() !== '') {
         document.getElementById('print-other-structures').textContent = reportData.other_structures;
    } else {
        document.getElementById('subsection-other-structures').style.display = 'none';
    }

    // Section: Impression (Populate with the generated summary)
    renderSection('section-impression', reportData.impression, data => {
        document.getElementById('print-impression').textContent = data;
    });
    
    // Section: Impression VI (Vietnamese)
    renderSection('section-impression-vi', reportData.impression_vi, data => {
        document.getElementById('print-impression-vi').textContent = data;
    });

    renderSection('section-recommendation', reportData.recommendation, data => {
        document.getElementById('print-recommendation').textContent = data;
    });

    // Clean up the localStorage after populating the data
    localStorage.removeItem('cctaReportData');
});