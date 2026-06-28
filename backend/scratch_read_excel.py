import pandas as pd
import sys

def read_excel(file_path):
    try:
        # Read all sheets
        xls = pd.ExcelFile(file_path)
        with open("excel_output.txt", "w", encoding="utf-8") as f:
            f.write(f"Sheets found: {xls.sheet_names}\n")
            for sheet_name in xls.sheet_names:
                f.write(f"\n{'='*50}\nSheet: {sheet_name}\n{'='*50}\n")
                df = pd.read_excel(xls, sheet_name=sheet_name)
                f.write(df.to_string())
    except Exception as e:
        with open("excel_output.txt", "w", encoding="utf-8") as f:
            f.write(f"Error reading excel file: {e}")

if __name__ == "__main__":
    file_path = r"d:\Coder\Github\ERICSS\eFit\docs\NguyenDangPhat-Phase01-02.xlsx"
    read_excel(file_path)
