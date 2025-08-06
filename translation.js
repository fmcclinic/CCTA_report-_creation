// --- ADVANCED TRANSLATION DICTIONARY & LOGIC (VERSION 2.0) ---

const translationDictionary = {
    // Templates for dynamic sentences
    templates: {
        lesion: "{{severity}} ({{percentage}}) tại {{location}} {{artery}}.",
        calciumScore: "Tổng điểm vôi hóa động mạch vành: {{score}}",
    },
    // Dictionary for specific terms
    terms: {
        // Severity
        "Mild": "Hẹp mức độ nhẹ",
        "Mild-moderate": "Hẹp mức độ nhẹ-trung bình",
        "Moderate": "Hẹp mức độ trung bình",
        "Severe": "Hẹp mức độ nặng",
        "Subtotal occlusion": "Hẹp mức độ tắc gần hoàn toàn",
        "Total occlusion": "Tắc hoàn toàn",
        "CTO (chronic total occlusion)": "Tắc mạn tính (CTO)",
        // Location
        "proximal": "đoạn gần",
        "mid": "đoạn giữa",
        "distal": "đoạn xa",
        "ostial": "lỗ vào",
        "proximal to mid": "đoạn gần đến đoạn giữa",
        "mid to distal": "đoạn giữa đến đoạn xa",
        "proximal to distal": "đoạn gần đến đoạn xa",
        "unspecified segment": "phân đoạn không xác định",
        // Artery
        "LAD": "động mạch liên thất trước (LAD)",
        "LCX": "động mạch mũ (LCX)",
        "RCA": "động mạch vành phải (RCA)",
        "LM": "thân chung (LM)",
        // Other findings
        "pericardial thickening": "dày màng ngoài tim",
        "aortic root dilatation": "giãn gốc động mạch chủ",
        "ascending aorta dilatation": "giãn động mạch chủ lên",
        "a pericardial effusion": "tràn dịch màng ngoài tim",
        "left ventricular hypertrophy": "phì đại thất trái",
        "focal left ventricular hypertrophy": "phì đại thất trái cục bộ",
        "left ventricular dilatation": "giãn thất trái",
        "a possible left atrial appendage thrombus": "nghi ngờ huyết khối tiểu nhĩ trái",
        "a patent ductus arteriosus": "còn ống động mạch",
        "an atrial septal defect": "thông liên nhĩ",
        "a patent foramen ovale": "còn tồn tại lỗ bầu dục",
        "acute pulmonary embolism": "thuyên tắc phổi cấp",
    },
    // Full static sentences
    sentences: {
        "Interpretation: No coronary artery calcification detected. Low cardiovascular risk.": "Diễn giải: Không phát hiện vôi hóa động mạch vành. Nguy cơ tim mạch thấp.",
        "Interpretation: Minimal coronary artery calcification detected. Low cardiovascular risk.": "Diễn giải: Phát hiện vôi hóa động mạch vành tối thiểu. Nguy cơ tim mạch thấp.",
        "Interpretation: Mild coronary artery calcification detected. Moderate cardiovascular risk.": "Diễn giải: Phát hiện vôi hóa động mạch vành mức độ nhẹ. Nguy cơ tim mạch trung bình.",
        "Interpretation: Moderate coronary artery calcification detected. Moderately high cardiovascular risk.": "Diễn giải: Phát hiện vôi hóa động mạch vành mức độ trung bình. Nguy cơ tim mạch cao vừa phải.",
        "Interpretation: Severe coronary artery calcification detected. High cardiovascular risk.": "Diễn giải: Phát hiện vôi hóa động mạch vành mức độ nặng. Nguy cơ tim mạch cao.",
        "Normal coronary arteries without evidence of significant atherosclerotic disease.": "Các động mạch vành bình thường, không có bằng chứng của bệnh lý xơ vữa có ý nghĩa.",
        "Mild non-obstructive coronary artery disease.": "Bệnh động mạch vành không tắc nghẽn mức độ nhẹ.",
        "Additional findings include": "Các phát hiện khác bao gồm",
    }
};

function translateImpression() {
    generateImpressionSummary(); // Ensure the English version is up-to-date
    const englishText = document.getElementById('impression').value;

    const lines = englishText.split('\n').filter(line => line.trim() !== '');
    
    const translatedLines = lines.map(line => {
        // Pattern 1: Lesion sentence (e.g., "Severe (70-90%) stenosis in the proximal LAD.")
        const lesionRegex = /^(?<severity>[\w\s-]+?)\s\((?<percentage>.*?)\)\sstenosis in the\s(?<location>.*?)\s(?<artery>LAD|LCX|RCA|LM)\.$/;
        let match = line.match(lesionRegex);
        if (match) {
            const { severity, percentage, location, artery } = match.groups;
            let translated = translationDictionary.templates.lesion;
            translated = translated.replace('{{severity}}', translationDictionary.terms[severity.trim()] || severity.trim());
            translated = translated.replace('{{percentage}}', percentage);
            translated = translated.replace('{{location}}', translationDictionary.terms[location.trim()] || location.trim());
            translated = translated.replace('{{artery}}', translationDictionary.terms[artery.trim()] || artery.trim());
            return translated;
        }

        // Pattern 2: Calcium Score sentence
        const scoreRegex = /^Total Coronary Artery Calcium Score:\s(?<score>[\d.]+)\.$/;
        match = line.match(scoreRegex);
        if (match) {
            return translationDictionary.templates.calciumScore.replace('{{score}}', match.groups.score);
        }

        // Pattern 3: "Additional findings" sentence
        const findingsRegex = /^Additional findings include\s(?<findings>.*)\.$/;
        match = line.match(findingsRegex);
        if (match) {
            const translatedPrefix = translationDictionary.sentences["Additional findings include"];
            const findings = match.groups.findings.split(', ').map(f => translationDictionary.terms[f.trim()] || f.trim());
            return `${translatedPrefix} ${findings.join(', ')}.`;
        }

        // Fallback: Direct lookup for static sentences
        return translationDictionary.sentences[line.trim()] || line;
    });

    document.getElementById('impression_vi').value = translatedLines.join('\n');
}