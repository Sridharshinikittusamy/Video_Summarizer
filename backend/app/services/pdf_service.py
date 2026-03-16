import markdown
from xhtml2pdf import pisa
from pathlib import Path
from io import BytesIO

OUTPUT_DIR = "output"

def ensure_output_folder():
    Path(OUTPUT_DIR).mkdir(exist_ok=True)

def generate_pdf(task_id: str, title: str, md_content: str, quiz_json: dict | None, lang: str) -> str:
    """
    Generates a styled PDF report using xhtml2pdf for broad platform compatibility.
    """
    ensure_output_folder()
    project_folder = f"{OUTPUT_DIR}/{task_id}"
    Path(project_folder).mkdir(parents=True, exist_ok=True)
    
    pdf_filename = "Report.pdf"
    pdf_path = f"{project_folder}/{pdf_filename}"
    
    # Convert Markdown to HTML
    notes_html = markdown.markdown(md_content, extensions=['tables', 'fenced_code'])
    
    # --- VISUALS ---
    frames_dir = Path(project_folder) / "frames"
    visuals_html = ""
    if frames_dir.exists():
        visuals_html = "<hr><h2>Visual Highlights</h2><table class='visuals-table'>"
        slides = sorted([f for f in frames_dir.glob("*.jpg")])
        for i in range(0, len(slides), 2):
            visuals_html += "<tr>"
            for j in range(2):
                if i + j < len(slides):
                    slide = slides[i + j]
                    img_path = str(slide.absolute())
                    visuals_html += f"""
                    <td class='slide-item'>
                        <img src='{img_path}' width='230'>
                        <p class='slide-caption'>{slide.stem.replace('_',' ').title()}</p>
                    </td>"""
                else:
                    visuals_html += "<td></td>"
            visuals_html += "</tr>"
        visuals_html += "</table>"

    quiz_html = ""
    if quiz_json:
        quiz_html = "<hr><h2>Test Yourself</h2>"
        for idx, q in enumerate(quiz_json.get('questions', [])):
            opts = "".join([f"<li>{o}</li>" for o in q.get('options', [])])
            quiz_html += f"""
            <div class='quiz-box'>
                <p><strong>Q{idx+1}: {q.get('q')}</strong></p>
                <ul>{opts}</ul>
                <p><em>Ans: {q.get('answer')}</em></p>
            </div>"""

    # Resolve font path
    font_path = str(Path(__file__).parent.parent.parent / "fonts" / "NotoSansTamil-Regular.ttf").replace('\\', '/')

    # Simplified CSS for xhtml2pdf
    style = f"""
        <style>
            @font-face {{
                font-family: 'Noto Sans Tamil';
                src: url('{font_path}');
            }}
            @page {{
                size: a4 portrait;
                @frame content_frame {{
                    left: 50pt; width: 495pt; top: 50pt; height: 742pt;
                }}
            }}
            body {{ 
                font-family: 'Noto Sans Tamil', Helvetica, Arial, sans-serif; 
                line-height: 1.5; 
                color: #1c1917; 
            }}
            h1 {{ color: #d4a373; font-size: 28pt; margin-bottom: 5pt; }}
            h2 {{ color: #44403c; font-size: 18pt; border-bottom: 1pt solid #e7e5e4; margin-top: 20pt; }}
            h3 {{ color: #78716c; font-size: 14pt; margin-top: 15pt; }}
            .header-meta {{
                font-size: 9pt;
                color: #78716c;
                border-bottom: 2pt solid #d4a373;
                padding-bottom: 5pt;
                margin-bottom: 20pt;
            }}
            table {{ width: 100%; border: 1pt solid #e7e5e4; margin: 15pt 0; }}
            th {{ background-color: #f5f5f4; font-weight: bold; padding: 5pt; border: 1pt solid #e7e5e4; }}
            td {{ padding: 5pt; border: 1pt solid #e7e5e4; }}
            .visuals-table {{ width: 100%; border: none; margin: 0; }}
            .visuals-table td {{ border: none; padding: 10pt; text-align: center; vertical-align: top; width: 50%; }}
            .quiz-box {{ 
                background-color: #f5f5f4; 
                padding: 10pt; 
                border-left: 5pt solid #d4a373; 
                margin: 15pt 0; 
            }}
            .slide-item {{ 
                margin-top: 10pt;
                text-align: center;
                border: 0.5pt solid #e7e5e4;
                padding: 10pt;
            }}
            .slide-caption {{ 
                font-size: 10pt; 
                color: #78716c; 
                font-weight: bold;
                margin-top: 5pt;
            }}
            img {{ display: block; margin: 0 auto; }}
        </style>
    """
    
    full_html = f"""
    <html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        {style}
    </head>
    <body>
        <div class="header-meta">Video Intelligence Report &bull; {lang} Edition &bull; ID: {task_id[:8]}</div>
        <h1>{title}</h1>
        <div class="content">
            {notes_html}
            {visuals_html}
            {quiz_html}
        </div>
    </body>
    </html>
    """
    
    # Generate PDF
    with open(pdf_path, "wb") as f:
        pisa_status = pisa.CreatePDF(full_html, dest=f)
    
    if pisa_status.err:
        print(f"   ❌ PDF Generation Error: {pisa_status.err}")
        raise Exception(f"PDF generation failed with error code {pisa_status.err}")

    print(f"   ✅ PDF Saved: {pdf_path}")
    return f"/static/{task_id}/{pdf_filename}"
