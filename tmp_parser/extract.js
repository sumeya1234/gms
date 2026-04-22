const mammoth = require("mammoth");
const pdf = require('pdf-parse');
const fs = require('fs');

async function extract() {
    try {
        const docxResult = await mammoth.extractRawText({path: "d:\\gms\\Garage managemnet system v.7.docx"});
        fs.writeFileSync("d:\\gms\\tmp_parser\\docx_text.txt", docxResult.value);
        console.log("Docx extracted");
        
        try {
            const dataBuffer = fs.readFileSync("d:\\gms\\FYP final signed2.pdf");
            const pdfResult = await pdf(dataBuffer);
            fs.writeFileSync("d:\\gms\\tmp_parser\\pdf_text.txt", pdfResult.text);
            console.log("PDF extracted");
        } catch (e) {
            console.error("PDF parsing failed:", e);
        }
    } catch(e) {
        console.error(e);
    }
}
extract();
