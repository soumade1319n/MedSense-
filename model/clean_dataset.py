import csv
import os
import shutil

def main():
    src_csv = "../Symptom2Disease.csv"
    dest_dir = "./data"
    dest_raw_csv = os.path.join(dest_dir, "Symptom2Disease.csv")
    dest_clean_csv = os.path.join(dest_dir, "Symptom2Disease_clean.csv")

    # Ensure target directory exists
    os.makedirs(dest_dir, exist_ok=True)

    # Copy the raw dataset
    if os.path.exists(src_csv):
        shutil.copy(src_csv, dest_raw_csv)
        print(f"Copied raw dataset to {dest_raw_csv}")
    else:
        print(f"Warning: Source dataset not found at {src_csv}")
        # Check if it is already in the data folder
        if not os.path.exists(dest_raw_csv):
            print("Error: Could not find raw dataset anywhere.")
            return

    # Clean the dataset using standard python libraries (no pandas needed!)
    seen_texts = set()
    cleaned_rows = []

    with open(dest_raw_csv, mode="r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        
        # Identify columns
        # The CSV might have: Unnamed: 0, label, text (or in any order)
        # We need to strip whitespace and lowercase headers
        header_clean = [h.strip().lower() for h in header]
        
        try:
            label_idx = header_clean.index("label")
            text_idx = header_clean.index("text")
        except ValueError as e:
            # Fallback if names are slightly different
            print(f"Error: Could not identify 'label' and 'text' columns in header: {header}")
            return
        
        for row in reader:
            if len(row) <= max(label_idx, text_idx):
                continue
            
            label_val = row[label_idx].strip()
            text_val = row[text_idx].strip()
            
            # Drop empty label/text
            if not label_val or not text_val:
                continue
            
            # Drop duplicate texts
            if text_val in seen_texts:
                continue
            
            seen_texts.add(text_val)
            cleaned_rows.append((text_val, label_val))

    # Write cleaned rows
    with open(dest_clean_csv, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["text", "label"])
        for text, label in cleaned_rows:
            writer.writerow([text, label])

    print(f"Successfully cleaned dataset. Created {dest_clean_csv} with {len(cleaned_rows)} unique rows.")

if __name__ == "__main__":
    main()
