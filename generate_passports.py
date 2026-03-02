import pandas as pd
import json
import re

# Read data
df = pd.read_excel('Conference_Schedule (1).xlsx', sheet_name=0)

all_suppliers = []
for index, row in df.iterrows():
    supplier_name = str(row['Supplier']).strip()
    if pd.isna(row['Supplier']) or supplier_name.lower() == 'nan' or supplier_name.lower() == 'breaks':
        continue
    all_suppliers.append(supplier_name)

# Find all operators and their meetings
operator_meetings = {}
all_operators = set()

# First pass: identify all unique operators from all cells
slots = [f'Slot_{i}' for i in range(1, 11)]
for index, row in df.iterrows():
    supplier_name = str(row['Supplier']).strip()
    if pd.isna(row['Supplier']) or supplier_name.lower() == 'nan' or supplier_name.lower() == 'breaks':
        continue
    for slot in slots:
        val = row.get(slot)
        if pd.notna(val):
            # Clean operator name
            op_name = re.sub(r'\s*\(\d+\)$', '', str(val)).strip()
            if op_name:
                all_operators.add(op_name)
                if op_name not in operator_meetings:
                    operator_meetings[op_name] = set()

# Second pass: record meetings with real suppliers
for index, row in df.iterrows():
    supplier_name = str(row['Supplier']).strip()
    if pd.isna(row['Supplier']) or supplier_name.lower() == 'nan' or supplier_name.lower() == 'breaks':
        continue
    
    for slot in slots:
        val = row.get(slot)
        if pd.notna(val):
            op_name = re.sub(r'\s*\(\d+\)$', '', str(val)).strip()
            if op_name:
                operator_meetings[op_name].add(supplier_name)

# Generate passports
passports = {}
for code in all_operators:
    # They met these suppliers
    meetings = list(operator_meetings[code])
    # They did not meet these suppliers
    hit_list = [s for s in all_suppliers if s not in operator_meetings[code]]
    
    passports[code] = {
        'hit_list': sorted(hit_list),
        'meeting_list': sorted(meetings)
    }

# Save to json
with open('data.json', 'w') as f:
    json.dump({'suppliers': sorted(all_suppliers), 'operators': passports}, f, indent=4)

print("Generated data.json successfully with", len(passports), "operators and", len(all_suppliers), "suppliers.")
