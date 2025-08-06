// --- DATA STORE ---
let lesionData = {
    lm: [], lad: [], lcx: [], rca: []
};
let otherFindingsSummaries = [];
let currentEditingArtery = null;
let tempLesions = [];
const UNREMARKABLE_TEXT = "The pericardium and visualized extracardiac structures are unremarkable.";
const DRAFT_KEY = 'cctaReportDraft';

// --- CALCIUM SCORE LOGIC ---
function updateInterpretation(total) {
    const interpretationEl = document.getElementById('score_interpretation');
    let text = '';
    if (total === 0) text = 'Interpretation: No coronary artery calcification detected. Low cardiovascular risk.';
    else if (total >= 1 && total <= 10) text = 'Interpretation: Minimal coronary artery calcification detected. Low cardiovascular risk.';
    else if (total >= 11 && total <= 100) text = 'Interpretation: Mild coronary artery calcification detected. Moderate cardiovascular risk.';
    else if (total >= 101 && total <= 400) text = 'Interpretation: Moderate coronary artery calcification detected. Moderately high cardiovascular risk.';
    else text = 'Interpretation: Severe coronary artery calcification detected. High cardiovascular risk.';
    interpretationEl.textContent = text;
}

function calculateTotalScore() {
    const total = (parseInt(document.getElementById('lad_score').value) || 0) +
                  (parseInt(document.getElementById('lcx_score').value) || 0) +
                  (parseInt(document.getElementById('rca_score').value) || 0) +
                  (parseInt(document.getElementById('lm_score').value) || 0);
    document.getElementById('total_score').textContent = total;
    updateInterpretation(total);
}
        
// --- VESSEL SIZE LOGIC ---
function updateVesselSize(arteryId) {
    const diameterInput = document.getElementById(`diameter-${arteryId}`);
    const sizeInput = document.getElementById(`size-${arteryId}`);
    const diameter = parseFloat(diameterInput.value);

    if (isNaN(diameter)) {
        sizeInput.value = '';
        return;
    }

    if (diameter < 3) {
        sizeInput.value = 'small';
    } else if (diameter >= 3 && diameter <= 5) {
        sizeInput.value = 'medium';
    } else if (diameter > 5) {
        sizeInput.value = 'large';
    } else {
         sizeInput.value = '';
    }
}

// --- LVEF LOGIC ---
function updateLvefDescription() {
    const lvefValueInput = document.getElementById('lvef_value');
    const lvefDescInput = document.getElementById('lvef_desc');
    const ef = parseInt(lvefValueInput.value);

    if (isNaN(ef)) {
        lvefDescInput.value = '';
        return;
    }

    if (ef >= 55) {
        lvefDescInput.value = 'Normal left ventricular systolic function';
    } else if (ef >= 45 && ef <= 54) {
        lvefDescInput.value = 'Mildly reduced left ventricular systolic function';
    } else if (ef >= 35 && ef <= 44) {
        lvefDescInput.value = 'Moderately reduced left ventricular systolic function';
    } else { // ef < 35
        lvefDescInput.value = 'Severely reduced left ventricular systolic function';
    }
}

// --- LESION MODAL LOGIC ---
function openLesionModal(arteryId, arteryName) {
    currentEditingArtery = arteryId;
    tempLesions = [...lesionData[arteryId]]; // Work on a copy
    document.getElementById('modalTitle').textContent = `Manage Lesions for ${arteryName}`;
    renderTempLesions();
    document.getElementById('lesionModal').style.display = 'block';
}

function closeLesionModal() {
    document.getElementById('lesionModal').style.display = 'none';
    currentEditingArtery = null;
    tempLesions = [];
}

function addLesionToModal() {
    const lesion = {
        segment: document.getElementById('lesion-segment').value,
        type: document.getElementById('lesion-type').value,
        remodeling: document.getElementById('lesion-remodeling').value,
        composition: document.getElementById('lesion-composition').value,
        attenuation: document.getElementById('lesion-attenuation').value,
        texture: document.getElementById('lesion-texture').value,
        stenosis: document.getElementById('lesion-stenosis').value,
    };

    if (Object.values(lesion).every(v => !v)) {
        alert('Please fill at least one field for the lesion.');
        return;
    }

    tempLesions.push(lesion);
    renderTempLesions();

    // Clear form fields
    document.getElementById('lesion-segment').value = '';
    document.getElementById('lesion-type').value = '';
    document.getElementById('lesion-remodeling').value = '';
    document.getElementById('lesion-composition').value = '';
    document.getElementById('lesion-attenuation').value = '';
    document.getElementById('lesion-texture').value = '';
    document.getElementById('lesion-stenosis').value = '';
}

function deleteLesionFromModal(index) {
    tempLesions.splice(index, 1);
    renderTempLesions();
}

function formatLesionSummary(lesion) {
    let parts = [];
    if (lesion.segment) parts.push(`The ${lesion.segment} segment has a`);
    else parts.push('There is a');
    
    if (lesion.type) parts.push(lesion.type);
    else parts.push('lesion');
    
    if (lesion.remodeling) parts.push(`with features of ${lesion.remodeling}.`);
    else parts.push('.');

    let plaqueDesc = [];
    if (lesion.composition) plaqueDesc.push(lesion.composition);
    if (lesion.attenuation) plaqueDesc.push(lesion.attenuation);
    if (lesion.texture) plaqueDesc.push(lesion.texture);
    if(plaqueDesc.length > 0) parts.push(plaqueDesc.join(', ') + ' plaque');

    if (lesion.stenosis) {
         if (lesion.stenosis.includes('%') || lesion.stenosis.toLowerCase().includes('cto')) {
            parts.push(`that causes ${lesion.stenosis} narrowing of the lumen.`);
        } else {
            parts.push(`with ${lesion.stenosis}.`);
        }
    }

    return parts.join(' ').replace(/\s+/g, ' ').replace(' .', '.').trim();
}

function renderTempLesions() {
    const listEl = document.getElementById('lesions-list-modal');
    listEl.innerHTML = '';
    if (tempLesions.length === 0) {
        listEl.innerHTML = '<li>No lesions added yet.</li>';
    } else {
        tempLesions.forEach((lesion, index) => {
            const summary = formatLesionSummary(lesion);
            const li = document.createElement('li');
            li.innerHTML = `<span>${summary}</span> <button class="delete-lesion-btn" onclick="deleteLesionFromModal(${index})">&times;</button>`;
            listEl.appendChild(li);
        });
    }
}

function saveLesions() {
    if (currentEditingArtery) {
        lesionData[currentEditingArtery] = [...tempLesions];
        updateArteryDescription(currentEditingArtery);
    }
    closeLesionModal();
}

function updateArteryDescription(arteryId) {
    const container = document.getElementById(`desc-${arteryId}`);
    const lesions = lesionData[arteryId];
    
    if (lesions.length === 0) {
        container.innerHTML = ''; // Clear previous lesions if any
    } else {
        const list = document.createElement('ul');
        list.className = 'lesion-summary';
        lesions.forEach(lesion => {
            const summary = lesion.custom || formatLesionSummary(lesion);
            const li = document.createElement('li');
            li.textContent = summary;
            list.appendChild(li);
        });
        container.innerHTML = '';
        container.appendChild(list);
    }
}

function applyQuickDescription(arteryId, text) {
    if (text === "") {
        lesionData[arteryId] = [];
    } else {
        lesionData[arteryId] = [{ custom: text }]; // Use a special format for quick text
    }
    // Update the findings display
    const container = document.getElementById(`desc-${arteryId}`);
    if (text) {
        container.innerHTML = `<p><em>${text}</em></p>`;
    } else {
        container.innerHTML = '';
    }
    // Clear the input after selection
    const quickDescInput = document.querySelector(`#artery-${arteryId} .actions-row .input-field`);
    if(quickDescInput) quickDescInput.value = '';
}

// --- OTHER STRUCTURES LOGIC ---
function addOtherFinding(text, summary) {
    const textarea = document.getElementById('other_structures_text');
    const currentText = textarea.value;

    if (currentText === UNREMARKABLE_TEXT || currentText.trim() === '') {
        textarea.value = `- ${text}\n`;
    } else {
        textarea.value += `- ${text}\n`;
    }
    // Store the summary for the impression
    if (!otherFindingsSummaries.includes(summary)) {
        otherFindingsSummaries.push(summary);
    }
}

function populateOtherFindingButtons() {
    const commonFindings = [
        { "label": "Pericardial Thickening", "text": "Diffuse pericardial thickening is noted, measuring up to [X] mm.", "summary": "pericardial thickening" },
        { "label": "Aortic Root Dilatation", "text": "The aortic root is dilated, measuring [X] cm at the sinuses of Valsalva.", "summary": "aortic root dilatation" },
        { "label": "Ascending Aorta Dilatation", "text": "The ascending aorta is dilated, measuring [X] cm in maximum diameter.", "summary": "ascending aorta dilatation" },
        { "label": "Pericardial Effusion", "text": "A [small/moderate/large], circumferential pericardial effusion is present.", "summary": "a pericardial effusion" },
        { "label": "LV Hypertrophy", "text": "There is concentric left ventricular hypertrophy.", "summary": "left ventricular hypertrophy" },
        { "label": "Focal LV Hypertrophy", "text": "There is focal hypertrophy of the [interventricular septum].", "summary": "focal left ventricular hypertrophy" },
        { "label": "LV Dilatation", "text": "The left ventricle is dilated.", "summary": "left ventricular dilatation" },
        { "label": "LAA Thrombus", "text": "A filling defect is noted within the left atrial appendage, suspicious for thrombus.", "summary": "a possible left atrial appendage thrombus" },
        { "label": "Patent Ductus Arteriosus", "text": "A patent ductus arteriosus is visualized connecting the proximal descending aorta and the pulmonary artery.", "summary": "a patent ductus arteriosus" },
        { "label": "Atrial Septal Defect", "text": "An atrial septal defect (ASD) is noted, likely [secundum/primum] type.", "summary": "an atrial septal defect" },
        { "label": "Patent Foramen Ovale", "text": "A patent foramen ovale (PFO) is noted, with evidence of a channel between the left and right atria.", "summary": "a patent foramen ovale" },
        { "label": "Pulmonary Embolism", "text": "There is evidence of acute pulmonary embolism, with filling defects noted in the [e.g., right main] pulmonary artery.", "summary": "acute pulmonary embolism" }
    ];
    const container = document.getElementById('other-structures-buttons');
    container.innerHTML = ''; // Clear existing buttons
    commonFindings.forEach(finding => {
        const button = document.createElement('button');
        button.className = 'finding-btn';
        button.textContent = finding.label; 
        button.onclick = () => addOtherFinding(finding.text, finding.summary); 
        container.appendChild(button);
    });
}

// --- IMPRESSION, INDICATOR & PRINTING LOGIC ---

// === FUNCTION BỊ THIẾU ĐÃ ĐƯỢC KHÔI PHỤC ===
function formatLesionForImpression(lesion, arteryId) {
    if (!lesion || !lesion.stenosis) return null;

    const severityMatch = lesion.stenosis.match(/\((.*?)\)/);
    const severity = severityMatch ? severityMatch[1].charAt(0).toUpperCase() + severityMatch[1].slice(1) : "Stenosis";
    const percentage = lesion.stenosis.split(' (')[0]; 
    const location = lesion.segment || 'unspecified segment';
    const arteryName = arteryId.toUpperCase();

    const isSignificant = lesion.stenosis.toLowerCase().includes('moderate') ||
                          lesion.stenosis.toLowerCase().includes('severe') ||
                          lesion.stenosis.toLowerCase().includes('occlusion') ||
                          lesion.stenosis.toLowerCase().includes('cto');

    if (isSignificant) {
        return `${severity} (${percentage}) stenosis in the ${location} ${arteryName}.`;
    }
    return null;
}
// === KẾT THÚC PHẦN KHÔI PHỤC ===

function generateImpressionSummary() {
    let impressionLines = [];
    let significantLesionSummaries = [];
    let hasNonObstructiveDisease = false;
    let riskLevel = 'normal'; // normal, warning, critical

    // 1. Add Calcium Score and its Interpretation
    const totalScore = parseInt(document.getElementById('total_score').textContent) || 0;
    const scoreInterpretation = document.getElementById('score_interpretation').textContent; 

    impressionLines.push(`Total Coronary Artery Calcium Score: ${totalScore}.`);
    if (scoreInterpretation) {
        impressionLines.push(scoreInterpretation); 
    }

    if (totalScore > 400) {
        riskLevel = 'critical';
    } else if (totalScore > 100) {
        riskLevel = 'warning';
    }

    // 2. Collect all lesion summaries
    Object.entries(lesionData).forEach(([arteryId, lesions]) => {
        if (lesions.length === 0) return;
        let hasAnyLesionInArtery = false;
        lesions.forEach(lesion => {
            const summary = formatLesionForImpression(lesion, arteryId);
            if (summary) {
                significantLesionSummaries.push(summary);
                riskLevel = 'critical'; // Obstructive disease is always critical
            }
            if (lesion.custom && lesion.custom.toLowerCase().includes('normal')) {
                // This is a normal vessel, do nothing
            } else if (lesion.custom || lesion.stenosis) {
                 hasAnyLesionInArtery = true;
            }
        });
         if (hasAnyLesionInArtery && significantLesionSummaries.length == 0) {
            hasNonObstructiveDisease = true;
        }
    });

    // 3. Build the coronary summary
    if (significantLesionSummaries.length > 0) {
        impressionLines.push(...significantLesionSummaries);
    } else if (hasNonObstructiveDisease) {
        impressionLines.push("Mild non-obstructive coronary artery disease.");
        if (riskLevel !== 'critical') riskLevel = 'warning'; // Non-obstructive is warning
    } else {
        impressionLines.push("Normal coronary arteries without evidence of significant atherosclerotic disease.");
    }

    // 4. Add summary of other findings
    if (otherFindingsSummaries.length > 0) {
        impressionLines.push(`Additional findings include ${otherFindingsSummaries.join(', ')}.`);
        if (otherFindingsSummaries.some(s => s.includes('pulmonary embolism') || s.includes('thrombus'))) {
            riskLevel = 'critical';
        }
    }

    // 5. Set the textarea value
    document.getElementById('impression').value = impressionLines.join('\n');
    
    // 6. Update the indicator
    updateReportIndicator(riskLevel);
    return riskLevel;
}

function updateReportIndicator(riskLevel) {
    const indicatorContainer = document.getElementById('report-indicator-container');
    const indicatorTitle = document.createElement('div');
    indicatorTitle.className = 'indicator-title';
    indicatorTitle.textContent = 'Report Indicator / Chỉ báo nguy cơ:';
    
    const indicator = document.createElement('div');
    indicator.className = 'indicator-text';

    if (riskLevel === 'critical') {
        indicator.classList.add('indicator-critical');
        indicator.textContent = 'Critical / Nguy cơ cao';
    } else if (riskLevel === 'warning') {
        indicator.classList.add('indicator-warning');
        indicator.textContent = 'Warning / Thận trọng';
    } else {
        indicator.classList.add('indicator-normal');
        indicator.textContent = 'Normal / Bình Thường';
    }
    indicatorContainer.innerHTML = ''; // Clear previous indicator
    indicatorContainer.appendChild(indicatorTitle);
    indicatorContainer.appendChild(indicator);
}


function gatherReportData() {
    const riskLevel = generateImpressionSummary();
    return {
        clinical_indication: document.querySelector('[name="indication"]').value,
        technique_hr: document.getElementById('technique_hr').value,
        medications: {
            betaloc: document.getElementById('med_betaloc').checked,
            nitro: document.getElementById('med_nitro').checked,
            other: document.getElementById('med_other').value,
        },
        technical_quality: document.getElementById('quality').value,
        calcium_scores: {
            lad: document.getElementById('lad_score').value,
            lcx: document.getElementById('lcx_score').value,
            rca: document.getElementById('rca_score').value,
            lm: document.getElementById('lm_score').value,
            total: document.getElementById('total_score').textContent,
            interpretation: document.getElementById('score_interpretation').textContent,
        },
        dominance: document.querySelector('[name="dominance"]').value,
        arteries: ['lm', 'lad', 'lcx', 'rca'].map(id => ({
            id: id,
            name: document.querySelector(`#artery-${id} td:first-child`).textContent,
            size: document.getElementById(`size-${id}`).value,
            diameter: document.getElementById(`diameter-${id}`).value,
            anatomy: document.getElementById(`anatomy-${id}`).value,
            lesions: lesionData[id].map(lesion => lesion.custom || formatLesionSummary(lesion))
        })),
        collateral_circulation: document.getElementById('collateral').value,
        cardiac_function: {
            lvef_value: document.getElementById('lvef_value').value,
            lvef_desc: document.getElementById('lvef_desc').value,
            wall_motion: document.getElementById('wall-motion').value
        },
        other_structures: document.getElementById('other_structures_text').value,
        impression: document.getElementById('impression').value,
        impression_vi: document.getElementById('impression_vi').value,
        recommendation: document.getElementById('recommendation').value,
        risk_level: riskLevel
    };
}

function prepareForPrint() {
    const reportData = gatherReportData();
    localStorage.setItem('cctaReportData', JSON.stringify(reportData));
    window.open('print_view.html', '_blank');
}

function exportToDocx() {
    const reportData = gatherReportData();
    // This function is defined in docx-exporter.js
    generateDocx(reportData);
}

// --- SAVE & RESTORE SESSION LOGIC ---
function saveReportDraft() {
    const draftData = {
        inputs: {},
        lesionData: lesionData,
        otherFindingsSummaries: otherFindingsSummaries
    };
    // Get all input, select, and textarea values
    document.querySelectorAll('input, textarea').forEach(el => {
        if (el.id) {
            // Check if the element is a checkbox and save its checked state
            if (el.type === 'checkbox') {
                draftData.inputs[el.id] = el.checked;
            } else {
                // For all other inputs, save their value
                draftData.inputs[el.id] = el.value;
            }
        }
    });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
}

function loadReportDraft(draftData) {
    // Restore all simple input values
    Object.entries(draftData.inputs).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            // Check if the element is a checkbox and restore its checked state
            if (el.type === 'checkbox') {
                el.checked = value;
            } else {
                // For all other inputs, restore their value
                el.value = value;
            }
        }
    });

    // Restore complex data
    lesionData = draftData.lesionData || { lm: [], lad: [], lcx: [], rca: [] };
    otherFindingsSummaries = draftData.otherFindingsSummaries || [];

    // Re-render dynamic parts
    Object.keys(lesionData).forEach(arteryId => {
        updateArteryDescription(arteryId);
    });

    // Recalculate dependent fields
    calculateTotalScore();
    updateLvefDescription();
    generateImpressionSummary();
}

function checkForSavedDraft() {
    const savedDraftJSON = localStorage.getItem(DRAFT_KEY);
    if (savedDraftJSON) {
        const modal = document.getElementById('restoreModal');
        modal.style.display = 'block';

        document.getElementById('restore-yes-btn').onclick = () => {
            const draftData = JSON.parse(savedDraftJSON);
            loadReportDraft(draftData);
            modal.style.display = 'none';
        };

        document.getElementById('restore-no-btn').onclick = () => {
            localStorage.removeItem(DRAFT_KEY);
            modal.style.display = 'none';
        };
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    fetch('coronary_arteries.html')
        .then(response => response.ok ? response.text() : Promise.reject('File not found'))
        .then(html => {
            document.getElementById('coronary-arteries-container').innerHTML = html;
            // Now that the template is loaded, check for a saved draft
            checkForSavedDraft();
        })
        .catch(error => {
            console.error('Error loading coronary arteries template:', error);
            document.getElementById('coronary-arteries-container').innerHTML = '<p style="color: red;">Error: Could not load the coronary arteries section.</p>';
            // Still check for draft even if template fails, as other fields can be restored
            checkForSavedDraft();
        });

    calculateTotalScore();
    updateLvefDescription();
    populateOtherFindingButtons();
    updateReportIndicator('normal'); // Initialize with normal status

    // Auto-save on any change to input fields, textareas, or select elements
    document.querySelector('.container').addEventListener('change', saveReportDraft);

    window.onclick = function(event) {
        const modal = document.getElementById('lesionModal');
        if (event.target == modal) {
            closeLesionModal();
        }
    }
});