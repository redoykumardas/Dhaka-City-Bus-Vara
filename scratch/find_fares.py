import json
import os

data_dir = "/home/redoy/Documents/Production-line/Dhaka-City-Bus-Vara/data/normalized"

def load_json(filename):
    with open(os.path.join(data_dir, filename), 'r', encoding='utf-8') as f:
        return json.load(f)

stops = load_json("1_stops.json")
routes = load_json("2_routes.json")
route_fares = load_json("4_route_fares.json")
buses = load_json("5_buses.json")
bus_routes = load_json("6_bus_routes.json")

start_ids = [20, 21, 460] # Abdullahpur variants
end_ids = [327, 13, 167] # Airport area variants

results = []
for rf in route_fares:
    if rf['from_stop_id'] in start_ids and rf['to_stop_id'] in end_ids:
        rid = rf['route_id']
        
        # Get bus names
        bus_ids = [br['bus_id'] for br in bus_routes if br['route_id'] == rid]
        bus_names = [b['name_en'] for b in buses if b['id'] in bus_ids]
        
        results.append({
            "bus_names": bus_names,
            "from": next(s['name_english'] for s in stops if s['id'] == rf['from_stop_id']),
            "to": next(s['name_english'] for s in stops if s['id'] == rf['to_stop_id']),
            "fare": rf['fare'],
            "distance_km": rf['distance_km'],
            "route_id": rid
        })

# Unique by bus names and fare
unique_results = {}
for res in results:
    if not res['bus_names']: continue
    key = (tuple(sorted(res['bus_names'])), res['fare'])
    if key not in unique_results:
        unique_results[key] = res

final_results = list(unique_results.values())
print(json.dumps(final_results, indent=2))
