// This module uses the docx.js library to create a .docx file from the report data.

// Helper function to create a styled heading
function createHeading(text) {
    return new docx.Paragraph({
        text: text,
        heading: docx.HeadingLevel.HEADING_2,
        style: "Heading2",
    });
}

// Helper function to create a styled subsection heading
function createSubHeading(text) {
    return new docx.Paragraph({
        text: text,
        heading: docx.HeadingLevel.HEADING_3,
        style: "Heading3",
    });
}

// Helper function to create a paragraph from text, handling newlines
function createParagraph(text) {
    const lines = text.split('\n');
    const textRuns = lines.flatMap((line, index) => {
        if (index > 0) {
            return [new docx.TextRun({ text: line, break: 1 })];
        }
        return [new docx.TextRun(line)];
    });

    return new docx.Paragraph({
        children: textRuns,
        style: "Normal",
    });
}


// Main function to generate the DOCX file
async function generateDocx(reportData) {
    
    // --- Build Document Sections Array FIRST ---
    const children = [];

    // Title
    children.push(new docx.Paragraph({
        text: "Coronary Computed Tomography Angiography (CCTA) Report",
        heading: docx.HeadingLevel.TITLE,
        alignment: docx.AlignmentType.CENTER,
    }));

    // Add sections if they have content
    if (reportData.clinical_indication) children.push(createHeading("Clinical Indication"), createParagraph(reportData.clinical_indication));
    
    // Updated Technique section to include Medications
    if (reportData.technique_hr || reportData.medications) {
        let techniqueContent = [];
        if (reportData.technique_hr) {
            techniqueContent.push(`Prospective ECG-gated coronary CTA was performed. Heart rate at the time of acquisition was approximately ${reportData.technique_hr} bpm.`);
        }

        const meds = [];
        if (reportData.medications.betaloc) meds.push("Betaloc");
        if (reportData.medications.nitro) meds.push("Nitroglycerine");
        if (reportData.medications.other) meds.push(reportData.medications.other);
        
        if (meds.length > 0) {
            // Add a newline if there was previous technique text
            if(techniqueContent.length > 0) {
                 techniqueContent.push(`\n`);
            }
            techniqueContent.push(`Medications administered: ${meds.join(', ')}.`);
        }

        children.push(createHeading("Technique"), createParagraph(techniqueContent.join('')));
    }
    
    if (reportData.technical_quality) children.push(createHeading("Technical Quality"), createParagraph(reportData.technical_quality));

    // Findings Section
    const findingsChildren = [createSubHeading("1. Coronary Artery Calcium Score")];
    const scoreTable = new docx.Table({
        rows: [
            new docx.TableRow({
                children: [new docx.TableCell({ children: [new docx.Paragraph({ text: "Artery", bold: true })] }), new docx.TableCell({ children: [new docx.Paragraph({ text: "Agatston Score", bold: true })] })],
            }),
            new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Left Anterior Descending (LAD)")] }), new docx.TableCell({ children: [new docx.Paragraph(reportData.calcium_scores.lad)] })] }),
            new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Left Circumflex (LCX)")] }), new docx.TableCell({ children: [new docx.Paragraph(reportData.calcium_scores.lcx)] })] }),
            new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Right Coronary Artery (RCA)")] }), new docx.TableCell({ children: [new docx.Paragraph(reportData.calcium_scores.rca)] })] }),
            new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Left Main (LM)")] }), new docx.TableCell({ children: [new docx.Paragraph(reportData.calcium_scores.lm)] })] }),
            new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph({ text: "TOTAL", bold: true })] }), new docx.TableCell({ children: [new docx.Paragraph({ text: reportData.calcium_scores.total, bold: true, color: "C0392B" })] })] }),
        ],
        width: { size: 100, type: docx.WidthType.PERCENTAGE },
    });
    findingsChildren.push(scoreTable, new docx.Paragraph({ text: reportData.calcium_scores.interpretation, style: "Normal", run: { italics: true } }));

    // Arteries
    findingsChildren.push(createSubHeading("2. Coronary Arteries"));
    if (reportData.dominance) findingsChildren.push(new docx.Paragraph({ children: [new docx.TextRun({ text: "Dominance: ", bold: true }), new docx.TextRun(reportData.dominance)] }));
    reportData.arteries.forEach(artery => {
        if (artery.size || artery.diameter || artery.anatomy || (artery.lesions && artery.lesions.length > 0)) {
            let textRuns = [new docx.TextRun({ text: `${artery.name}: `, bold: true })];
            if (artery.size) textRuns.push(new docx.TextRun(`A ${artery.size} vessel`));
            if (artery.diameter) textRuns.push(new docx.TextRun(` with proximal diameter of ${artery.diameter} mm.`));
            if (artery.anatomy) textRuns.push(new docx.TextRun(` ${artery.anatomy}`));
            findingsChildren.push(new docx.Paragraph({ children: textRuns }));

            if (artery.lesions && artery.lesions.length > 0) {
                artery.lesions.forEach(lesion => {
                    findingsChildren.push(new docx.Paragraph({ text: lesion, bullet: { level: 0 } }));
                });
            }
        }
    });

    if (reportData.collateral_circulation) findingsChildren.push(createSubHeading("3. Collateral Circulation"), createParagraph(reportData.collateral_circulation));
    if (reportData.cardiac_function.lvef_value) {
        let cfText = `Estimated LVEF is ${reportData.cardiac_function.lvef_value}%. ${reportData.cardiac_function.lvef_desc || ''}.`;
        if (reportData.cardiac_function.wall_motion && reportData.cardiac_function.wall_motion !== "No regional wall motion abnormalities.") {
            cfText += `\n${reportData.cardiac_function.wall_motion}`;
        }
        findingsChildren.push(createSubHeading("4. Cardiac Function"), createParagraph(cfText));
    }
    const UNREMARKABLE_TEXT = "The pericardium and visualized extracardiac structures are unremarkable.";
    if (reportData.other_structures && reportData.other_structures.trim() !== UNREMARKABLE_TEXT) {
        findingsChildren.push(createSubHeading("5. Other Structures"), createParagraph(reportData.other_structures));
    }
    
    children.push(createHeading("Findings"), ...findingsChildren);

    if (reportData.impression) children.push(createHeading("Impression"), createParagraph(reportData.impression));
    if (reportData.impression_vi) children.push(createHeading("Kết luận"), createParagraph(reportData.impression_vi));
    if (reportData.recommendation) children.push(createHeading("Recommendation"), createParagraph(reportData.recommendation));

    // Report Indicator at the end
    let indicatorText, indicatorHighlightColor;
    if (reportData.risk_level === 'critical') {
        indicatorText = 'Critical / Nguy cơ cao';
        indicatorHighlightColor = 'red';
    } else if (reportData.risk_level === 'warning') {
        indicatorText = 'Warning / Thận trọng';
        indicatorHighlightColor = 'yellow';
    } else {
        indicatorText = 'Normal / Bình Thường';
        indicatorHighlightColor = 'green';
    }
    const indicator = new docx.Paragraph({
        alignment: docx.AlignmentType.CENTER,
        children: [
            new docx.TextRun({ text: "Report Indicator / Chỉ báo nguy cơ: ", bold: true }),
            new docx.TextRun({
                text: indicatorText,
                bold: true,
                highlight: indicatorHighlightColor,
            }),
        ],
    });
    children.push(indicator);

    // --- Create the Document with all sections at once ---
    const doc = new docx.Document({
        styles: {
            paragraphStyles: [
                {
                    id: "Heading2",
                    name: "Heading 2",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        size: 28, // 14pt
                        bold: true,
                        color: "0056B3",
                    },
                    paragraph: {
                        spacing: { after: 240 }, // 12pt
                    },
                },
                {
                    id: "Heading3",
                    name: "Heading 3",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        size: 24, // 12pt
                        bold: true,
                    },
                     paragraph: {
                        spacing: { after: 120 },
                    },
                },
                {
                    id: "Normal",
                    name: "Normal",
                    quickFormat: true,
                    run: {
                        size: 22, // 11pt
                    },
                    paragraph: {
                        spacing: { after: 100 },
                    },
                },
            ],
        },
        sections: [{
            properties: {},
            children: children,
        }],
    });

    // --- Generate and Download File ---
    docx.Packer.toBlob(doc).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "CCTA_Report.docx";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });
}