import json
from pathlib import Path

script_dir = Path(__file__).parent

input_file = script_dir.parent / "json" / "mathematics.json"
output_file = script_dir.parent / "json" / "math_updated.json"

print("Reading from:", input_file)
print("File size:", Path(input_file).stat().st_size, "bytes")

with open(input_file, "r", encoding="utf-8") as f:
    preview = f.read()
    print("First 300 chars of file:\n", preview[:300])

with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

for course in data.get("courses", []):
    if "duration" not in course:
        course["duration"] = "full-year"
    
    prereq = course.get("prerequisite")
    if prereq and isinstance(prereq, str):
        # Split by 'and', strip whitespace
        course["prerequisite"] = [p.strip() for p in prereq.split("and")]
    else:
        course["prerequisite"] = []

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Updated courses saved to {output_file}")
