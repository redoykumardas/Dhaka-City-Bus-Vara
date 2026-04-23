import json
import os

data_dir = "/home/redoy/Documents/Production-line/Dhaka-City-Bus-Vara/data/normalized"

def load_json(filename):
    with open(os.path.join(data_dir, filename), 'r', encoding='utf-8') as f:
        return json.load(f)

stops = load_json("1_stops.json")
routes = load_json("2_routes.json")
route_stops = load_json("3_route_stops.json")
route_fares = load_json("4_route_fares.json")
buses = load_json("5_buses.json")
bus_routes = load_json("6_bus_routes.json")

# Find stop IDs for Abdullahpur and Airport
abdullahpur_ids = [s['id'] for s in stops if "abdullahpur" in s['name_english'].lower() and "south keraniganj" not in s['name_english'].lower()]
airport_ids = [s['id'] for s in stops if "airport" in s['name_english'].lower()]

print(f"Abdullahpur IDs: {abdullahpur_ids}")
print(f"Airport IDs: {airport_ids}")

# Find routes that pass through Abdullahpur then Airport
matching_routes = []

# Create a mapping of route_id -> list of (stop_id, sequence)
route_map = {}
for rs in route_stops:
    rid = rs['route_id']
    if rid not in route_map:
        route_map[rid] = []
    route_map[rid].append((rs['stop_id'], rs['sequence']))

for rid, sequence_list in route_map.items():
    # Sort by sequence
    sequence_list.sort(key=lambda x: x[1])
    
    stop_ids = [x[0] for x in sequence_list]
    
    # Check for any Abdullahpur -> Airport pair
    for start_id in abdullahpur_ids:
        if start_id in stop_ids:
            start_seq = next(x[1] for x in sequence_list if x[0] == start_id)
            for end_id in airport_ids:
                if end_id in stop_ids:
                    end_seq = next(x[1] for x in sequence_list if x[0] == end_id)
                    if start_seq < end_seq:
                        if rid not in matching_routes:
                            matching_routes.append((rid, start_id, end_id))

# Prepare results
results = []
for rid, start_id, end_id in matching_routes:
    # Get bus names for this route
    bus_ids = [br['bus_id'] for br in bus_routes if br['route_id'] == rid]
    bus_names = [b['name_en'] for b in buses if b['id'] in bus_ids]
    
    # Get fare
    fare_info = next((rf for rf in route_fares if rf['route_id'] == rid and rf['from_stop_id'] == start_id and rf['to_stop_id'] == end_id), None)
    
    if fare_info:
        results.append({
            "route_id": rid,
            "buses": bus_names,
            "from": next(s['name_english'] for s in stops if s['id'] == start_id),
            "to": next(s['name_english'] for s in stops if s['id'] == end_id),
            "fare": fare_info['fare'],
            "distance_km": fare_info['distance_km']
        })
    else:
        # Try to find any fare between these two stops in this route, maybe the direction in fare table is different?
        # Or maybe it's just missing in fare table but present in route stops.
        results.append({
            "route_id": rid,
            "buses": bus_names,
            "from": next(s['name_english'] for s in stops if s['id'] == start_id),
            "to": next(s['name_english'] for s in stops if s['id'] == end_id),
            "fare": "Not Found",
            "distance_km": "Not Found"
        })

# Filter out duplicates and keep only the ones with fares if possible
unique_results = {}
for res in results:
    key = tuple(sorted(res['buses']))
    if key not in unique_results or (unique_results[key]['fare'] == "Not Found" and res['fare'] != "Not Found"):
        unique_results[key] = res

final_results = list(unique_results.values())
print(json.dumps(final_results, indent=2))
