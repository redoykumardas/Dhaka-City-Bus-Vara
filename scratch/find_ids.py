import json
import os

data_dir = "/home/redoy/Documents/Production-line/Dhaka-City-Bus-Vara/data/normalized"

def load_json(filename):
    with open(os.path.join(data_dir, filename), 'r', encoding='utf-8') as f:
        return json.load(f)

stops = load_json("1_stops.json")

# Find IDs for Abdullahpur and Airport using both English and Bangla
abdullahpur_variants = ["abdullahpur", "আব্দুল্লাহপুর"]
airport_variants = ["airport", "বিমানবন্দর"]

abd_ids = [s['id'] for s in stops if any(v in s['name_english'].lower() or v in s['name_bangla'] for v in abdullahpur_variants)]
air_ids = [s['id'] for s in stops if any(v in s['name_english'].lower() or v in s['name_bangla'] for v in airport_variants)]

print(f"Abdullahpur IDs: {abd_ids}")
print(f"Airport IDs: {air_ids}")
