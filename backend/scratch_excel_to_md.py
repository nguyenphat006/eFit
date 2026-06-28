import pandas as pd
import sys

def convert_excel_to_md(file_path, output_path):
    try:
        xls = pd.ExcelFile(file_path)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("# Tổng hợp nội dung EPICS - Phase 1 & 2\n\n")
            f.write(f"*Được trích xuất từ file: `{file_path.split('\\')[-1]}`*\n\n")
            
            for sheet_name in xls.sheet_names:
                f.write(f"## Sheet: {sheet_name}\n\n")
                df = pd.read_excel(xls, sheet_name=sheet_name)
                
                # Drop rows and columns that are entirely NaN to clean up
                df.dropna(how='all', inplace=True)
                df.dropna(axis=1, how='all', inplace=True)
                
                # Replace newlines with <br> for markdown tables
                df = df.fillna("").astype(str).replace(r'\n', '<br>', regex=True)
                
                f.write(df.to_markdown(index=False))
                f.write("\n\n---\n\n")
                
        print(f"Successfully converted to {output_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    file_path = r"d:\Coder\Github\ERICSS\eFit\docs\NguyenDangPhat-Phase01-02.xlsx"
    output_path = r"d:\Coder\Github\ERICSS\eFit\docs\EPICS_Phase1_2.md"
    convert_excel_to_md(file_path, output_path)
