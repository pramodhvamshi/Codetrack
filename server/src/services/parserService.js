const fs = require('fs');
const path = require('path');

let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  // Fallback if not yet installed
}

let AdmZip;
try {
  AdmZip = require('adm-zip');
} catch (e) {
  // Fallback if not yet installed
}

/**
 * Extracts plain text from PDF or DOCX file.
 */
async function extractTextFromFile(filePath, fileType) {
  if (fileType === 'pdf') {
    if (!pdfParse) {
      pdfParse = require('pdf-parse');
    }
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || '';
  } else if (fileType === 'docx') {
    if (!AdmZip) {
      AdmZip = require('adm-zip');
    }
    const zip = new AdmZip(filePath);
    const docXml = zip.readAsText('word/document.xml');
    
    // Extract text from <w:t> XML nodes
    const matches = docXml.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (!matches) return '';
    return matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
  }
  return '';
}

/**
 * Parses contact information and technical skills from extracted resume text.
 */
async function parseResumeFile(filePath, fileType) {
  try {
    const text = await extractTextFromFile(filePath, fileType);
    if (!text) {
      return { name: '', email: '', phone: '', skills: [] };
    }

    // 1. Parse Email
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
    const emailMatch = emailRegex.exec(text);
    const email = emailMatch ? emailMatch[1].trim() : '';

    // 2. Parse Phone
    const phoneRegex = /(\+?\d[\d\s-]{8,12}\d)/g;
    const phoneMatch = phoneRegex.exec(text);
    const phone = phoneMatch ? phoneMatch[1].trim() : '';

    // 3. Parse Name (attempt to use first 2-3 words of the resume text, or before email)
    let name = '';
    const cleanLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (cleanLines.length > 0) {
      // Typically, name is on the first or second line, of size 2-4 words
      for (let i = 0; i < Math.min(cleanLines.length, 3); i++) {
        const line = cleanLines[i];
        const wordCount = line.split(/\s+/).length;
        if (wordCount >= 2 && wordCount <= 4 && !line.includes('@') && !line.includes('/') && !/education|experience|skills/i.test(line)) {
          name = line;
          break;
        }
      }
    }

    // 4. Parse Skills (keyword matching)
    const skillsList = [
      'javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'c#', 'ruby', 'go', 'rust', 'php', 'swift', 'kotlin',
      'react', 'angular', 'vue', 'next.js', 'node', 'express', 'django', 'flask', 'spring', 'laravel',
      'sql', 'mysql', 'postgresql', 'sqlite', 'mongodb', 'redis', 'cassandra', 'firebase',
      'html', 'css', 'sass', 'tailwind', 'bootstrap',
      'git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins', 'ci/cd',
      'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'data science', 'ai', 'artificial intelligence'
    ];

    const matchedSkills = [];
    const textLower = text.toLowerCase();
    skillsList.forEach(skillPattern => {
      const regex = new RegExp(`\\b${skillPattern}\\b`, 'gi');
      if (regex.test(textLower)) {
        // Format nicely
        let cleanName = skillPattern.replace('\\+', '+');
        if (cleanName === 'node') cleanName = 'Node.js';
        else if (cleanName === 'react') cleanName = 'React';
        else if (cleanName === 'html') cleanName = 'HTML';
        else if (cleanName === 'css') cleanName = 'CSS';
        else if (cleanName === 'git') cleanName = 'Git';
        else if (cleanName === 'aws') cleanName = 'AWS';
        else if (cleanName === 'sql') cleanName = 'SQL';
        else {
          cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        }
        if (!matchedSkills.includes(cleanName)) {
          matchedSkills.push(cleanName);
        }
      }
    });

    return {
      name,
      email,
      phone,
      skills: matchedSkills
    };
  } catch (err) {
    console.error('Error parsing resume file:', err);
    return { name: '', email: '', phone: '', skills: [] };
  }
}

module.exports = {
  parseResumeFile
};
