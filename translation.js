// --- TRANSLATION DICTIONARY & LOGIC ---

const translationDictionary = {
    // === CÁC MỤC DỊCH MỚI VÀ SỬA ĐỔI ===
    "Total Coronary Artery Calcium Score:": "Tổng điểm vôi hóa động mạch vành:",
    "Interpretation: No coronary artery calcification detected. Low cardiovascular risk.": "Diễn giải: Không phát hiện vôi hóa động mạch vành. Nguy cơ tim mạch thấp.",
    "Interpretation: Minimal coronary artery calcification detected. Low cardiovascular risk.": "Diễn giải: Phát hiện vôi hóa động mạch vành tối thiểu. Nguy cơ tim mạch thấp.",
    "Interpretation: Mild coronary artery calcification detected. Moderate cardiovascular risk.": "Diễn giải: Phát hiện vôi hóa động mạch vành mức độ nhẹ. Nguy cơ tim mạch trung bình.",
    "Interpretation: Moderate coronary artery calcification detected. Moderately high cardiovascular risk.": "Diễn giải: Phát hiện vôi hóa động mạch vành mức độ trung bình. Nguy cơ tim mạch cao vừa phải.",
    "Interpretation: Severe coronary artery calcification detected. High cardiovascular risk.": "Diễn giải: Phát hiện vôi hóa động mạch vành mức độ nặng. Nguy cơ tim mạch cao.",
    
    // === CÁC MỤC HIỆN CÓ ===
    "Normal coronary arteries without evidence of significant atherosclerotic disease.": "Các động mạch vành bình thường, không có bằng chứng của bệnh lý xơ vữa có ý nghĩa.",
    "Mild non-obstructive coronary artery disease.": "Bệnh động mạch vành không tắc nghẽn mức độ nhẹ.",
    "Additional findings include": "Các phát hiện khác bao gồm",
    "Mild": "Hẹp mức độ nhẹ",
    "Mild-moderate": "Hẹp mức độ nhẹ-trung bình",
    "Moderate": "Hẹp mức độ trung bình",
    "Severe": "Hẹp mức độ nặng",
    "Subtotal occlusion": "Hẹp mức độ tắc gần hoàn toàn",
    "Total occlusion": "Hẹp mức độ tắc hoàn toàn",
    "CTO (chronic total occlusion)": "Tắc mạn tính (CTO)",
    "stenosis in the": "tại",
    "proximal": "đoạn gần",
    "mid": "đoạn giữa",
    "distal": "đoạn xa",
    "ostial": "lỗ vào",
    "proximal to mid": "đoạn gần đến đoạn giữa",
    "mid to distal": "đoạn giữa đến đoạn xa",
    "proximal to distal": "đoạn gần đến đoạn xa",
    "LAD": "động mạch liên thất trước (LAD)",
    "LCX": "động mạch mũ (LCX)",
    "RCA": "động mạch vành phải (RCA)",
    "LM": "thân chung (LM)",
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
    "acute pulmonary embolism": "thuyên tắc phổi cấp"
};

function translateImpression() {
    generateImpressionSummary(); // Ensure the English version is up-to-date
    const englishText = document.getElementById('impression').value;
    
    // Translate line by line
    const lines = englishText.split('\n');
    const translatedLines = lines.map(line => {
        // Handle the dynamic calcium score line
        if (line.startsWith('Total Coronary Artery Calcium Score:')) {
            const parts = line.split(':');
            const key = parts[0] + ':'; // "Total Coronary Artery Calcium Score:"
            const value = parts.slice(1).join(':').trim(); // The score part, e.g., "0."
            const translatedKey = translationDictionary[key] || key;
            return `${translatedKey} ${value}`;
        }
        
        // Handle lesion lines specifically with an improved regex
        if (line.includes('stenosis in the')) {
            const regex = /([\w\s-]+?)\s\((.*?)\)\sstenosis in the\s(.*?)\s(LAD|LCX|RCA|LM)\./;
            const match = line.match(regex);
            if (match) {
                const severity = translationDictionary[match[1].trim()] || match[1].trim();
                const percentage = match[2].trim();
                const location = translationDictionary[match[3].trim().toLowerCase()] || match[3].trim();
                const artery = translationDictionary[match[4].trim()] || match[4].trim();
                return `${severity} (${percentage}) tại ${location} ${artery}.`;
            }
        }
        
        // Handle "Additional findings" line as a special case
        if (line.startsWith('Additional findings include')) {
            let translatedPrefix = translationDictionary['Additional findings include'];
            let findingsPart = line.replace('Additional findings include', '').trim().replace(/\.$/, '');
            
            let individualFindings = findingsPart.split(', ');
            let translatedFindings = individualFindings.map(finding => {
                return translationDictionary[finding.trim()] || finding.trim();
            });
            
            return `${translatedPrefix} ${translatedFindings.join(', ')}.`;
        }
        
        // For all other simple, full-line matches (like the Interpretation text)
        return translationDictionary[line.trim()] || line;
    });
    
    document.getElementById('impression_vi').value = translatedLines.join('\n');
}
