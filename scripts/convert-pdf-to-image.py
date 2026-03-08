import subprocess
import sys

subprocess.check_call([sys.executable, "-m", "pip", "install", "PyMuPDF"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

import fitz
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)

pdf_path = os.path.join(script_dir, "dashboard.pdf")
output_path = os.path.join(project_root, "public", "images", "contractor-dashboard-full.png")

print(f"Looking for PDF at: {pdf_path}")
print(f"PDF exists: {os.path.exists(pdf_path)}")
print(f"Output path: {output_path}")

doc = fitz.open(pdf_path)
page = doc[0]

mat = fitz.Matrix(2, 2)
pix = page.get_pixmap(matrix=mat)
pix.save(output_path)

doc.close()
print(f"Saved first page to {output_path}")
print(f"Size: {pix.width}x{pix.height}")
