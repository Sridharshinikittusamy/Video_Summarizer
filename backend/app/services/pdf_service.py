import os
import re
import markdown
from fpdf import FPDF, HTMLMixin
from pathlib import Path

OUTPUT_DIR = "output"

class PDF(FPDF, HTMLMixin):
    def header(self):
        # Background accent
        self.set_fill_color(212, 163, 115) # Gold
        self.rect(0, 0, 210, 5, 'F')
        
        self.set_font('Noto Sans Tamil', '', 8)
        self.set_text_color(120, 113, 108)
        self.cell(0, 10, f'Video Intelligence Report | ID: {getattr(self, "task_id", "N/A")[:8]}', align='R')
        self.ln(15)

    def footer(self):
        self.set_y(-15)
        self.set_font('Noto Sans Tamil', '', 8)
        self.set_text_color(120, 113, 108)
        self.cell(0, 10, f'Page {self.page_no()}', align='C')

def ensure_output_folder():
    Path(OUTPUT_DIR).mkdir(exist_ok=True)

def generate_pdf(task_id: str, title: str, md_content: str, quiz_json: dict | None, lang: str) -> str:
    """
    Generates a high-fidelity PDF report using FPDF2 for robust Unicode support.
    """
    ensure_output_folder()
    project_folder = f"{OUTPUT_DIR}/{task_id}"
    Path(project_folder).mkdir(parents=True, exist_ok=True)
    
    pdf_filename = "Report.pdf"
    pdf_path = f"{project_folder}/{pdf_filename}"
    
    # Path to font
    font_path = Path(__file__).parent.parent.parent / "fonts" / "NotoSansTamil-Regular.ttf"
    abs_font_path = str(font_path.absolute()).replace("\\", "/")

    # Initialize PDF
    pdf = PDF()
    pdf.task_id = task_id
    
    # Register font for all styles since we only have the regular variant
    # Registering both CamelCase and lowercase to handle FPDF2's internal HTML mapping
    for family in ["Noto Sans Tamil", "noto sans tamil"]:
        pdf.add_font(family, "", abs_font_path)
        pdf.add_font(family, "B", abs_font_path)
        pdf.add_font(family, "I", abs_font_path)
        pdf.add_font(family, "BI", abs_font_path)
    
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    
    # Title Section
    pdf.set_font("Noto Sans Tamil", size=24)
    pdf.set_text_color(212, 163, 115) # Gold
    pdf.multi_cell(0, 12, title, align='L')
    pdf.ln(5)
    
    # Header Meta
    pdf.set_font("Noto Sans Tamil", size=10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 10, f"Language: {lang} | Date: {Path(pdf_path).stat().st_ctime if Path(pdf_path).exists() else 'Today'}", ln=True)
    pdf.line(pdf.get_x(), pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y()) # Use line for drawing
    pdf.ln(10)

    # Convert Markdown to HTML for write_html
    # We use a subset of HTML tags that fpdf2 supports comfortably
    notes_html = markdown.markdown(md_content, extensions=['tables', 'fenced_code'])
    
    # Clean up HTML for fpdf2 compatibility
    # fpdf2's write_html is powerful but likes standard tags
    pdf.set_font("Noto Sans Tamil", size=11)
    pdf.set_text_color(28, 25, 23)
    pdf.write_html(notes_html)
    pdf.ln(10)

    # --- VISUAL HIGHLIGHTS ---
    frames_dir = Path(project_folder) / "frames"
    if frames_dir.exists():
        pdf.add_page()
        pdf.set_font("Noto Sans Tamil", size=18)
        pdf.set_text_color(68, 64, 60)
        pdf.cell(0, 10, "Visual Highlights", ln=True)
        pdf.ln(5)
        
        slides = sorted([f for f in frames_dir.glob("*.jpg")])
        
        col_width = (pdf.w - (pdf.l_margin + pdf.r_margin) - 10) / 2
        for i, slide in enumerate(slides):
            img_path = str(slide.absolute()).replace("\\", "/")
            
            # 2 columns
            x = pdf.l_margin + (i % 2) * (col_width + 10)
            y = pdf.get_y()
            
            # Check if we need a new page
            if y > 230: # A rough estimate for when content might overflow
                pdf.add_page()
                y = pdf.get_y()
            
            pdf.image(img_path, x=x, y=y, w=col_width)
            
            # Caption
            pdf.set_xy(x, y + (col_width * 0.5625) + 2) # 16:9 ratio assumption
            pdf.set_font("Noto Sans Tamil", size=8)
            pdf.set_text_color(120, 113, 108)
            caption = slide.stem.replace('_',' ').title()
            pdf.cell(col_width, 5, caption, align='C', ln=True)
            
            # Move to next row after every 2 images
            if i % 2 == 1:
                pdf.ln(10)
            else:
                pdf.set_y(y) # Keep y for the next sibling in the same row

    # --- QUIZ SECTION ---
    if quiz_json:
        pdf.add_page()
        pdf.set_font("Noto Sans Tamil", size=18)
        pdf.set_text_color(68, 64, 60)
        pdf.cell(0, 10, "Test Yourself", ln=True)
        pdf.ln(10)
        
        for idx, q in enumerate(quiz_json.get('questions', [])):
            # Question box
            pdf.set_fill_color(245, 245, 244)
            pdf.set_draw_color(212, 163, 115)
            pdf.set_line_width(0.5)
            
            # Calculate height needed for the question and options to draw the box
            # This is a simplified approach; for precise box drawing, one would need to
            # calculate the exact height of multi_cell content and options.
            # For now, we'll draw the left border and fill as per the instruction.
            
            pdf.set_font("Noto Sans Tamil", size=11)
            pdf.set_text_color(28, 25, 23)
            
            # Prepare question text
            question_text = f"Q{idx+1}: {q.get('q')}"
            
            # Use multi_cell for the question, drawing the left border and filling
            pdf.multi_cell(0, 8, question_text, border='L', fill=True)
            
            # Options
            pdf.set_font("Noto Sans Tamil", size=10)
            pdf.set_text_color(68, 64, 60)
            for opt in q.get('options', []):
                # Indent options and draw left border
                pdf.set_x(pdf.l_margin + 5) # Indent
                pdf.cell(0, 7, f"- {opt}", ln=True, border='L', fill=True)
            
            # Answer
            pdf.set_font("Noto Sans Tamil", size=10, style='')
            pdf.set_text_color(212, 163, 115)
            pdf.set_x(pdf.l_margin + 5) # Indent
            pdf.cell(0, 8, f"Answer: {q.get('answer')}", ln=True, border='L', fill=True)
            pdf.ln(5)

    # Output
    pdf.output(pdf_path)
    print(f"   ✅ PDF Saved via FPDF2: {pdf_path}")
    
    # Return relative URL for frontend
    return f"/static/{task_id}/{pdf_filename}"
