let resumeText = "";

// Read resume file (TXT/PDF/DOCX)
async function readResumeFile(file) {
  if (!file) return "";

  if (file.type === "text/plain") {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result.toLowerCase());
      reader.readAsText(file);
    });
  } else if (file.type === "application/pdf") {
    return new Promise(async resolve => {
      const reader = new FileReader();
      reader.onload = async function () {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(" ") + " ";
        }
        resolve(text.toLowerCase());
      };
      reader.readAsArrayBuffer(file);
    });
  } else if (file.name.endsWith(".docx")) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = async function () {
        const result = await mammoth.extractRawText({ arrayBuffer: reader.result });
        resolve(result.value.toLowerCase());
      };
      reader.readAsArrayBuffer(file);
    });
  } else {
    alert("Unsupported file type!");
    return "";
  }
}

// Keyword-based and AI analysis
async function checkATS() {
  const file = document.getElementById("resumeFile").files[0];
  const jobDesc = document.getElementById("jobDesc").value.toLowerCase();

  if (!file || !jobDesc) {
    alert("Upload resume and paste job description!");
    return;
  }

  // Wait for resume text to load
  resumeText = await readResumeFile(file);

  // Frontend keyword analysis
  const jobWords = jobDesc.split(/\W+/).filter(w => w.length > 2);
  const matched = jobWords.filter(w => resumeText.includes(w));
  const missing = jobWords.filter(w => !resumeText.includes(w));
  const score = Math.round((matched.length / jobWords.length) * 100);

  document.getElementById("score").innerText = score + "%";
  document.getElementById("matched").innerText = matched.join(", ") || "None";
  document.getElementById("missing").innerText = missing.join(", ") || "None";

  // Call AI backend
  await analyzeWithAI(resumeText, jobDesc);
}

// Call AI backend
async function analyzeWithAI(resumeText, jobDescription) {
  try {
    const response = await fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, jobDescription })
    });

    const data = await response.json();
    document.getElementById("aiResults").innerText = data.result || "❌ No result from AI";

  } catch (err) {
    console.error("AI call error:", err);
    document.getElementById("aiResults").innerText = "❌ AI analysis failed. Check backend.";
  }
}
