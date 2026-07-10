const fs = require('fs');
const lines = fs.readFileSync('C:\\Users\\Medha Trust\\.gemini\\antigravity-ide\\brain\\8a9978a2-8788-4672-9200-82bab03aca7e\\.system_generated\\logs\\transcript_full.jsonl', 'utf-8').trim().split('\n');
const userInputs = lines.filter(l => l.includes('"type":"USER_INPUT"')).slice(-5);
for (const l of userInputs) {
    const j = JSON.parse(l);
    console.log('====================\n' + j.content);
}
