"""
Purchase Order (PO) OCR Extraction Tool
Extracts data from PO PDFs and exports to Excel format.
"""

import os
import re
import glob
import pdfplumber
import pandas as pd
from datetime import datetime
from openpyxl import load_workbook
from openpyxl.styles import Alignment


# State codes mapping (first 2 digits of GSTIN)
STATE_CODES = {
    '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
    '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
    '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
    '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
    '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
    '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
    '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
    '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
    '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra', '29': 'Karnataka',
    '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala',
    '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman & Nicobar',
    '36': 'Telangana', '37': 'Andhra Pradesh'
}


def extract_po_data(pdf_path):
    """Extract purchase order data from a PDF file."""
    data = {
        'CHAINS': '',
        'SITE CODE': '',
        'STATE': '',
        'VENDOR CODE': '',
        'VENDOR NAME': '',
        'Sales Person': '',
        'PO NO': '',
        'PO DATE': '',
        'DELIVERY DATE': '',
        'ARTICLE DESCRIPTION': '',
        'TOTAL PCS': '',
        'BASIC PRICE WITHOUT TAX': '',
        'TOTAL BASIC PO VALUE WITHOUT TAX': '',
        'REMARKS': '',
        'GRN AMOUNT': '',
        'Price/pcs': '',
        'Actual Billing Price': '',
        'Billing price of Reliance': '',
        'Price Difference': '',
        'Remarks By SO': ''
    }
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ''
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + '\n'
            
            # Extract Chain Name (Company name after "Ship To")
            chain_match = re.search(r'Ship To\s+([\w\s]+Ltd\.?)', full_text)
            if chain_match:
                data['CHAINS'] = chain_match.group(1).strip()
            
            # Extract Site Code / Address (location details)
            # Parse the full address from the PDF text
            # The address is typically between "Ship To" company name and "CIN:"
            site_code = ''
            
            # Extract the full address block
            block_match = re.search(r'Ship To\s+(.*?)CIN:', full_text, re.DOTALL)
            if block_match:
                block = block_match.group(1)
                # Remove the company name (already captured in CHAINS)
                block = re.sub(r'Avenue Supermarts Ltd\.?', '', block)
                # Remove PO info
                block = re.sub(r'PO\s*#\s*\d+', '', block)
                block = re.sub(r'PO\s*Date\s*[\d.]+', '', block)
                block = re.sub(r'Delivery\s*Dt?\s*[\d.]+', '', block)
                # Clean up whitespace
                block = re.sub(r'\n', ' ', block)
                block = re.sub(r'\s+', ' ', block).strip()
                
                # Extract components
                parts = []
                # DMart location name
                dmart_match = re.search(r'([A-Za-z\s]+(?:DMart|Dmart|DMART))', block)
                if dmart_match:
                    parts.append(dmart_match.group(1).strip())
                    block = block.replace(dmart_match.group(1), '')
                
                # Extract remaining address parts
                # Look for patterns like "Bahadurguda, Saroor Nagar" and "LB Nagar, Ranga Reddy"
                addr_parts = re.findall(r'([A-Za-z][A-Za-z\s,]+?)(?=\s+[A-Z][a-z]+\s+\d{6}|\s*$)', block)
                for part in addr_parts:
                    cleaned = part.strip(' ,')
                    if cleaned and cleaned not in parts:
                        parts.append(cleaned)
                
                # Extract city and pincode
                city_pin = re.search(r'([A-Z][a-z]+)\s+(\d{6})', block)
                if city_pin:
                    parts.append(f"{city_pin.group(1)} - {city_pin.group(2)}")
                
                site_code = ', '.join(parts)
                # Clean up any double commas or spaces
                site_code = re.sub(r',\s*,', ',', site_code)
                site_code = re.sub(r'\s+', ' ', site_code).strip(' ,')
            
            data['SITE CODE'] = site_code
            
            # Extract PO Number
            po_match = re.search(r'PO\s*#\s*(\d+)', full_text)
            if po_match:
                data['PO NO'] = po_match.group(1)
            
            # Extract PO Date
            po_date_match = re.search(r'PO\s*Date\s*(\d{2}[./]\d{2}[./]\d{4})', full_text)
            if po_date_match:
                date_str = po_date_match.group(1).replace('.', '-').replace('/', '-')
                data['PO DATE'] = date_str
            
            # Extract Delivery Date
            delivery_match = re.search(r'Delivery\s*Dt?\s*(\d{2}[./]\d{2}[./]\d{4})', full_text)
            if delivery_match:
                date_str = delivery_match.group(1).replace('.', '-').replace('/', '-')
                data['DELIVERY DATE'] = date_str
            
            # Extract Vendor Name
            vendor_match = re.search(r'Vendor\s+([\w\s]+?)(?=\s+GSTIN|\s+Phone|\s+FSSAI|Email)', full_text)
            if vendor_match:
                data['VENDOR NAME'] = vendor_match.group(1).strip()
            else:
                # Alternative pattern
                vendor_match2 = re.search(r'Phone\s+Vendor\s+([\w\s]+?)(?=\s+GSTIN|Email|\n)', full_text)
                if vendor_match2:
                    data['VENDOR NAME'] = vendor_match2.group(1).strip()
            
            # Extract State from GSTIN (store/ship-to location)
            gstin_match = re.search(r'GSTIN[:\s]*(\d{2}[A-Z0-9]+)', full_text)
            if gstin_match:
                state_code = gstin_match.group(1)[:2]
                data['STATE'] = STATE_CODES.get(state_code, '')
            
            # Extract Vendor GSTIN/Code (vendor's GSTIN can serve as vendor code)
            vendor_gstin_match = re.search(r'GSTIN\s+(\d{2}[A-Z0-9]+)(?=\s*Sno|\s*$)', full_text, re.MULTILINE)
            if vendor_gstin_match:
                data['VENDOR CODE'] = vendor_gstin_match.group(1)
            
            # Extract Article/Product Details
            # Pattern to match article line with EAN, description, and values
            # Looking for: EAN, Description, UOM, Qty, Free, B.Price, Sp.Dis, Sch.Val, SGST, CGST, Cess, L.Price, MRP, T.Value
            article_pattern = re.search(
                r'(\d{13})\s+'  # EAN (13 digits)
                r'([\w\s\(\)]+?)\s+'  # Article description
                r'(?:EA|PC|KG|LT|MT)\s+'  # Unit of measure
                r'(\d+)\s+'  # Quantity
                r'\d+\s+'  # Free
                r'[\d.]+\s+'  # Basic Price (B.Price)
                r'[\d.]+\s+'  # Special Discount
                r'[\d.]+\s+'  # Schedule Value
                r'[\d.]+\s+'  # SGST
                r'[\d.]+\s+'  # CGST
                r'[\d.]+\s+'  # Cess
                r'([\d.]+)\s+'  # Landing Price (L.Price) - This is what we want for BASIC PRICE WITHOUT TAX
                r'[\d.]+\s+'  # MRP
                r'([\d,]+\.?\d*)',  # Total Value
                full_text
            )
            
            if article_pattern:
                data['ARTICLE DESCRIPTION'] = article_pattern.group(2).strip()
                data['TOTAL PCS'] = article_pattern.group(3)
                data['BASIC PRICE WITHOUT TAX'] = article_pattern.group(4)  # L.Price
                total_value = article_pattern.group(5).replace(',', '')
                data['TOTAL BASIC PO VALUE WITHOUT TAX'] = total_value
            else:
                # Alternative extraction using simpler patterns
                # Extract article description - more flexible pattern
                desc_match = re.search(r'(\d{13})\s+([\w\s\(\)\-/]+?)(?:\s*\[HSN|\s+EA\s+|\s+PC\s+|\s+KG\s+)', full_text)
                if desc_match:
                    data['ARTICLE DESCRIPTION'] = desc_match.group(2).strip()
                
                # Extract quantity - look for pattern after description
                qty_match = re.search(r'(?:EA|PC|KG|LT|MT)\s+(\d+)\s+\d+\s+([\d.]+)', full_text)
                if qty_match:
                    data['TOTAL PCS'] = qty_match.group(1)
                    data['BASIC PRICE WITHOUT TAX'] = qty_match.group(2)
                
                # Extract total value
                total_match = re.search(r'Total\s+(\d+)\s+([\d,]+\.?\d*)', full_text)
                if total_match:
                    if not data['TOTAL PCS']:
                        data['TOTAL PCS'] = total_match.group(1)
                    data['TOTAL BASIC PO VALUE WITHOUT TAX'] = total_match.group(2).replace(',', '')
            
            # Clean up article description - remove HSN code info and combine multi-line descriptions
            if data['ARTICLE DESCRIPTION']:
                # Check if there's a continuation of the description (e.g., PANIPURI(200G))
                desc_continuation = re.search(
                    re.escape(data['ARTICLE DESCRIPTION']) + r'.*?(?:EA|PC|KG)\s+\d+.*?\n([A-Z\(\)\d]+)\s*\[HSN',
                    full_text, re.DOTALL
                )
                if desc_continuation:
                    data['ARTICLE DESCRIPTION'] = data['ARTICLE DESCRIPTION'] + ' ' + desc_continuation.group(1).strip()
                
                data['ARTICLE DESCRIPTION'] = re.sub(r'\[HSN.*?\]', '', data['ARTICLE DESCRIPTION']).strip()
                data['ARTICLE DESCRIPTION'] = re.sub(r'\s+', ' ', data['ARTICLE DESCRIPTION'])
            
    except Exception as e:
        print(f"Error processing {pdf_path}: {str(e)}")
    
    return data


def process_po_folder(input_folder, output_file=None):
    """Process all PO PDFs in a folder and export to Excel."""
    
    # Find all PDF files (use set to avoid duplicates)
    pdf_files = set()
    for pdf in glob.glob(os.path.join(input_folder, '*.pdf')):
        pdf_files.add(os.path.abspath(pdf))
    for pdf in glob.glob(os.path.join(input_folder, '**', '*.pdf'), recursive=True):
        pdf_files.add(os.path.abspath(pdf))
    
    pdf_files = list(pdf_files)
    
    if not pdf_files:
        print(f"No PDF files found in {input_folder}")
        return None
    
    print(f"Found {len(pdf_files)} PDF file(s) to process...")
    
    # Extract data from all PDFs
    all_data = []
    for pdf_path in pdf_files:
        print(f"Processing: {os.path.basename(pdf_path)}")
        data = extract_po_data(pdf_path)
        all_data.append(data)
    
    # Create DataFrame
    df = pd.DataFrame(all_data)
    
    # Define output file if not specified
    if output_file is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = os.path.join(input_folder, f'PO_Extracted_{timestamp}.xlsx')
    
    # Export to Excel
    df.to_excel(output_file, index=False, sheet_name='PO Data')
    
    # Format the Excel file
    format_excel_output(output_file)
    
    print(f"\nExtraction complete! Output saved to: {output_file}")
    return output_file


def format_excel_output(excel_path):
    """Format the Excel output file for better readability."""
    try:
        wb = load_workbook(excel_path)
        ws = wb.active
        
        # Auto-adjust column widths
        for column in ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if cell.value:
                        max_length = max(max_length, len(str(cell.value)))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)  # Cap at 50
            ws.column_dimensions[column_letter].width = adjusted_width
        
        # Wrap text for long columns
        for row in ws.iter_rows(min_row=2):
            for cell in row:
                cell.alignment = Alignment(wrap_text=True, vertical='top')
        
        wb.save(excel_path)
    except Exception as e:
        print(f"Warning: Could not format Excel file: {str(e)}")


def main():
    """Main function to run the PO extraction tool."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Extract PO data from PDF files to Excel')
    parser.add_argument('--input', '-i', 
                        default='sample data',
                        help='Input folder containing PO PDF files (default: sample data)')
    parser.add_argument('--output', '-o',
                        help='Output Excel file path (default: auto-generated in input folder)')
    
    args = parser.parse_args()
    
    # Get the script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Resolve input folder path
    if os.path.isabs(args.input):
        input_folder = args.input
    else:
        input_folder = os.path.join(script_dir, args.input)
    
    if not os.path.exists(input_folder):
        print(f"Error: Input folder not found: {input_folder}")
        return
    
    # Process the folder
    output_file = args.output
    if output_file and not os.path.isabs(output_file):
        output_file = os.path.join(script_dir, output_file)
    
    result = process_po_folder(input_folder, output_file)
    
    if result:
        print("\nExtracted data preview:")
        df = pd.read_excel(result)
        # Show key columns
        key_cols = ['PO NO', 'PO DATE', 'VENDOR NAME', 'ARTICLE DESCRIPTION', 'TOTAL PCS', 'TOTAL BASIC PO VALUE WITHOUT TAX']
        existing_cols = [col for col in key_cols if col in df.columns]
        print(df[existing_cols].to_string(index=False))


if __name__ == '__main__':
    main()
